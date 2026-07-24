import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

const num = (n: unknown) => (n == null ? "" : Number(n).toFixed(2).replace(".", ","));

export async function GET() {
  const rechnungen = await prisma.rechnung.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { positionen: true } } },
  });
  const rows: (string | number | null)[][] = [
    ["Nummer", "Datum", "Quelle", "Positionen", "Netto", "MwSt", "Brutto", "Prüfung", "Status"],
    ...rechnungen.map((r) => [
      r.nummer ?? "",
      r.datum ? new Date(r.datum).toLocaleDateString("de-DE") : "",
      r.quelle,
      r._count.positionen,
      num(r.nettoSumme),
      num(r.mwstSumme),
      num(r.bruttoSumme),
      r.ampel ?? "",
      r.status,
    ]),
  ];
  return csvResponse(toCsv(rows), `rechnungen-${new Date().toISOString().slice(0, 10)}.csv`);
}
