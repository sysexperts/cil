import { parseBetrag, parseDatum } from "./number";
import type { ParsedInvoice, ParsedPosition } from "@/lib/validation/engine";

const GELD = /-?\d{1,3}(?:[.\s]\d{3})*,\d{2}|-?\d+\.\d{2}(?!\d)/g;

function ersterTreffer(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}

/** Heuristischer Parser für deutschsprachige Rechnungstexte (PDF-Textebene). */
export function parseRechnungstext(text: string): ParsedInvoice {
  const nummer = ersterTreffer(text, [
    /Rechnung(?:s)?[-\s]?(?:nr\.?|nummer)\.?\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,})/i,
    /\bRE[-\s]?(\d{3,})/i,
    /Invoice\s*(?:no\.?|number)\s*[:#]?\s*([A-Za-z0-9\-\/]{3,})/i,
  ]);

  const datumStr = ersterTreffer(text, [
    /Rechnungs?datum\s*[:]?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,
    /Datum\s*[:]?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,
    /Date\s*[:]?\s*(\d{4}-\d{2}-\d{2})/i,
  ]);
  const datum = datumStr ? parseDatum(datumStr) : null;

  const ustIdNr = ersterTreffer(text, [
    /USt[-\s]?IdNr\.?\s*[:]?\s*([A-Z]{2}\d{6,})/i,
    /VAT\s*(?:ID|No)\.?\s*[:]?\s*([A-Z]{2}\d{6,})/i,
    /\b(DE\d{9})\b/,
  ]);

  const brutto = betragNach(text, [/(?:Gesamt|Rechnungs)betrag\s*(?:brutto)?\s*[:]?\s*€?\s*([\d.,]+)/i, /Brutto\s*[:]?\s*€?\s*([\d.,]+)/i, /Zu zahlen(?:der Betrag)?\s*[:]?\s*€?\s*([\d.,]+)/i]);
  const netto = betragNach(text, [/(?:Gesamt\s*)?Netto(?:betrag|summe)?\s*[:]?\s*€?\s*([\d.,]+)/i, /Zwischensumme\s*[:]?\s*€?\s*([\d.,]+)/i, /Nettowert\s*[:]?\s*€?\s*([\d.,]+)/i]);
  const mwst = betragNach(text, [/(?:MwSt|USt|Umsatzsteuer|Mehrwertsteuer)\.?\s*(?:\d{1,2}[.,]?\d?\s*%)?\s*[:]?\s*€?\s*([\d.,]+)/i, /zzgl\.?\s*(?:MwSt|USt)[^\d]*([\d.,]+)/i]);

  const positionen = parsePositionen(text);
  const { faelligkeitAm, skontoProzent, skontoBisAm } = parseZahlung(text, datum);
  const lieferantName = parseLieferant(text);

  return {
    nummer,
    datum,
    ustIdNr,
    lieferantName,
    nettoSumme: netto,
    mwstSumme: mwst,
    bruttoSumme: brutto,
    faelligkeitAm,
    skontoProzent,
    skontoBisAm,
    positionen,
  };
}

// Lieferant (Rechnungssteller): erste sinnvolle Zeile, die nicht der Empfänger
// (Ciloglu) oder eine Kopfzeile ist.
function parseLieferant(text: string): string | null {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
  for (const z of zeilen.slice(0, 6)) {
    if (/ciloglu/i.test(z)) continue;
    if (/(rechnung|datum|ust-?idnr|vat|an:|pos\b|artikel|betrag|seite)/i.test(z)) continue;
    if (z.length < 3 || z.length > 60) continue;
    if (/^\d/.test(z)) continue;
    return z.replace(/^An:\s*/i, "").trim();
  }
  return null;
}

function addTage(d: Date | null, tage: number): Date | null {
  if (!d) return null;
  const r = new Date(d);
  r.setDate(r.getDate() + tage);
  return r;
}

