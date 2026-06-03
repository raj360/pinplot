import { normalizeCountryCode } from "@/lib/intl/resolve-viewer-country";

export type GeoIpResult = {
  country: string | null;
  region: string | null;
  city: string | null;
};

const SESSION_KEY = "plotpin-geo-ip";

function readCache(): GeoIpResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GeoIpResult;
  } catch {
    return null;
  }
}

function writeCache(result: GeoIpResult) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
  } catch {
    /* sessionStorage may be unavailable (private mode) — ignore */
  }
}

let inflight: Promise<GeoIpResult> | null = null;

/**
 * Resolve the viewer's approximate location from edge IP headers.
 * Cached per session (sessionStorage) and de-duplicated across callers so the
 * `/api/geo` endpoint is hit at most once per tab.
 */
export async function fetchGeoIp(): Promise<GeoIpResult> {
  const cached = readCache();
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const empty: GeoIpResult = { country: null, region: null, city: null };
    try {
      const res = await fetch("/api/geo", { cache: "no-store" });
      if (!res.ok) {
        writeCache(empty);
        return empty;
      }
      const data = (await res.json()) as Partial<GeoIpResult>;
      const result: GeoIpResult = {
        country: normalizeCountryCode(data.country ?? null),
        region: data.region ?? null,
        city: data.city ?? null,
      };
      writeCache(result);
      return result;
    } catch {
      writeCache(empty);
      return empty;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Convenience: just the normalized country code (or null). */
export async function fetchIpCountry(): Promise<string | null> {
  const { country } = await fetchGeoIp();
  return country;
}

/** Test/escape hatch — clears the per-session geo cache. */
export function clearGeoIpCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
