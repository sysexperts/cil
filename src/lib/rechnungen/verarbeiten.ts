import { prisma } from "@/lib/db";
import { speichereDatei } from "@/lib/storage";
import { extrahiereText, extrahiereZugferdXml } from "@/lib/parsing/pdf";
import { parseRechnungstext } from "@/lib/parsing/invoice";
import { parseERechnungXml, istERechnungXml } from "@/lib/parsing/xml";
import { ladeStammartikel } from "./stammdaten";
import { prüfeRechnung, type ParsedInvoice } from "@/lib/validation/engine";
import { sendeBenachrichtigung, ladeMailKonfig } from "@/lib/notify";

export type Quelle = "PDF" | "OCR" | "ZUGFERD" | "XRECHNUNG" | "MAIL" | "MANUELL";

/** Nimmt eine hochgeladene Rechnungsdatei, extrahiert, prüft und speichert sie. */
export async function verarbeiteUpload(opts: {
  buffer: Buffer;
  dateiname: string;
  quelle?: Quelle;
  userId?: string;
}): Promise<{ id: string }> {
  const { buffer, dateiname, userId } = opts;
  const istXml = dateiname.toLowerCase().endsWith(".xml");

  const relPfad = await speichereDatei(buffer, dateiname);

  let parsed: ParsedInvoice = { positionen: [] };
  let quelle: Quelle = opts.quelle ?? "PDF";

  try {
    if (istXml) {
      // Reine E-Rechnung (XRechnung/CII)
      const xml = buffer.toString("utf-8");
      const e = parseERechnungXml(xml);
      if (e) {
        parsed = e;
        quelle = istERechnungXml(xml) === "UBL" ? "XRECHNUNG" : "ZUGFERD";
      }
    } else {
      // PDF: zuerst eingebettetes ZUGFeRD-XML (zuverlässiger), sonst Textheuristik
      const xml = await extrahiereZugferdXml(buffer);
      const e = xml ? parseERechnungXml(xml) : null;
      if (e) {
        parsed = e;
        quelle = "ZUGFERD";
      } else {
        parsed = parseRechnungstext(await extrahiereText(buffer));
        quelle = "PDF";
      }
    }
  } catch {
    // Extraktion fehlgeschlagen -> leere Rechnung, manuell nachpflegbar
  }

  return persistiere(parsed, quelle, relPfad, userId);
}

/** Speichert eine geparste Rechnung inkl. Prüfergebnis (auch manuell nutzbar). */
export async function persistiere(
  parsed: ParsedInvoice,
  quelle: Quelle,
  originalDatei: string | null,
  userId?: string,
): Promise<{ id: string }> {
  const stamm = await ladeStammartikel();
  const ergebnis = prüfeRechnung(parsed, stamm);

  const rechnung = await prisma.rechnung.create({
    data: {
      nummer: parsed.nummer ?? null,
      datum: parsed.datum ? new Date(parsed.datum) : null,
      nettoSumme: parsed.nettoSumme ?? null,
      mwstSumme: parsed.mwstSumme ?? null,
      bruttoSumme: parsed.bruttoSumme ?? null,
      quelle,
      status: "EINGEGANGEN",
      ampel: ergebnis.ampel,
      originalDatei,
      positionen: {
        create: parsed.positionen.map((p, i) => {
          const pr = ergebnis.positionen[i];
          return {
            position: p.position ?? i + 1,
            artikelnummer: p.artikelnummer ?? null,
            bezeichnung: p.bezeichnung ?? null,
            menge: p.menge ?? null,
            einheit: p.einheit ?? null,
            einzelpreis: p.einzelpreis ?? null,
            positionsbetrag: p.positionsbetrag ?? null,
            gewichtKg: p.gewichtKg ?? null,
            matchedProduktId: pr?.matchedProduktId ?? null,
            ampel: pr?.ampel ?? null,
            abweichungen: pr ? (pr.abweichungen as object) : undefined,
          };
        }),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: userId ?? null,
      rechnungId: rechnung.id,
      aktion: "RECHNUNG_EINGEGANGEN",
      details: {
        quelle,
        ampel: ergebnis.ampel,
        kopfAbweichungen: ergebnis.kopfAbweichungen as object,
        positionen: parsed.positionen.length,
      },
    },
  });

  // Benachrichtigung bei Abweichungen (nur wenn konfiguriert)
  if (ergebnis.ampel !== "GRUEN") {
    const k = await ladeMailKonfig();
    if (k && (!k.nurBeiRot || ergebnis.ampel === "ROT")) {
      const url = `${process.env.APP_URL ?? ""}/rechnungen/${rechnung.id}`;
      const fehler = ergebnis.positionen
        .flatMap((p) => p.abweichungen.filter((a) => a.schwere === "error" || a.schwere === "warn").map((a) => `Pos ${p.index + 1}: ${a.nachricht}`))
        .concat(ergebnis.kopfAbweichungen.filter((a) => a.schwere !== "info").map((a) => a.nachricht));
      await sendeBenachrichtigung(
        `Rechnungsprüfung: ${ergebnis.ampel === "ROT" ? "Fehler" : "Abweichung"} in Rechnung ${parsed.nummer ?? "(ohne Nr.)"}`,
        `Bei der automatischen Prüfung wurde Folgendes festgestellt:\n\n${fehler.join("\n") || "Siehe Detailansicht."}\n\n${url}`,
      );
    }
  }

  return { id: rechnung.id };
}

/** Prüft eine bereits gespeicherte Rechnung erneut (nach Stammdaten-/Positionsänderung). */
export async function prüfeErneut(rechnungId: string, userId?: string): Promise<void> {
  const r = await prisma.rechnung.findUnique({ where: { id: rechnungId }, include: { positionen: true } });
  if (!r) return;
  const stamm = await ladeStammartikel();
  const parsed: ParsedInvoice = {
    nummer: r.nummer,
    datum: r.datum,
    nettoSumme: r.nettoSumme ? Number(r.nettoSumme) : null,
    mwstSumme: r.mwstSumme ? Number(r.mwstSumme) : null,
    bruttoSumme: r.bruttoSumme ? Number(r.bruttoSumme) : null,
    positionen: r.positionen.map((p) => ({
      position: p.position,
      artikelnummer: p.artikelnummer,
      bezeichnung: p.bezeichnung,
      menge: p.menge ? Number(p.menge) : null,
      einheit: p.einheit,
      einzelpreis: p.einzelpreis ? Number(p.einzelpreis) : null,
      positionsbetrag: p.positionsbetrag ? Number(p.positionsbetrag) : null,
      gewichtKg: p.gewichtKg ? Number(p.gewichtKg) : null,
    })),
  };
  const ergebnis = prüfeRechnung(parsed, stamm);

  await prisma.$transaction([
    prisma.rechnung.update({ where: { id: r.id }, data: { ampel: ergebnis.ampel } }),
    ...r.positionen.map((p, i) =>
      prisma.rechnungsposition.update({
        where: { id: p.id },
        data: {
          matchedProduktId: ergebnis.positionen[i]?.matchedProduktId ?? null,
          ampel: ergebnis.positionen[i]?.ampel ?? null,
          abweichungen: ergebnis.positionen[i] ? (ergebnis.positionen[i].abweichungen as object) : undefined,
        },
      }),
    ),
    prisma.auditLog.create({
      data: { userId: userId ?? null, rechnungId: r.id, aktion: "RECHNUNG_NEU_GEPRUEFT", details: { ampel: ergebnis.ampel } },
    }),
  ]);
}
