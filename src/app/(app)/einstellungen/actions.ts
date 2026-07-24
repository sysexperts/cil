"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser, hashPassword, verifyCredentials } from "@/lib/auth";

export async function passwortAendern(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const aktuell = String(formData.get("aktuell") ?? "");
  const neu = String(formData.get("neu") ?? "");
  const neu2 = String(formData.get("neu2") ?? "");

  if (neu.length < 8) return { ok: false, error: "Neues Passwort muss mind. 8 Zeichen haben." };
  if (neu !== neu2) return { ok: false, error: "Die neuen Passwörter stimmen nicht überein." };

  const ok = await verifyCredentials(user.email, aktuell);
  if (!ok) return { ok: false, error: "Aktuelles Passwort ist falsch." };

  await prisma.user.update({ where: { id: user.sub }, data: { passwortHash: await hashPassword(neu) } });
  await prisma.auditLog.create({ data: { userId: user.sub, aktion: "PASSWORT_GEAENDERT" } });
  return { ok: true, error: "" };
}

export async function benutzerAnlegen(_prev: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const passwort = String(formData.get("passwort") ?? "");

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Ungültige E-Mail." };
  if (passwort.length < 8) return { ok: false, error: "Passwort muss mind. 8 Zeichen haben." };

  try {
    await prisma.user.create({ data: { email, name: name || null, passwortHash: await hashPassword(passwort) } });
  } catch (e: any) {
    if (e?.code === "P2002") return { ok: false, error: "E-Mail existiert bereits." };
    return { ok: false, error: "Anlegen fehlgeschlagen." };
  }
  await prisma.auditLog.create({ data: { userId: user.sub, aktion: "BENUTZER_ANGELEGT", details: { email } } });
  revalidatePath("/einstellungen");
  return { ok: true, error: "" };
}
