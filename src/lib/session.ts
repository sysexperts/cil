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

export type Rolle = "ADMIN" | "FREIGEBER" | "PRUEFER";
export type SessionPayload = { sub: string; email: string; name?: string; rolle: Rolle };

export async function createSessionToken(p: SessionPayload): Promise<string> {
  return new SignJWT({ email: p.email, name: p.name, rolle: p.rolle })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: payload.name as string | undefined,
      rolle: (payload.rolle as Rolle) ?? "PRUEFER",
    };
  } catch {
    return null;
  }
}

export function darfFreigeben(rolle?: Rolle): boolean {
  return rolle === "ADMIN" || rolle === "FREIGEBER";
}
export function istAdmin(rolle?: Rolle): boolean {
  return rolle === "ADMIN";
}
