-- CreateTable
CREATE TABLE "MailEinstellung" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "aktiv" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT,
    "smtpPasswort" TEXT,
    "absender" TEXT,
    "empfaenger" TEXT,
    "nurBeiRot" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailEinstellung_pkey" PRIMARY KEY ("id")
);
