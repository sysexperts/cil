import { z } from "zod";

// Akzeptiert deutsche ("1.234,56") und englische Zahlformate.
export const zahl = z
  .union([z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "number") return v;
    const s = v.trim().replace(/\./g, "").replace(",", ".");
    return s === "" ? NaN : Number(s);
  });

export const produktSchema = z.object({
  artikelnummer: z.string().trim().min(1, "Artikelnummer erforderlich"),
  ean: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name erforderlich"),
  kategorie: z.string().trim().optional().or(z.literal("")),
  marke: z.string().trim().optional().or(z.literal("")),
  einheit: z.string().trim().default("Stk"),
  gebindeGroesse: z.string().trim().optional().or(z.literal("")),
  gewichtKg: zahl.refine((n) => isNaN(n) || n >= 0, "Ungültig").optional(),
  sollPreisNetto: zahl.refine((n) => !isNaN(n) && n >= 0, "Preis ungültig"),
  waehrung: z.string().trim().default("EUR"),
  mwstSatz: zahl.refine((n) => !isNaN(n) && n >= 0 && n <= 100, "MwSt ungültig").default(7),
  preisToleranz: zahl.refine((n) => !isNaN(n) && n >= 0 && n <= 100, "Toleranz ungültig").default(0),
  aktiv: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true" || v === "on" || v === "1").default(true),
});

export type ProduktInput = z.infer<typeof produktSchema>;
