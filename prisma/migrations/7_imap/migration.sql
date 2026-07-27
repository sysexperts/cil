-- AlterTable
ALTER TABLE "MailEinstellung" ADD COLUMN "imapAktiv" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MailEinstellung" ADD COLUMN "imapHost" TEXT;
ALTER TABLE "MailEinstellung" ADD COLUMN "imapPort" INTEGER NOT NULL DEFAULT 993;
ALTER TABLE "MailEinstellung" ADD COLUMN "imapUser" TEXT;
ALTER TABLE "MailEinstellung" ADD COLUMN "imapPasswort" TEXT;
ALTER TABLE "MailEinstellung" ADD COLUMN "imapOrdner" TEXT NOT NULL DEFAULT 'INBOX';
