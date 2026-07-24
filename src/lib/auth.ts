import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "ciloglu_session";
const MAX_AGE = 60 * 60 * 8; // 8 Stunden

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET fehlt");
  return new TextEncoder().encode(s);
}

export type SessionPayload = { sub: string; email: string; name?: string };

export async function createSessionToken(p: SessionPayload): Promise<string> {
  return new SignJWT({ email: p.email, name: p.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { sub: String(payload.sub), email: String(payload.email), name: payload.name as string | undefined };
  } catch {
    return null;
  }
}

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
