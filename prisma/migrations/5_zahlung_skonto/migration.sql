-- AlterTable
ALTER TABLE "Rechnung" ADD COLUMN "faelligkeitAm" TIMESTAMP(3);
ALTER TABLE "Rechnung" ADD COLUMN "skontoProzent" DECIMAL(5,2);
ALTER TABLE "Rechnung" ADD COLUMN "skontoBisAm" TIMESTAMP(3);
