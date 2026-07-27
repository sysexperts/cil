import { writeFileSync } from "fs";
import { prisma } from "@/lib/db";
import { erzeugeBericht, type BerichtRechnung } from "@/lib/bericht";

(async () => {
  const r = await prisma.rechnung.findFirst({
    where: { nummer: "DEMO-B-2026-002" },
    include: { positionen: { orderBy: { position: "asc" } } },
  });
  if (!r) throw new Error("Demo-Rechnung nicht gefunden");
  const daten: BerichtRechnung = {
    nummer: r.nummer, datum: r.datum, quelle: r.quelle, status: r.status, ampel: r.ampel, dublette: r.dublette,
    nettoSumme: r.nettoSumme, mwstSumme: r.mwstSumme, bruttoSumme: r.bruttoSumme,
    positionen: r.positionen.map((p) => ({ position: p.position, artikelnummer: p.artikelnummer, bezeichnung: p.bezeichnung, menge: p.menge, einheit: p.einheit, einzelpreis: p.einzelpreis, positionsbetrag: p.positionsbetrag, ampel: p.ampel, abweichungen: p.abweichungen })),
  };
  const pdf = await erzeugeBericht(daten);
  writeFileSync("/tmp/bericht.pdf", Buffer.from(pdf));
  console.log("OK Bericht erzeugt, Bytes:", pdf.length, "| Positionen:", r.positionen.length);
  await prisma.$disconnect();
})();
