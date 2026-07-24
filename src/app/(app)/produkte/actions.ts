"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { produktSchema } from "@/lib/validation/produkt";
import * as XLSX from "xlsx";

function toDecimal(n: number | undefined): number | undefined {
  return n === undefined || isNaN(n) ? undefined : n;
}

export async function produktSpeichern(_prev: unknown, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const id = typeof raw.id === "string" && raw.id ? raw.id : null;
  const parsed = produktSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const d = parsed.data;
  const data = {
    artikelnummer: d.artikelnummer,
    ean: d.ean || null,
    name: d.name,
    kategorie: d.kategorie || null,
    marke: d.marke || null,
    einheit: d.einheit || "Stk",
    gebindeGroesse: d.gebindeGroesse || null,
    gewichtKg: toDecimal(d.gewichtKg),
    sollPreisNetto: d.sollPreisNetto,
    waehrung: d.waehrung || "EUR",
    mwstSatz: d.mwstSatz,
    preisToleranz: d.preisToleranz,
    aktiv: d.aktiv,
  };
  try {
    if (id) {
      await prisma.produkt.update({ where: { id }, data });
    } else {
      await prisma.produkt.create({ data });
    }
  } catch (e: any) {
    if (e?.code === "P2002") return { ok: false, error: "Artikelnummer existiert bereits." };
    return { ok: false, error: "Speichern fehlgeschlagen." };
  }
  revalidatePath("/produkte");
  return { ok: true, error: "" };
}

export async function produktLoeschen(formData: FormData) {
  const id = formData.get("id");
  if (typeof id === "string") {
    await prisma.produkt.delete({ where: { id } }).catch(() => {});
    revalidatePath("/produkte");
  }
}

// CSV/XLSX-Import. Spalten (Header, deutsch, flexibel):
// artikelnummer, ean, name, kategorie, marke, einheit, gebinde, gewicht_kg,
// preis_netto, mwst, toleranz
export async function produkteImportieren(_prev: unknown, formData: FormData) {
  const file = formData.get("datei");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, imported: 0, error: "Keine Datei ausgewählt." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } catch {
    return { ok: false, imported: 0, error: "Datei konnte nicht gelesen werden." };
  }

  const pick = (r: Record<string, unknown>, keys: string[]) => {
    for (const k of Object.keys(r)) {
      if (keys.includes(k.trim().toLowerCase())) return r[k];
    }
    return undefined;
  };

  let imported = 0;
  const fehler: string[] = [];
  for (const [i, r] of rows.entries()) {
    const parsed = produktSchema.safeParse({
      artikelnummer: pick(r, ["artikelnummer", "artikelnr", "art-nr", "artikel"]),
      ean: pick(r, ["ean", "gtin"]),
      name: pick(r, ["name", "bezeichnung", "artikelname"]),
      kategorie: pick(r, ["kategorie", "warengruppe"]),
      marke: pick(r, ["marke", "brand"]),
      einheit: pick(r, ["einheit", "me"]) || "Stk",
      gebindeGroesse: pick(r, ["gebinde", "gebindegroesse", "gebindegröße", "groesse", "größe"]),
      gewichtKg: pick(r, ["gewicht_kg", "gewicht", "kg", "kilo"]),
      sollPreisNetto: pick(r, ["preis_netto", "preis", "sollpreis", "netto", "einzelpreis"]),
      mwstSatz: pick(r, ["mwst", "mwst_satz", "ust", "steuer"]) ?? 7,
      preisToleranz: pick(r, ["toleranz", "preistoleranz"]) ?? 0,
      aktiv: pick(r, ["aktiv"]) ?? true,
    });
    if (!parsed.success) {
      fehler.push(`Zeile ${i + 2}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    const d = parsed.data;
    try {
      await prisma.produkt.upsert({
        where: { artikelnummer: d.artikelnummer },
        update: {
          ean: d.ean || null, name: d.name, kategorie: d.kategorie || null, marke: d.marke || null,
          einheit: d.einheit || "Stk", gebindeGroesse: d.gebindeGroesse || null,
          gewichtKg: toDecimal(d.gewichtKg), sollPreisNetto: d.sollPreisNetto,
          mwstSatz: d.mwstSatz, preisToleranz: d.preisToleranz, aktiv: d.aktiv,
        },
        create: {
          artikelnummer: d.artikelnummer, ean: d.ean || null, name: d.name,
          kategorie: d.kategorie || null, marke: d.marke || null, einheit: d.einheit || "Stk",
          gebindeGroesse: d.gebindeGroesse || null, gewichtKg: toDecimal(d.gewichtKg),
          sollPreisNetto: d.sollPreisNetto, mwstSatz: d.mwstSatz, preisToleranz: d.preisToleranz,
          aktiv: d.aktiv,
        },
      });
      imported++;
    } catch {
      fehler.push(`Zeile ${i + 2}: Speichern fehlgeschlagen`);
    }
  }
  revalidatePath("/produkte");
  return {
    ok: true,
    imported,
    error: fehler.length ? `${imported} importiert. ${fehler.length} Fehler: ${fehler.slice(0, 3).join("; ")}${fehler.length > 3 ? " …" : ""}` : "",
  };
}
