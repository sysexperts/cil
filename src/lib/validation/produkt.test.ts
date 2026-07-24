import { describe, it, expect } from "vitest";
import { produktSchema, zahl } from "./produkt";

describe("zahl-Transform (Preise/Zahlen)", () => {
  const p = (v: string | number) => zahl.parse(v);

  it("liest englisches Dezimalformat korrekt (Bugfix: 28.5 darf NICHT 285 werden)", () => {
    expect(p("28.5")).toBe(28.5);
    expect(p("28.50")).toBe(28.5);
    expect(p(28.5)).toBe(28.5);
  });
  it("liest deutsches Format", () => {
    expect(p("28,50")).toBe(28.5);
    expect(p("1.234,56")).toBe(1234.56);
  });
  it("liest englisches Tausenderformat", () => {
    expect(p("1,234.56")).toBe(1234.56);
  });
});

describe("produktSchema", () => {
  it("übernimmt Preis im Punktformat unverfälscht", () => {
    const r = produktSchema.parse({ artikelnummer: "X1", name: "Test", sollPreisNetto: "9.90" });
    expect(r.sollPreisNetto).toBe(9.9);
  });
  it("verlangt Artikelnummer und Name", () => {
    expect(produktSchema.safeParse({ sollPreisNetto: "1,00" }).success).toBe(false);
  });
});
