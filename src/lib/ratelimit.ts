// Einfaches In-Memory-Rate-Limit (ausreichend für Single-Instance-Betrieb).
type Eintrag = { count: number; reset: number };
const store = new Map<string, Eintrag>();

export function rateLimit(key: string, max: number, fensterMs: number): { erlaubt: boolean; verbleibend: number } {
  const now = Date.now();
  const e = store.get(key);
  if (!e || now > e.reset) {
    store.set(key, { count: 1, reset: now + fensterMs });
    return { erlaubt: true, verbleibend: max - 1 };
  }
  if (e.count >= max) return { erlaubt: false, verbleibend: 0 };
  e.count++;
  return { erlaubt: true, verbleibend: max - e.count };
}

export function rateLimitReset(key: string): void {
  store.delete(key);
}
