import { DEFAULT_COUNTRY } from "@plotpin/shared-types";
import type { CountryCatalog } from "@plotpin/shared-types";
import type { ViewerContext } from "@/lib/intl/format-money";

import { readEdgeCountryFromHeaders } from "@/lib/intl/edge-geo";

export const VIEWER_COUNTRY_STORAGE_KEY = "plotpin-viewer-country";

/** Virtual code when the viewer is outside the explicit country catalog. */
export const ROW_COUNTRY_CODE = "ROW";

const SUPPORTED_COUNTRY_CODES = new Set([
  // Supply + core diaspora
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
  // Expanded diaspora / high card+internet-adoption markets
  "IE",
  "NL",
  "FR",
  "IT",
  "ES",
  "BE",
  "SE",
  "NO",
  "DK",
  "CH",
  "SA",
  "QA",
  "AU",
  "NZ",
  "IN",
  "SG",
  "GH",
]);

export function isSupportedCountryCode(code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  return SUPPORTED_COUNTRY_CODES.has(code.trim().toUpperCase());
}

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return SUPPORTED_COUNTRY_CODES.has(upper) ? upper : null;
}

/** Two-letter ISO code from any source (supported or not). */
function parseIsoCountryCode(code: string | null | undefined): string | null {
  if (!code?.trim()) return null;
  const upper = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(upper) ? upper : null;
}

/** Crown Dependencies & UK-adjacent — present in GBP for ROW display. */
const GBP_ADJACENT_CODES = new Set(["IM", "GG", "JE", "FK", "GI"]);

/**
 * Pick an international display currency for viewers outside the catalog.
 * USD default; EUR for continental Europe; GBP for UK-adjacent signals.
 */
export function resolveRowDisplayCurrency(hints: {
  timeZone?: string;
  language?: string;
  rawCountryCode?: string | null;
}): Pick<ViewerContext, "displayCurrency" | "displayLocale"> {
  const tz = hints.timeZone ?? "";
  const lang = (hints.language ?? "").toLowerCase();
  const raw = (hints.rawCountryCode ?? "").toUpperCase();

  if (
    raw === "GB" ||
    GBP_ADJACENT_CODES.has(raw) ||
    tz.includes("London") ||
    tz.startsWith("Europe/London") ||
    lang.startsWith("en-gb")
  ) {
    return { displayCurrency: "GBP", displayLocale: "en-GB" };
  }

  if (
    tz.startsWith("Europe/") ||
    /^[a-z]{2}-(at|be|de|es|fi|fr|gr|ie|it|lu|nl|pt|sk|si|ee|lv|lt|mt|cy)$/i.test(
      lang,
    ) ||
    ["de", "fr", "it", "es", "nl", "pt", "pl", "sv", "da", "nb", "fi"].some(
      (prefix) => lang === prefix || lang.startsWith(`${prefix}-`),
    )
  ) {
    return { displayCurrency: "EUR", displayLocale: "en-IE" };
  }

  return { displayCurrency: "USD", displayLocale: "en-US" };
}

export type ViewerResolutionHints = {
  storedCountry?: string | null;
  profileCountry?: string | null;
  ipCountry?: string | null;
  timeZone?: string;
  language?: string;
};

