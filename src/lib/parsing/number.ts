// Deutsche/englische Zahlformate robust parsen.
// "1.234,56" -> 1234.56 ; "12,50" -> 12.5 ; "12.50" -> 12.5 ; "1,234.56" -> 1234.56
export function parseBetrag(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/[€\s]/g, "").replace(/[A-Za-z]/g, "");
  if (!s) return null;
  const hatKomma = s.includes(",");
  const hatPunkt = s.includes(".");
  if (hatKomma && hatPunkt) {
    // Letztes Trennzeichen ist der Dezimaltrenner
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", "."); // deutsch
    } else {
      s = s.replace(/,/g, ""); // englisch
    }
  } else if (hatKomma) {
    // Nur Komma -> Dezimaltrenner
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseDatum(raw: string): Date | null {
  // ISO zuerst (YYYY-MM-DD), sonst matcht das TMJ-Muster es falsch.
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return isNaN(date.getTime()) ? null : date;
  }
  const m = raw.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if (m) {
    const [, d, mo, y] = m;
    let year = Number(y);
    if (year < 100) year += 2000;
    const date = new Date(year, Number(mo) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}
