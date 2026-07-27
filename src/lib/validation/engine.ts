// Deterministische Prüf-Engine: gleicht Rechnungspositionen gegen Stammdaten ab.
// Reine Funktionen ohne DB/IO -> gut testbar.

export type Ampel = "GRUEN" | "GELB" | "ROT";
export type Schwere = "info" | "warn" | "error";

export type Abweichung = {
  feld: string;
  schwere: Schwere;
  nachricht: string;
  soll?: string | number | null;
  ist?: string | number | null;
};

export type ParsedPosition = {
  position?: number | null;
  artikelnummer?: string | null;
  ean?: string | null;
  bezeichnung?: string | null;
  menge?: number | null;
  einheit?: string | null;
  einzelpreis?: number | null;
  positionsbetrag?: number | null;
  gewichtKg?: number | null;
};

export type ParsedInvoice = {
  nummer?: string | null;
  datum?: Date | string | null;
  lieferantName?: string | null;
  ustIdNr?: string | null;
  nettoSumme?: number | null;
  mwstSumme?: number | null;
  bruttoSumme?: number | null;
  faelligkeitAm?: Date | null;
  skontoProzent?: number | null;
  skontoBisAm?: Date | null;
  positionen: ParsedPosition[];
};

// Stammartikel inkl. bereits aufgelöstem Effektivpreis (Sonderpreis-Hierarchie).
export type Stammartikel = {
  id: string;
  artikelnummer: string;
  ean?: string | null;
  name: string;
  einheit: string;
  gebindeGroesse?: string | null;
  gewichtKg?: number | null;
  sollPreisNetto: number;
  effektivPreisNetto?: number | null; // z.B. gültiger Sonderpreis, sonst sollPreisNetto
  preisToleranz?: number | null; // Prozent
  mwstSatz?: number | null;
};

export type PositionResult = {
  index: number;
  ampel: Ampel;
  matchedProduktId: string | null;
  abweichungen: Abweichung[];
};

export type InvoiceResult = {
  ampel: Ampel;
  kopfAbweichungen: Abweichung[];
  positionen: PositionResult[];
};

export const RUNDUNG = 0.01; // Cent-Toleranz für Rechenprüfungen

function schwersteAmpel(abw: Abweichung[]): Ampel {
  if (abw.some((a) => a.schwere === "error")) return "ROT";
  if (abw.some((a) => a.schwere === "warn")) return "GELB";
  return "GRUEN";
}

