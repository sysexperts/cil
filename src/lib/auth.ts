import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, MAX_AGE, verifySessionToken, type SessionPayload } from "@/lib/session";

export { SESSION_COOKIE, createSessionToken, verifySessionToken } from "@/lib/session";
export type { SessionPayload } from "@/lib/session";

/** In Server Components / Actions: aktuellen Benutzer aus dem Cookie lesen. */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function verifyCredentials(email: string, passwort: string): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(passwort, user.passwortHash);
  if (!ok) return null;
  return { sub: user.id, email: user.email, name: user.name ?? undefined };
}

export function hashPassword(passwort: string): Promise<string> {
  return bcrypt.hash(passwort, 10);
}
