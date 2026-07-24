-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RechnungQuelle" AS ENUM ('PDF', 'OCR', 'ZUGFERD', 'XRECHNUNG', 'MAIL', 'MANUELL');

-- CreateEnum
CREATE TYPE "RechnungStatus" AS ENUM ('EINGEGANGEN', 'GEPRUEFT', 'FREIGEGEBEN', 'ABGELEHNT');

-- CreateEnum
CREATE TYPE "AmpelStatus" AS ENUM ('GRUEN', 'GELB', 'ROT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lieferant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ustIdNr" TEXT,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lieferant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produkt" (
    "id" TEXT NOT NULL,
    "artikelnummer" TEXT NOT NULL,
    "ean" TEXT,
    "name" TEXT NOT NULL,
    "kategorie" TEXT,
    "marke" TEXT,
    "einheit" TEXT NOT NULL DEFAULT 'Stk',
    "gebindeGroesse" TEXT,
    "gewichtKg" DECIMAL(10,3),
    "sollPreisNetto" DECIMAL(12,4) NOT NULL,
    "waehrung" TEXT NOT NULL DEFAULT 'EUR',
    "mwstSatz" DECIMAL(5,2) NOT NULL DEFAULT 7,
    "preisToleranz" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produkt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sonderpreis" (
    "id" TEXT NOT NULL,
    "produktId" TEXT NOT NULL,
    "lieferantId" TEXT,
    "preisNetto" DECIMAL(12,4) NOT NULL,
    "gueltigVon" TIMESTAMP(3),
    "gueltigBis" TIMESTAMP(3),

    CONSTRAINT "Sonderpreis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rechnung" (
    "id" TEXT NOT NULL,
    "nummer" TEXT,
    "datum" TIMESTAMP(3),
    "lieferantId" TEXT,
    "nettoSumme" DECIMAL(12,2),
    "mwstSumme" DECIMAL(12,2),
    "bruttoSumme" DECIMAL(12,2),
    "quelle" "RechnungQuelle" NOT NULL DEFAULT 'PDF',
    "status" "RechnungStatus" NOT NULL DEFAULT 'EINGEGANGEN',
    "ampel" "AmpelStatus",
    "originalDatei" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rechnung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rechnungsposition" (
    "id" TEXT NOT NULL,
    "rechnungId" TEXT NOT NULL,
    "position" INTEGER,
    "artikelnummer" TEXT,
    "bezeichnung" TEXT,
    "menge" DECIMAL(12,3),
    "einheit" TEXT,
    "einzelpreis" DECIMAL(12,4),
    "positionsbetrag" DECIMAL(12,2),
    "gewichtKg" DECIMAL(10,3),
    "matchedProduktId" TEXT,
    "ampel" "AmpelStatus",
    "abweichungen" JSONB,

    CONSTRAINT "Rechnungsposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "rechnungId" TEXT,
    "aktion" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Produkt_artikelnummer_key" ON "Produkt"("artikelnummer");

-- CreateIndex
CREATE INDEX "Produkt_name_idx" ON "Produkt"("name");

-- CreateIndex
CREATE INDEX "Produkt_kategorie_idx" ON "Produkt"("kategorie");

-- CreateIndex
CREATE INDEX "Sonderpreis_produktId_idx" ON "Sonderpreis"("produktId");

-- CreateIndex
CREATE INDEX "Rechnung_status_idx" ON "Rechnung"("status");

-- CreateIndex
CREATE INDEX "Rechnungsposition_rechnungId_idx" ON "Rechnungsposition"("rechnungId");

-- CreateIndex
CREATE INDEX "AuditLog_rechnungId_idx" ON "AuditLog"("rechnungId");

-- AddForeignKey
ALTER TABLE "Sonderpreis" ADD CONSTRAINT "Sonderpreis_produktId_fkey" FOREIGN KEY ("produktId") REFERENCES "Produkt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sonderpreis" ADD CONSTRAINT "Sonderpreis_lieferantId_fkey" FOREIGN KEY ("lieferantId") REFERENCES "Lieferant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rechnung" ADD CONSTRAINT "Rechnung_lieferantId_fkey" FOREIGN KEY ("lieferantId") REFERENCES "Lieferant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rechnungsposition" ADD CONSTRAINT "Rechnungsposition_rechnungId_fkey" FOREIGN KEY ("rechnungId") REFERENCES "Rechnung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rechnungsposition" ADD CONSTRAINT "Rechnungsposition_matchedProduktId_fkey" FOREIGN KEY ("matchedProduktId") REFERENCES "Produkt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_rechnungId_fkey" FOREIGN KEY ("rechnungId") REFERENCES "Rechnung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 7.9.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