function browserTimeZone(): string {
  if (typeof Intl === "undefined") return "";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

function browserLanguage(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.language ?? "";
}

/** First unsupported-but-valid ISO country in the precedence chain (for ROW hints). */
export function firstRawCountryHint(input: ViewerResolutionHints): string | null {
  return (
    parseIsoCountryCode(input.profileCountry) ??
    parseIsoCountryCode(input.ipCountry) ??
    null
  );
}

/**
 * Resolve catalog country or ROW. Unsupported ISO codes (e.g. BR, JP) map to ROW
 * instead of silently defaulting to Uganda.
 */
export function resolveViewerCountryCode(input: ViewerResolutionHints): string {
  const stored = parseIsoCountryCode(input.storedCountry);
  if (stored) {
    return SUPPORTED_COUNTRY_CODES.has(stored) ? stored : ROW_COUNTRY_CODE;
  }

  const profile = parseIsoCountryCode(input.profileCountry);
  if (profile) {
    return SUPPORTED_COUNTRY_CODES.has(profile) ? profile : ROW_COUNTRY_CODE;
  }

  const ip = parseIsoCountryCode(input.ipCountry);
  if (ip) {
    return SUPPORTED_COUNTRY_CODES.has(ip) ? ip : ROW_COUNTRY_CODE;
  }

  return inferViewerCountryFromBrowser(
    input.timeZone ?? browserTimeZone(),
    input.language ?? browserLanguage(),
  );
}

/** Home SSR — resolve viewer region from edge IP headers when available. */
export function resolveServerViewerCountry(headerStore: Headers): string {
  const ipCountry = readEdgeCountryFromHeaders(headerStore);
  return resolveViewerCountryCode({ ipCountry });
}

/** Full viewer display context — handles catalog countries and ROW fallback. */
export function resolveViewerContext(
  input: ViewerResolutionHints,
  countriesByCode: Map<string, CountryCatalog>,
): ViewerContext {
  const timeZone = input.timeZone ?? browserTimeZone();
  const language = input.language ?? browserLanguage();
  const code = resolveViewerCountryCode({ ...input, timeZone, language });

  if (code !== ROW_COUNTRY_CODE) {
    const country = countriesByCode.get(code);
    return {
      countryCode: code,
      displayLocale: country?.displayLocale ?? "en-UG",
      displayCurrency: country?.currency ?? DEFAULT_COUNTRY.currency,
    };
  }

  const row = resolveRowDisplayCurrency({
    timeZone,
    language,
    rawCountryCode: firstRawCountryHint(input),
  });

  return {
    countryCode: ROW_COUNTRY_CODE,
    displayLocale: row.displayLocale,
    displayCurrency: row.displayCurrency,
  };
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
    timeZone.includes("Denver") ||
    timeZone.includes("Phoenix") ||
    timeZone.startsWith("America/New_York") ||
    timeZone.startsWith("America/Chicago") ||
    timeZone.startsWith("America/Los_Angeles") ||
    timeZone.startsWith("America/Denver") ||
    timeZone.startsWith("America/Phoenix") ||
    timeZone.startsWith("America/Anchorage") ||
    timeZone.startsWith("America/Boise") ||
    timeZone.startsWith("America/Detroit") ||
    timeZone.startsWith("America/Indiana") ||
    timeZone.startsWith("America/Kentucky") ||
    timeZone.startsWith("America/Nome") ||
    timeZone.startsWith("America/Adak")
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
  // Expanded diaspora markets.
  if (timeZone.startsWith("Europe/Dublin")) return "IE";
  if (timeZone.startsWith("Europe/Amsterdam")) return "NL";
  if (timeZone.startsWith("Europe/Paris")) return "FR";
  if (timeZone.startsWith("Europe/Rome")) return "IT";
  if (timeZone.startsWith("Europe/Madrid")) return "ES";
  if (timeZone.startsWith("Europe/Brussels")) return "BE";
  if (timeZone.startsWith("Europe/Stockholm")) return "SE";
  if (timeZone.startsWith("Europe/Oslo")) return "NO";
  if (timeZone.startsWith("Europe/Copenhagen")) return "DK";
  if (timeZone.startsWith("Europe/Zurich")) return "CH";
  if (timeZone.startsWith("Asia/Riyadh")) return "SA";
  if (timeZone.startsWith("Asia/Qatar") || timeZone.includes("Doha")) return "QA";
  if (timeZone.startsWith("Asia/Kolkata") || timeZone.startsWith("Asia/Calcutta")) {
    return "IN";
  }
  if (timeZone.startsWith("Asia/Singapore")) return "SG";
  if (timeZone.startsWith("Australia/")) return "AU";
  if (timeZone.startsWith("Pacific/Auckland")) return "NZ";
  if (timeZone.startsWith("Africa/Accra")) return "GH";
  return null;
}

function inferViewerCountryFromLanguage(
  language: string,
): string | null {
  const parts = language.split("-");
  if (parts.length >= 2) {
    const code = parts[1].toUpperCase();
    if (SUPPORTED_COUNTRY_CODES.has(code)) return code;
    if (/^[A-Z]{2}$/.test(code)) return ROW_COUNTRY_CODE;
  }
  return null;
}

/** Infer country from browser timezone + locale before profile is available. */
export function inferViewerCountryFromBrowser(
  timeZone = browserTimeZone(),
  language = browserLanguage(),
): string {
  const fromTimeZone = inferViewerCountryFromTimeZone(timeZone);
  if (fromTimeZone) return fromTimeZone;

  const fromLanguage = inferViewerCountryFromLanguage(language);
  if (fromLanguage) return fromLanguage;

  // Broad regions → ROW (currency refined in resolveRowDisplayCurrency).
  if (timeZone.startsWith("Europe/")) return ROW_COUNTRY_CODE;
  if (timeZone.startsWith("America/")) return ROW_COUNTRY_CODE;
  if (timeZone.startsWith("Asia/") || timeZone.startsWith("Pacific/")) {
    return ROW_COUNTRY_CODE;
  }
  if (timeZone.startsWith("Africa/")) return ROW_COUNTRY_CODE;

  return DEFAULT_COUNTRY.code;
}

export function getCountryMapBounds(
  country: CountryCatalog | undefined,
): CountryCatalog["mapBounds"] {
  return country?.mapBounds ?? null;
}
