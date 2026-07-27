import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

// Markenrot + Ampelfarben
const ROT = rgb(0.816, 0.125, 0.184);
const INK = rgb(0.13, 0.13, 0.13);
const MUT = rgb(0.42, 0.42, 0.42);
const LINE = rgb(0.88, 0.88, 0.88);
const GRUEN = rgb(0.18, 0.62, 0.27);
const GELB = rgb(0.79, 0.55, 0.15);

// Standardschrift (WinAnsi) kennt keine türkischen Sonderzeichen -> ersetzen.
function clean(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/İ/g, "I").replace(/ı/g, "i")
    .replace(/Ş/g, "S").replace(/ş/g, "s")
    .replace(/Ğ/g, "G").replace(/ğ/g, "g")
    .replace(/[^\x00-\xFF]/g, "?");
}

const eur = (n: unknown) => (n == null ? "—" : Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

type Abw = { schwere: string; nachricht: string; soll?: unknown; ist?: unknown };

export type BerichtRechnung = {
  nummer: string | null;
  datum: Date | null;
  quelle: string;
  status: string;
  ampel: string | null;
  dublette: boolean;
  nettoSumme: unknown;
  mwstSumme: unknown;
  bruttoSumme: unknown;
  positionen: {
    position: number | null;
    artikelnummer: string | null;
    bezeichnung: string | null;
    menge: unknown;
    einheit: string | null;
    einzelpreis: unknown;
    positionsbetrag: unknown;
    ampel: string | null;
    abweichungen: unknown;
  }[];
};

const ampelText: Record<string, string> = { GRUEN: "In Ordnung", GELB: "Abweichung (Toleranz)", ROT: "Fehler festgestellt" };
const ampelFarbe = (a: string | null) => (a === "GRUEN" ? GRUEN : a === "GELB" ? GELB : a === "ROT" ? ROT : MUT);

export async function erzeugeBericht(r: BerichtRechnung, logo?: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595.28, 841.89]); // A4
  const M = 48;
  const rechts = 595.28 - M;
  let y = 841.89 - M;

  const text = (s: string, x: number, yy: number, size = 10, f: PDFFont = font, color = INK) =>
    page.drawText(clean(s), { x, y: yy, size, font: f, color });
  const rechtsText = (s: string, xr: number, yy: number, size = 10, f: PDFFont = font, color = INK) => {
    const w = f.widthOfTextAtSize(clean(s), size);
    page.drawText(clean(s), { x: xr - w, y: yy, size, font: f, color });
  };
  const linie = (yy: number, color = LINE, dick = 1) => page.drawLine({ start: { x: M, y: yy }, end: { x: rechts, y: yy }, thickness: dick, color });

  // Logo (optional)
  if (logo) {
    try {
      const img = await doc.embedPng(logo);
      const h = 34, w = (img.width / img.height) * h;
      page.drawImage(img, { x: M, y: y - h + 6, width: w, height: h });
    } catch {}
  }
  text("Prüfbericht", rechts - bold.widthOfTextAtSize("Prüfbericht", 20), y - 4, 20, bold, ROT);
  y -= 30;
  rechtsText("Rechnungseingangsprüfer — Ciloglu Handels GmbH", rechts, y, 9, font, MUT);
  y -= 12;
  linie(y, ROT, 2);
  y -= 26;

  // Kopfdaten
  const zeile = (label: string, wert: string, f: PDFFont = font) => {
    text(label, M, y, 10, font, MUT);
    text(wert, M + 130, y, 10, f, INK);
    y -= 18;
  };
  zeile("Rechnungsnummer", r.nummer ?? "(ohne Nr.)", bold);
  zeile("Rechnungsdatum", r.datum ? new Date(r.datum).toLocaleDateString("de-DE") : "—");
  zeile("Quelle", r.quelle);
  zeile("Netto / MwSt / Brutto", `${eur(r.nettoSumme)} € / ${eur(r.mwstSumme)} € / ${eur(r.bruttoSumme)} €`);

  // Gesamtergebnis-Box
  y -= 6;
  const boxH = 30;
  page.drawRectangle({ x: M, y: y - boxH + 10, width: rechts - M, height: boxH, color: rgb(0.97, 0.97, 0.97) });
  text("Gesamtergebnis:", M + 10, y - 8, 11, bold, INK);
  text(ampelText[r.ampel ?? ""] ?? "—", M + 130, y - 8, 12, bold, ampelFarbe(r.ampel));
  if (r.dublette) text("• Mögliche Dublette", M + 320, y - 8, 10, bold, ROT);
  y -= boxH + 18;

  // Positionstabelle
  text("Positionen", M, y, 13, bold, ROT);
  y -= 18;
  const cols = { pos: M, art: M + 30, bez: M + 90, menge: M + 300, ep: M + 370, betrag: M + 450, ampel: M + 470 };
  text("Pos", cols.pos, y, 9, bold, MUT);
  text("Artikel", cols.art, y, 9, bold, MUT);
  text("Bezeichnung", cols.bez, y, 9, bold, MUT);
  rechtsText("Menge", cols.menge + 30, y, 9, bold, MUT);
  rechtsText("Einzelpr.", cols.ep + 40, y, 9, bold, MUT);
  rechtsText("Betrag", rechts, y, 9, bold, MUT);
  y -= 6;
  linie(y);
  y -= 16;

  const neueSeite = () => {
    page = doc.addPage([595.28, 841.89]);
    y = 841.89 - M;
  };

  for (const p of r.positionen) {
    if (y < 90) neueSeite();
    text(String(p.position ?? ""), cols.pos, y, 9);
    text(p.artikelnummer ?? "—", cols.art, y, 9);
    text((p.bezeichnung ?? "").slice(0, 34), cols.bez, y, 9);
    rechtsText(`${eur(p.menge)} ${p.einheit ?? ""}`.trim(), cols.menge + 30, y, 9);
    rechtsText(`${eur(p.einzelpreis)} €`, cols.ep + 40, y, 9);
    rechtsText(`${eur(p.positionsbetrag)} €`, rechts, y, 9);
    // Ampelpunkt
    page.drawCircle({ x: cols.art - 12, y: y + 3, size: 3, color: ampelFarbe(p.ampel) });
    y -= 14;

    const abw = (p.abweichungen as Abw[] | null) ?? [];
    for (const a of abw.filter((x) => x.schwere !== "info")) {
      if (y < 80) neueSeite();
      const zusatz = a.soll != null ? ` (Soll: ${a.soll}, Ist: ${a.ist})` : "";
      text(`– ${a.nachricht}${zusatz}`, cols.bez, y, 8.5, font, a.schwere === "error" ? ROT : GELB);
      y -= 12;
    }
    y -= 4;
    linie(y + 6, rgb(0.94, 0.94, 0.94));
  }

  // Fußzeile
  if (y < 70) neueSeite();
  y = Math.max(y, 60);
  linie(56);
  text(`Erstellt am ${new Date().toLocaleString("de-DE")} · Automatische Prüfung gegen die Produkt-Stammdaten`, M, 44, 8, font, MUT);

  return doc.save();
}
