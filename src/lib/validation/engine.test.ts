import { describe, it, expect } from "vitest";
import { prüfeRechnung, prüfePosition, findeStammartikel, type Stammartikel } from "./engine";

const stamm: Stammartikel[] = [
  { id: "a", artikelnummer: "10001", ean: "4001", name: "Oliven", einheit: "Karton", gewichtKg: 9.6, sollPreisNetto: 28.5, preisToleranz: 2, mwstSatz: 7 },
  { id: "b", artikelnummer: "10002", name: "Feigen", einheit: "Karton", gewichtKg: 10, sollPreisNetto: 42.0, preisToleranz: 0, mwstSatz: 7 },
];

describe("findeStammartikel", () => {
  it("matcht per Artikelnummer", () => {
    expect(findeStammartikel({ artikelnummer: "10001" }, stamm)?.id).toBe("a");
  });
  it("matcht per EAN als Fallback", () => {
    expect(findeStammartikel({ ean: "4001" }, stamm)?.id).toBe("a");
  });
  it("gibt null bei unbekanntem Artikel", () => {
    expect(findeStammartikel({ artikelnummer: "99999" }, stamm)).toBeNull();
  });
});

describe("prüfePosition", () => {
  it("grün bei exaktem Preis und korrekter Rechnung", () => {
    const r = prüfePosition({ artikelnummer: "10001", menge: 2, einzelpreis: 28.5, positionsbetrag: 57.0 }, stamm, 0);
    expect(r.ampel).toBe("GRUEN");
    expect(r.matchedProduktId).toBe("a");
  });

  it("gelb bei Preisabweichung innerhalb Toleranz", () => {
    const r = prüfePosition({ artikelnummer: "10001", menge: 1, einzelpreis: 29.0, positionsbetrag: 29.0 }, stamm, 0);
    expect(r.ampel).toBe("GELB");
    expect(r.abweichungen.some((a) => a.feld === "einzelpreis")).toBe(true);
  });

  it("rot bei Preisabweichung über Toleranz", () => {
    const r = prüfePosition({ artikelnummer: "10002", menge: 1, einzelpreis: 45.0, positionsbetrag: 45.0 }, stamm, 0);
    expect(r.ampel).toBe("ROT");
  });

  it("rot bei falscher Positionsrechnung", () => {
    const r = prüfePosition({ artikelnummer: "10001", menge: 2, einzelpreis: 28.5, positionsbetrag: 99.0 }, stamm, 0);
    expect(r.ampel).toBe("ROT");
    expect(r.abweichungen.some((a) => a.feld === "positionsbetrag")).toBe(true);
  });

  it("rot bei unbekanntem Artikel", () => {
    const r = prüfePosition({ artikelnummer: "77777", menge: 1, einzelpreis: 5, positionsbetrag: 5 }, stamm, 0);
    expect(r.ampel).toBe("ROT");
    expect(r.matchedProduktId).toBeNull();
  });

  it("nutzt Effektivpreis (Sonderpreis) statt Sollpreis", () => {
    const mitSonder: Stammartikel[] = [{ ...stamm[1], effektivPreisNetto: 45.0 }];
    const r = prüfePosition({ artikelnummer: "10002", menge: 1, einzelpreis: 45.0, positionsbetrag: 45.0 }, mitSonder, 0);
    expect(r.ampel).toBe("GRUEN");
  });

  it("warnt bei Gewichtsabweichung", () => {
    const r = prüfePosition({ artikelnummer: "10002", menge: 1, einzelpreis: 42.0, positionsbetrag: 42.0, gewichtKg: 12 }, stamm, 0);
    expect(r.abweichungen.some((a) => a.feld === "gewichtKg")).toBe(true);
  });
});

describe("prüfeRechnung", () => {
  it("erkennt Brutto ≠ Netto + MwSt", () => {
    const r = prüfeRechnung(
      { nummer: "R1", datum: new Date(), nettoSumme: 100, mwstSumme: 7, bruttoSumme: 120, positionen: [] },
      stamm,
    );
    expect(r.ampel).toBe("ROT");
    expect(r.kopfAbweichungen.some((a) => a.feld === "bruttoSumme")).toBe(true);
  });

  it("grüne Gesamtampel bei korrekter Rechnung", () => {
    const r = prüfeRechnung(
      {
        nummer: "R2",
        datum: new Date(),
        ustIdNr: "DE123",
        nettoSumme: 57.0,
        mwstSumme: 3.99,
        bruttoSumme: 60.99,
        positionen: [{ artikelnummer: "10001", menge: 2, einzelpreis: 28.5, positionsbetrag: 57.0 }],
      },
      stamm,
    );
    expect(r.ampel).toBe("GRUEN");
  });

  it("warnt bei fehlender Rechnungsnummer", () => {
    const r = prüfeRechnung({ datum: new Date(), positionen: [] }, stamm);
    expect(r.kopfAbweichungen.some((a) => a.feld === "nummer")).toBe(true);
  });
});
