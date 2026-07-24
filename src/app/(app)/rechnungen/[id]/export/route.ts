import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

const num = (n: unknown) => (n == null ? "" : Number(n).toFixed(2).replace(".", ","));

type Abw = { schwere: string; nachricht: string; soll?: unknown; ist?: unknown };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.rechnung.findUnique({
    where: { id },
    include: { positionen: { orderBy: { position: "asc" }, include: { matchedProdukt: true } } },
  });
  if (!r) return new Response("Nicht gefunden", { status: 404 });

  const rows: (string | number | null)[][] = [
    ["Rechnung", r.nummer ?? "", "Datum", r.datum ? new Date(r.datum).toLocaleDateString("de-DE") : "", "Status", r.status, "Prüfung", r.ampel ?? ""],
    [],
    ["Pos", "Artikelnr.", "Bezeichnung", "Menge", "Einheit", "Einzelpreis", "Betrag", "Prüfung", "Abweichungen"],
    ...r.positionen.map((p) => {
      const abw = (p.abweichungen as Abw[] | null) ?? [];
      return [
        p.position ?? "",
        p.artikelnummer ?? "",
        p.bezeichnung ?? "",
        num(p.menge),
        p.einheit ?? "",
        num(p.einzelpreis),
        num(p.positionsbetrag),
        p.ampel ?? "",
        abw.map((a) => `${a.nachricht}${a.soll != null ? ` (Soll ${a.soll} / Ist ${a.ist})` : ""}`).join(" | "),
      ];
    }),
  ];
  return csvResponse(toCsv(rows), `rechnung-${r.nummer ?? id}.csv`);
}
