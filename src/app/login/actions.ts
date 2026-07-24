"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSessionToken, setSessionCookie } from "@/lib/auth";
import { rateLimit, rateLimitReset } from "@/lib/ratelimit";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const passwort = String(formData.get("passwort") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  // Max. 8 Versuche pro E-Mail in 10 Minuten
  const rl = rateLimit(`login:${email}`, 8, 10 * 60 * 1000);
  if (!rl.erlaubt) {
    redirect(`/login?error=ratelimit${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const user = await verifyCredentials(email, passwort);
  if (!user) {
    redirect(`/login?error=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  rateLimitReset(`login:${email}`);
  const token = await createSessionToken(user);
  await setSessionCookie(token);
  redirect(next.startsWith("/") ? next : "/");
}
