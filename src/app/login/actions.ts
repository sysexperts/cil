"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSessionToken, setSessionCookie } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const passwort = String(formData.get("passwort") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const user = await verifyCredentials(email, passwort);
  if (!user) {
    redirect(`/login?error=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  const token = await createSessionToken(user);
  await setSessionCookie(token);
  redirect(next.startsWith("/") ? next : "/");
}
