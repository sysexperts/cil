import { describe, it, expect } from "vitest";
import { parseRechnungstext } from "./invoice";
import { parseBetrag } from "./number";

describe("parseBetrag", () => {
  it("parst deutsches Format", () => {
    expect(parseBetrag("1.234,56")).toBe(1234.56);
    expect(parseBetrag("12,50")).toBe(12.5);
    expect(parseBetrag("28,50 €")).toBe(28.5);
  });
  it("parst englisches Format", () => {
    expect(parseBetrag("1,234.56")).toBe(1234.56);
    expect(parseBetrag("12.50")).toBe(12.5);
  });
});

const beispiel = `
Ciloglu Handels GmbH
Musterlieferant OHG
USt-IdNr: DE123456789

Rechnung Nr: RE-2026-0815
Rechnungsdatum: 15.03.2026

Pos  Artikel      Bezeichnung                Menge  Einzelpreis  Betrag
1    10001        Efendiler Oliven schwarz   2 Kart   28,50       57,00
2    10002        Fig-S Trockenfeigen        1 Kart   42,00       42,00

Zwischensumme netto:   99,00
MwSt 7%:                6,93
Gesamtbetrag brutto:  105,93
`;

describe("parseRechnungstext", () => {
  const inv = parseRechnungstext(beispiel);

  it("erkennt Rechnungsnummer", () => {
    expect(inv.nummer).toMatch(/2026-0815/);
  });
  it("erkennt Datum", () => {
    expect(inv.datum).toBeInstanceOf(Date);
    expect((inv.datum as Date).getFullYear()).toBe(2026);
  });
  it("erkennt USt-IdNr", () => {
    expect(inv.ustIdNr).toBe("DE123456789");
  });
  it("erkennt Summen", () => {
    expect(inv.nettoSumme).toBe(99.0);
    expect(inv.mwstSumme).toBe(6.93);
    expect(inv.bruttoSumme).toBe(105.93);
  });
  it("extrahiert zwei Positionen mit Artikelnummer und Preis", () => {
    expect(inv.positionen.length).toBe(2);
    const p1 = inv.positionen[0];
    expect(p1.artikelnummer).toBe("10001");
    expect(p1.einzelpreis).toBe(28.5);
    expect(p1.positionsbetrag).toBe(57.0);
  });

  it("erkennt die Menge korrekt (nicht die führende Positionsnummer)", () => {
    // Zeile: '1  10001  ...  2 Kart  28,50  57,00' -> Menge 2, nicht 1
    expect(inv.positionen[0].menge).toBe(2);
    expect(inv.positionen[1].menge).toBe(1);
  });
});
