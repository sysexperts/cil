import { prisma } from "@/lib/db";
import type { Stammartikel } from "@/lib/validation/engine";

/** Lädt alle aktiven Produkte inkl. aktuell gültigem Sonderpreis (Effektivpreis). */
export async function ladeStammartikel(): Promise<Stammartikel[]> {
  const jetzt = new Date();
  const produkte = await prisma.produkt.findMany({
    where: { aktiv: true },
    include: {
      sonderpreise: {
        where: {
          AND: [
            { OR: [{ gueltigVon: null }, { gueltigVon: { lte: jetzt } }] },
            { OR: [{ gueltigBis: null }, { gueltigBis: { gte: jetzt } }] },
          ],
        },
        orderBy: { preisNetto: "asc" },
      },
    },
  });

  return produkte.map((p) => {
    const sonder = p.sonderpreise[0];
    return {
      id: p.id,
      artikelnummer: p.artikelnummer,
      ean: p.ean,
      name: p.name,
      einheit: p.einheit,
      gebindeGroesse: p.gebindeGroesse,
      gewichtKg: p.gewichtKg ? Number(p.gewichtKg) : null,
      sollPreisNetto: Number(p.sollPreisNetto),
      effektivPreisNetto: sonder ? Number(sonder.preisNetto) : Number(p.sollPreisNetto),
      preisToleranz: p.preisToleranz ? Number(p.preisToleranz) : 0,
      mwstSatz: p.mwstSatz ? Number(p.mwstSatz) : null,
    } satisfies Stammartikel;
  });
}
