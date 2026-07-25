// E-Mail-Benachrichtigung. Konfiguration primär aus der DB (Oberfläche),
// Fallback auf .env. Ohne Konfiguration No-Op (kein Risiko).
import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";

export type MailKonfig = {
  aktiv: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string | null;
  smtpPasswort?: string | null;
  absender?: string | null;
  empfaenger?: string | null;
  nurBeiRot: boolean;
};

/** Effektive Konfiguration: DB bevorzugt, sonst .env. */
export async function ladeMailKonfig(): Promise<MailKonfig | null> {
  try {
    const e = await prisma.mailEinstellung.findUnique({ where: { id: "default" } });
    if (e && e.aktiv && e.smtpHost && e.empfaenger) {
      return {
        aktiv: true,
        smtpHost: e.smtpHost,
        smtpPort: e.smtpPort,
        smtpUser: e.smtpUser,
        smtpPasswort: e.smtpPasswort,
        absender: e.absender,
        empfaenger: e.empfaenger,
        nurBeiRot: e.nurBeiRot,
      };
    }
  } catch {
    /* Tabelle evtl. noch nicht migriert */
  }
  // Fallback .env
  if (process.env.SMTP_HOST && process.env.NOTIFY_TO) {
    return {
      aktiv: true,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: Number(process.env.SMTP_PORT || "587"),
      smtpUser: process.env.SMTP_USER,
      smtpPasswort: process.env.SMTP_PASSWORD,
      absender: process.env.SMTP_USER,
      empfaenger: process.env.NOTIFY_TO,
      nurBeiRot: true,
    };
  }
  return null;
}

function transport(k: MailKonfig) {
  return nodemailer.createTransport({
    host: k.smtpHost,
    port: k.smtpPort,
    secure: k.smtpPort === 465,
    auth: k.smtpUser ? { user: k.smtpUser, pass: k.smtpPasswort ?? undefined } : undefined,
  });
}

/** Versendet mit expliziter Konfiguration (für Testmail). Wirft bei Fehler. */
export async function sendeMitKonfig(k: MailKonfig, betreff: string, text: string): Promise<void> {
  await transport(k).sendMail({
    from: k.absender || k.smtpUser || "rechnungspruefer@ciloglu.vapur-it.de",
    to: k.empfaenger ?? undefined,
    subject: betreff,
    text,
  });
}

/** Versendet anhand der gespeicherten Konfiguration; No-Op wenn nicht konfiguriert. */
export async function sendeBenachrichtigung(betreff: string, text: string): Promise<void> {
  const k = await ladeMailKonfig();
  if (!k) return;
  try {
    await sendeMitKonfig(k, betreff, text);
  } catch (e) {
    console.error("Benachrichtigung fehlgeschlagen:", e);
  }
}

export async function benachrichtigungAktiv(): Promise<boolean> {
  return (await ladeMailKonfig()) != null;
}