function kombiniere(...ampeln: Ampel[]): Ampel {
  if (ampeln.includes("ROT")) return "ROT";
  if (ampeln.includes("GELB")) return "GELB";
  return "GRUEN";
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function einheitGleich(a: string, b: string): boolean {
  const na = a.trim().toLowerCase().replace(/\.$/, "");
  const nb = b.trim().toLowerCase().replace(/\.$/, "");
  if (na === nb) return true;
  const kurz = na.length <= nb.length ? na : nb;
  const lang = na.length <= nb.length ? nb : na;
  return kurz.length >= 2 && lang.startsWith(kurz);
}

/** Findet den passenden Stammartikel per Artikelnummer, sonst EAN. */
export function findeStammartikel(
  pos: ParsedPosition,
  stamm: Stammartikel[],
): Stammartikel | null {
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  if (pos.artikelnummer) {
    const byNr = stamm.find((s) => norm(s.artikelnummer) === norm(pos.artikelnummer));
    if (byNr) return byNr;
  }
  if (pos.ean) {
    const byEan = stamm.find((s) => s.ean && norm(s.ean) === norm(pos.ean));
    if (byEan) return byEan;
  }
  return null;
}

/** Prüft eine einzelne Position gegen den (ggf.) gematchten Stammartikel. */
export function prüfePosition(
  pos: ParsedPosition,
  stamm: Stammartikel[],
  index: number,
): PositionResult {
  const abw: Abweichung[] = [];
  const artikel = findeStammartikel(pos, stamm);

  // 1. Rechenprüfung Position: Menge * Einzelpreis = Positionsbetrag
  if (pos.menge != null && pos.einzelpreis != null && pos.positionsbetrag != null) {
    const erwartet = round2(pos.menge * pos.einzelpreis);
    if (Math.abs(erwartet - pos.positionsbetrag) > RUNDUNG) {
      abw.push({
        feld: "positionsbetrag",
        schwere: "error",
        nachricht: "Positionsbetrag ≠ Menge × Einzelpreis",
        soll: erwartet,
        ist: pos.positionsbetrag,
      });
    }
  }

  if (!artikel) {
    abw.push({
      feld: "artikelnummer",
      schwere: "error",
      nachricht: "Artikel nicht in den Stammdaten gefunden",
      ist: pos.artikelnummer ?? pos.bezeichnung ?? null,
    });
    return { index, ampel: schwersteAmpel(abw), matchedProduktId: null, abweichungen: abw };
  }

  // 2. Preisprüfung (mit Toleranz, Effektivpreis = Sonderpreis-Hierarchie)
  const soll = artikel.effektivPreisNetto ?? artikel.sollPreisNetto;
  const tolProzent = artikel.preisToleranz ?? 0;
  if (pos.einzelpreis != null) {
    const diff = pos.einzelpreis - soll;
    const grenze = Math.abs(soll) * (tolProzent / 100);
    if (Math.abs(diff) <= RUNDUNG) {
      // exakt
    } else if (Math.abs(diff) <= grenze + RUNDUNG) {
      abw.push({
        feld: "einzelpreis",
        schwere: "warn",
        nachricht: `Preis weicht ab (innerhalb Toleranz ${tolProzent}%)`,
        soll,
        ist: pos.einzelpreis,
      });
    } else {
      abw.push({
        feld: "einzelpreis",
        schwere: "error",
        nachricht: diff > 0 ? "Berechneter Preis zu hoch" : "Berechneter Preis zu niedrig",
        soll,
        ist: pos.einzelpreis,
      });
    }
  }

  // 3. Gewicht / Gebindegröße
  if (artikel.gewichtKg != null && pos.gewichtKg != null) {
    const gdiff = Math.abs(artikel.gewichtKg - pos.gewichtKg);
    if (gdiff > Math.max(0.005, artikel.gewichtKg * 0.02)) {
      abw.push({
        feld: "gewichtKg",
        schwere: "warn",
        nachricht: "Gewicht weicht vom Stammartikel ab",
        soll: artikel.gewichtKg,
        ist: pos.gewichtKg,
      });
    }
  }

  // 4. Einheit (tolerant: Abkürzungen wie "Kart" ↔ "Karton" gelten als gleich)
  if (artikel.einheit && pos.einheit && !einheitGleich(artikel.einheit, pos.einheit)) {
    abw.push({
      feld: "einheit",
      schwere: "info",
      nachricht: "Einheit weicht vom Stammartikel ab",
      soll: artikel.einheit,
      ist: pos.einheit,
    });
  }

  return { index, ampel: schwersteAmpel(abw), matchedProduktId: artikel.id, abweichungen: abw };
}

/** Prüft die gesamte Rechnung (Kopf + alle Positionen). */
export function prüfeRechnung(inv: ParsedInvoice, stamm: Stammartikel[]): InvoiceResult {
  const kopf: Abweichung[] = [];

  // §14 UStG Pflichtangaben (vereinfachte Prüfung)
  if (!inv.nummer) kopf.push({ feld: "nummer", schwere: "warn", nachricht: "Rechnungsnummer fehlt (§14 UStG)" });
  if (!inv.datum) kopf.push({ feld: "datum", schwere: "warn", nachricht: "Rechnungsdatum fehlt (§14 UStG)" });
  if (!inv.ustIdNr && !inv.lieferantName)
    kopf.push({ feld: "ustIdNr", schwere: "info", nachricht: "USt-IdNr./Steuernummer nicht erkannt" });

  // Summenprüfung: Netto + MwSt = Brutto
  if (inv.nettoSumme != null && inv.mwstSumme != null && inv.bruttoSumme != null) {
    const erwartet = round2(inv.nettoSumme + inv.mwstSumme);
    if (Math.abs(erwartet - inv.bruttoSumme) > RUNDUNG) {
      kopf.push({
        feld: "bruttoSumme",
        schwere: "error",
        nachricht: "Brutto ≠ Netto + MwSt",
        soll: erwartet,
        ist: inv.bruttoSumme,
      });
    }
  }

  // Summe der Positionen vs. Nettosumme
  const posSummen = inv.positionen
    .map((p) => p.positionsbetrag)
    .filter((x): x is number => x != null);
  if (posSummen.length > 0 && inv.nettoSumme != null) {
    const summe = round2(posSummen.reduce((a, b) => a + b, 0));
    if (Math.abs(summe - inv.nettoSumme) > Math.max(RUNDUNG, inv.nettoSumme * 0.01)) {
      kopf.push({
        feld: "nettoSumme",
        schwere: "warn",
        nachricht: "Summe der Positionen weicht von der Nettosumme ab",
        soll: summe,
        ist: inv.nettoSumme,
      });
    }
  }

  const positionen = inv.positionen.map((p, i) => prüfePosition(p, stamm, i));
  const ampel = kombiniere(schwersteAmpel(kopf), ...positionen.map((p) => p.ampel));

  return { ampel, kopfAbweichungen: kopf, positionen };
}
