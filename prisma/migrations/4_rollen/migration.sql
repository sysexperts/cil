-- CreateEnum
CREATE TYPE "Rolle" AS ENUM ('ADMIN', 'FREIGEBER', 'PRUEFER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "rolle" "Rolle" NOT NULL DEFAULT 'PRUEFER';

-- Bestehende Benutzer als Admin setzen (kein Aussperren)
UPDATE "User" SET "rolle" = 'ADMIN';
