import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { erzeugeBericht, type BerichtRechnung } from "@/lib/bericht";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.rechnung.findUnique({
    where: { id },
    include: { positionen: { orderBy: { position: "asc" } } },
  });
  if (!r) return new NextResponse("Nicht gefunden", { status: 404 });

  let logo: Uint8Array | undefined;
  try {
    logo = new Uint8Array(await fs.readFile(path.join(process.cwd(), "public", "ciloglu-logo.png")));
  } catch {}

  const daten: BerichtRechnung = {
    nummer: r.nummer,
    datum: r.datum,
    quelle: r.quelle,
    status: r.status,
    ampel: r.ampel,
    dublette: r.dublette,
    nettoSumme: r.nettoSumme,
    mwstSumme: r.mwstSumme,
    bruttoSumme: r.bruttoSumme,
    positionen: r.positionen.map((p) => ({
      position: p.position,
      artikelnummer: p.artikelnummer,
      bezeichnung: p.bezeichnung,
      menge: p.menge,
      einheit: p.einheit,
      einzelpreis: p.einzelpreis,
      positionsbetrag: p.positionsbetrag,
      ampel: p.ampel,
      abweichungen: p.abweichungen,
    })),
  };

  const pdf = await erzeugeBericht(daten, logo);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pruefbericht-${r.nummer ?? id}.pdf"`,
    },
  });
}
