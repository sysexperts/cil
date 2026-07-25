"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sendeMitKonfig, type MailKonfig } from "@/lib/notify";

function konfigAusForm(formData: FormData, bestehendesPasswort?: string | null): MailKonfig {
  const passwortEingabe = String(formData.get("smtpPasswort") ?? "");
  return {
    aktiv: formData.get("aktiv") === "on",
    smtpHost: String(formData.get("smtpHost") ?? "").trim(),
    smtpPort: Number(formData.get("smtpPort") ?? "587") || 587,
    smtpUser: String(formData.get("smtpUser") ?? "").trim() || null,
    // Leeres Passwortfeld -> bestehendes beibehalten
    smtpPasswort: passwortEingabe ? passwortEingabe : (bestehendesPasswort ?? null),
    absender: String(formData.get("absender") ?? "").trim() || null,
    empfaenger: String(formData.get("empfaenger") ?? "").trim() || null,
    nurBeiRot: formData.get("nurBeiRot") === "on",
  };
}

export async function mailKonfigSpeichern(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const bestehend = await prisma.mailEinstellung.findUnique({ where: { id: "default" } });
  const k = konfigAusForm(formData, bestehend?.smtpPasswort);

  if (k.aktiv && (!k.smtpHost || !k.empfaenger)) {
    return { ok: false, error: "Für aktive Benachrichtigung sind SMTP-Server und Empfänger nötig." };
  }

  const daten = {
    aktiv: k.aktiv,
    smtpHost: k.smtpHost || null,
    smtpPort: k.smtpPort,
    smtpUser: k.smtpUser,
    smtpPasswort: k.smtpPasswort,
    absender: k.absender,
    empfaenger: k.empfaenger,
    nurBeiRot: k.nurBeiRot,
  };
  await prisma.mailEinstellung.upsert({
    where: { id: "default" },
    update: daten,
    create: { id: "default", ...daten },
  });
  await prisma.auditLog.create({ data: { userId: user.sub, aktion: "MAIL_KONFIG_GEAENDERT", details: { aktiv: k.aktiv, host: k.smtpHost } } });
  revalidatePath("/einstellungen");
  return { ok: true, error: "" };
}

export async function testmailSenden(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const bestehend = await prisma.mailEinstellung.findUnique({ where: { id: "default" } });
  const k = konfigAusForm(formData, bestehend?.smtpPasswort);
  if (!k.smtpHost || !k.empfaenger) return { ok: false, error: "SMTP-Server und Empfänger angeben." };

  try {
    await sendeMitKonfig(
      { ...k, aktiv: true },
      "Testmail — Ciloglu Rechnungsprüfer",
      "Dies ist eine Testnachricht. Wenn Sie diese Mail erhalten, ist die Benachrichtigung korrekt konfiguriert.",
    );
  } catch (e: any) {
    return { ok: false, error: `Versand fehlgeschlagen: ${e?.message ?? "unbekannter Fehler"}` };
  }
  return { ok: true, error: "" };
}
