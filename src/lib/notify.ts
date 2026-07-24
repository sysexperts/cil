// E-Mail-Benachrichtigung. Aktiv nur wenn SMTP_HOST + NOTIFY_TO gesetzt sind,
// sonst No-Op (kein Risiko im Betrieb ohne SMTP-Konfiguration).
import nodemailer from "nodemailer";

export function benachrichtigungAktiv(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.NOTIFY_TO);
}

export async function sendeBenachrichtigung(betreff: string, text: string): Promise<void> {
  if (!benachrichtigungAktiv()) return;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || "587"),
      secure: Number(process.env.SMTP_PORT || "587") === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_USER || "rechnungspruefer@ciloglu.vapur-it.de",
      to: process.env.NOTIFY_TO,
      subject: betreff,
      text,
    });
  } catch (e) {
    console.error("Benachrichtigung fehlgeschlagen:", e);
  }
}
