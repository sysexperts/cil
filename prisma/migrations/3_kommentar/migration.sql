-- CreateTable
CREATE TABLE "Kommentar" (
    "id" TEXT NOT NULL,
    "rechnungId" TEXT NOT NULL,
    "autor" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kommentar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kommentar_rechnungId_idx" ON "Kommentar"("rechnungId");

-- AddForeignKey
ALTER TABLE "Kommentar" ADD CONSTRAINT "Kommentar_rechnungId_fkey" FOREIGN KEY ("rechnungId") REFERENCES "Rechnung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
