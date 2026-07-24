// Edge-kompatibel: nur jose, keine Node-Only-Abhängigkeiten (Prisma/bcrypt).
// Wird von der Middleware genutzt.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ciloglu_session";
export const MAX_AGE = 60 * 60 * 8; // 8 Stunden

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
