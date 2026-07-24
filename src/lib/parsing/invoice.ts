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

  return {
    nummer,
    datum,
    ustIdNr,
    lieferantName: null,
    nettoSumme: netto,
    mwstSumme: mwst,
    bruttoSumme: brutto,
    positionen,
  };
}

function betragNach(text: string, patterns: RegExp[]): number | null {
  const s = ersterTreffer(text, patterns);
  return s ? parseBetrag(s) : null;
}

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
    const gelder = zeile.match(GELD);
    if (!gelder || gelder.length < 2) continue;

    const betrag = parseBetrag(gelder[gelder.length - 1]);
    const einzelpreis = parseBetrag(gelder[gelder.length - 2]);
    if (betrag == null || einzelpreis == null) continue;

    // Artikelnummer: erstes Token mit Ziffern (mind. 3 Zeichen)
    const tokens = zeile.split(/\s+/);
    const artNr = tokens.find((t) => /^[A-Za-z0-9\-]{3,}$/.test(t) && /\d/.test(t)) ?? null;

    // Menge: kleine Zahl vor dem Einzelpreis (ganzzahlig oder 1 Nachkommastelle)
    const mengeMatch = zeile.match(/(?:^|\s)(\d{1,4}(?:[.,]\d{1,3})?)\s*(?:stk|stück|kg|kart(?:on)?|pack|x)?\s/i);
    let menge: number | null = mengeMatch ? parseBetrag(mengeMatch[1]) : null;

    // Falls Menge nicht plausibel: aus betrag/einzelpreis ableiten
    if ((menge == null || menge === 0) && einzelpreis) {
      const abgeleitet = betrag / einzelpreis;
      if (Math.abs(abgeleitet - Math.round(abgeleitet)) < 0.02) menge = Math.round(abgeleitet);
    }

    // Einheit
    const einheitMatch = zeile.match(/\b(stk|stück|kg|karton|kart|pack|palette|dose|glas|flasche)\b/i);

    // Bezeichnung: Zeile ohne Zahlen/Artikelnr grob
    const bezeichnung = zeile
      .replace(new RegExp(GELD.source, "g"), "")
      .replace(artNr ?? "", "")
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
