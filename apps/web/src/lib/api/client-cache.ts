const PREFIX = "plotpin:";

export function readClientCache<T>(key: string, maxAgeMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; data: T };
    if (Date.now() - parsed.savedAt > maxAgeMs) {
      window.localStorage.removeItem(`${PREFIX}${key}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeClientCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {
    /* quota / private mode */
  }
}

export const CATALOG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