// Zahlungsziel / Fälligkeit und Skonto aus dem Text lesen.
function parseZahlung(text: string, datum: Date | null) {
  let faelligkeitAm: Date | null = null;
  // Explizites Fälligkeitsdatum
  const fMatch = ersterTreffer(text, [
    /(?:zahlbar\s+bis|f[äa]llig(?:keit)?(?:\s+am)?|zu\s+zahlen\s+bis|due\s+date)\D{0,12}(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,
  ]);
  if (fMatch) faelligkeitAm = parseDatum(fMatch);
  // Zahlungsziel in Tagen -> ab Rechnungsdatum
  if (!faelligkeitAm) {
    const ziel = ersterTreffer(text, [/Zahlungsziel\D{0,6}(\d{1,3})\s*Tage/i, /innerhalb\s+von\s+(\d{1,3})\s*Tagen\s+(?:netto|ohne\s+Abzug)/i, /(\d{1,3})\s*Tage\s*netto/i]);
    if (ziel) faelligkeitAm = addTage(datum, Number(ziel));
  }

  // Skonto: Prozentsatz + Frist
  let skontoProzent: number | null = null;
  let skontoBisAm: Date | null = null;
  const sMatch = text.match(/(\d{1,2}(?:[.,]\d)?)\s*%\s*Skonto/i) || text.match(/Skonto\D{0,8}(\d{1,2}(?:[.,]\d)?)\s*%/i);
  if (sMatch) {
    skontoProzent = parseBetrag(sMatch[1]);
    const fristTage = ersterTreffer(text, [/(?:innerhalb|binnen)\s+(?:von\s+)?(\d{1,2})\s*Tagen/i, /bei\s+Zahlung.{0,20}?(\d{1,2})\s*Tagen/i]);
    const fristDatum = ersterTreffer(text, [/Skonto.{0,40}?bis\s+(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i]);
    if (fristDatum) skontoBisAm = parseDatum(fristDatum);
    else if (fristTage) skontoBisAm = addTage(datum, Number(fristTage));
  }

  return { faelligkeitAm, skontoProzent, skontoBisAm };
}

function betragNach(text: string, patterns: RegExp[]): number | null {
  const s = ersterTreffer(text, patterns);
  return s ? parseBetrag(s) : null;
}

const GELD_TOKEN = /^-?\d{1,3}(?:[.\s]\d{3})*,\d{2}$|^-?\d+\.\d{2}$/;

// Positions-Heuristik: Zeilen mit einem Artikel-Token und >=2 Geldbeträgen.
function parsePositionen(text: string): ParsedPosition[] {
  const zeilen = text.split(/\r?\n/).map((z) => z.trim()).filter(Boolean);
  const out: ParsedPosition[] = [];
  let posZaehler = 0;

  for (const zeile of zeilen) {
    // Summen-/Kopfzeilen überspringen
    if (/(gesamt|summe|zwischensumme|mwst|ust|netto|brutto|betrag|seite|rechnung|datum|lieferung)/i.test(zeile)) {
      continue;
    }
    const tokens = zeile.split(/\s+/);
    const geldIdx = tokens.map((t, i) => (GELD_TOKEN.test(t) ? i : -1)).filter((i) => i >= 0);
    if (geldIdx.length < 2) continue;

    const epIdx = geldIdx[geldIdx.length - 2];
    const betragIdx = geldIdx[geldIdx.length - 1];
    const einzelpreis = parseBetrag(tokens[epIdx]);
    const betrag = parseBetrag(tokens[betragIdx]);
    if (betrag == null || einzelpreis == null) continue;

    // Artikelnummer: erstes Nicht-Geld-Token mit Ziffern (mind. 3 Zeichen)
    const artIdx = tokens.findIndex(
      (t, i) => !geldIdx.includes(i) && /^[A-Za-z0-9\-]{3,}$/.test(t) && /\d/.test(t),
    );
    const artNr = artIdx >= 0 ? tokens[artIdx] : null;

    // Menge: rechte Zahl vor dem Einzelpreis, nach der Artikelnummer
    let menge: number | null = null;
    for (let i = epIdx - 1; i > artIdx; i--) {
      if (/^\d{1,4}(?:[.,]\d{1,3})?$/.test(tokens[i])) {
        menge = parseBetrag(tokens[i]);
        break;
      }
    }
    // Fallback: aus Betrag/Einzelpreis ableiten
    if ((menge == null || menge === 0) && einzelpreis) {
      const abgeleitet = betrag / einzelpreis;
      if (Math.abs(abgeleitet - Math.round(abgeleitet)) < 0.02) menge = Math.round(abgeleitet);
    }

    // Einheit: Wort-Token zwischen Menge und Einzelpreis
    const einheitMatch = zeile.match(/\b(stk|stück|st|kg|karton|kart|pack|palette|dose|glas|flasche|beutel|sack)\b/i);

    const bezeichnung =
      tokens
        .filter((t, i) => i !== artIdx && !geldIdx.includes(i) && !/^\d{1,4}([.,]\d{1,3})?$/.test(t))
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 120) || null;

    posZaehler++;
    out.push({
      position: posZaehler,
      artikelnummer: artNr,
      bezeichnung,
      menge,
      einheit: einheitMatch ? einheitMatch[1] : null,
      einzelpreis,
      positionsbetrag: betrag,
    });
  }

  return out;
}
