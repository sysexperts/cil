// Live-Smoke-Test: verarbeitet ein Test-PDF komplett (Storage + Extraktion +
// Prüfung + DB-Persistierung) und gibt das Ergebnis aus. Danach optional löschen.
// Aufruf: tsx scripts/smoke-upload.ts <pfad-zur-pdf> [--keep]
import { readFileSync } from "fs";
import { verarbeiteUpload } from "@/lib/rechnungen/verarbeiten";
import { prisma } from "@/lib/db";

(async () => {
  const pfad = process.argv[2];
  const keep = process.argv.includes("--keep");
  if (!pfad) throw new Error("PDF-Pfad fehlt");
  const buffer = readFileSync(pfad);
  const { id } = await verarbeiteUpload({ buffer, dateiname: "smoke.pdf", quelle: "PDF" });
  const r = await prisma.rechnung.findUnique({ where: { id }, include: { positionen: true, auditLogs: true } });
  console.log("Rechnung angelegt:", id);
  console.log("  Nummer:", r?.nummer, "| Ampel:", r?.ampel, "| Datei:", r?.originalDatei);
  console.log("  Positionen:", r?.positionen.length, "| AuditLogs:", r?.auditLogs.length);
  r?.positionen.forEach((p) => console.log("   -", p.artikelnummer, "menge", String(p.menge), "EP", String(p.einzelpreis), "->", p.ampel));
  if (!keep) {
    await prisma.rechnung.delete({ where: { id } });
    console.log("  (Testdatensatz wieder gelöscht)");
  }
  await prisma.$disconnect();
})();
