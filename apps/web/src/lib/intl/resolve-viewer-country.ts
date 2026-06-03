import { DEFAULT_COUNTRY } from "@plotpin/shared-types";
import type { CountryCatalog } from "@plotpin/shared-types";

export const VIEWER_COUNTRY_STORAGE_KEY = "plotpin-viewer-country";

const SUPPORTED_COUNTRY_CODES = new Set([
  "UG",
  "GB",
  "US",
  "KE",
  "TZ",
  "RW",
  "NG",
  "ZA",
  "AE",
  "CA",
  "DE",
]);

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return SUPPORTED_COUNTRY_CODES.has(upper) ? upper : null;
}

export function readStoredViewerCountry(): string | null {
  if (typeof window === "undefined") return null;
  return normalizeCountryCode(localStorage.getItem(VIEWER_COUNTRY_STORAGE_KEY));
}

export function writeStoredViewerCountry(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCountryCode(code);
  if (!normalized) return;
  localStorage.setItem(VIEWER_COUNTRY_STORAGE_KEY, normalized);
}

export function clearStoredViewerCountry() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VIEWER_COUNTRY_STORAGE_KEY);
}

function inferViewerCountryFromTimeZone(timeZone: string): string | null {
  if (timeZone.includes("London") || timeZone.startsWith("Europe/London")) {
    return "GB";
  }
  if (timeZone.includes("Berlin") || timeZone.startsWith("Europe/Berlin")) {
    return "DE";
  }
  if (
    timeZone.includes("Toronto") ||
    timeZone.includes("Vancouver") ||
    timeZone.includes("Winnipeg") ||
    timeZone.includes("Edmonton") ||
    timeZone.startsWith("America/Toronto") ||
    timeZone.startsWith("America/Vancouver") ||
    timeZone.startsWith("America/Winnipeg") ||
    timeZone.startsWith("America/Edmonton")
  ) {
    return "CA";
  }
  if (
    timeZone.includes("New_York") ||
    timeZone.includes("Chicago") ||
    timeZone.includes("Los_Angeles") ||
    timeZone.startsWith("America/")
  ) {
    return "US";
  }
  if (timeZone.includes("Nairobi") || timeZone.startsWith("Africa/Nairobi")) {
    return "KE";
  }
  if (
    timeZone.includes("Dar_es_Salaam") ||
    timeZone.startsWith("Africa/Dar_es_Salaam")
  ) {
    return "TZ";
  }
  if (timeZone.includes("Kigali") || timeZone.startsWith("Africa/Kigali")) {
    return "RW";
  }
  if (timeZone.includes("Lagos") || timeZone.startsWith("Africa/Lagos")) {
    return "NG";
  }
  if (
    timeZone.includes("Johannesburg") ||
    timeZone.startsWith("Africa/Johannesburg")
  ) {
    return "ZA";
  }
  if (timeZone.includes("Dubai") || timeZone.startsWith("Asia/Dubai")) {
    return "AE";
  }
  if (timeZone.includes("Kampala") || timeZone.startsWith("Africa/Kampala")) {
    return "UG";
  }
  return null;
}

function inferViewerCountryFromLanguage(language: string): string | null {
  const parts = language.split("-");
  if (parts.length >= 2) {
    return normalizeCountryCode(parts[1]);
  }
  return null;
}

/** Infer country from browser timezone + locale before profile is available. */
export function inferViewerCountryFromBrowser(): string {
  if (typeof navigator === "undefined") return DEFAULT_COUNTRY.code;

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const fromTimeZone = inferViewerCountryFromTimeZone(timeZone);
    if (fromTimeZone) return fromTimeZone;
  } catch {
    /* ignore */
  }

  const fromLanguage = inferViewerCountryFromLanguage(navigator.language ?? "");
  if (fromLanguage) return fromLanguage;

  return DEFAULT_COUNTRY.code;
}

/**
 * Resolve the viewer's country using an enterprise precedence chain:
 *
 *   1. storedCountry  — explicit user choice (Settings → localStorage); intent wins.
 *   2. profileCountry — authenticated account country.
 *   3. ipCountry      — edge IP geolocation (most accurate signal for anonymous viewers).
 *   4. timezone       — `Intl` timezone inference.
 *   5. language       — `navigator.language` region tag.
 *   6. default        — Uganda (primary supply market).
 */
export function resolveViewerCountryCode(input: {
  storedCountry?: string | null;
  profileCountry?: string | null;
  ipCountry?: string | null;
}): string {
  return (
    normalizeCountryCode(input.storedCountry) ??
    normalizeCountryCode(input.profileCountry) ??
    normalizeCountryCode(input.ipCountry) ??
    inferViewerCountryFromBrowser()
  );
}

export function getCountryMapBounds(
  country: CountryCatalog | undefined,
): CountryCatalog["mapBounds"] {
  return country?.mapBounds ?? null;
}
