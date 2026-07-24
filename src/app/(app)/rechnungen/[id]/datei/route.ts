import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leseDatei } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await prisma.rechnung.findUnique({ where: { id }, select: { originalDatei: true, nummer: true } });
  if (!r?.originalDatei) return new NextResponse("Nicht gefunden", { status: 404 });
  try {
    const buf = await leseDatei(r.originalDatei);
    const array = new Uint8Array(buf);
    const istXml = r.originalDatei.toLowerCase().endsWith(".xml");
    return new NextResponse(array, {
      headers: {
        "Content-Type": istXml ? "application/xml" : "application/pdf",
        "Content-Disposition": `inline; filename="rechnung-${r.nummer ?? id}.${istXml ? "xml" : "pdf"}"`,
      },
    });
  } catch {
    return new NextResponse("Datei fehlt", { status: 404 });
  }
}
