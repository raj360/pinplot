import { DEFAULT_COUNTRY } from "@plotpin/shared-types";
import type { CountryCatalog } from "@plotpin/shared-types";
import type { FxRateMap } from "@/lib/intl/fx-rates";
import { convertMoney } from "@/lib/intl/fx-rates";
import { formatCurrency } from "@/lib/intl/format";

export type ViewerContext = {
  countryCode: string;
  displayLocale: string;
  displayCurrency: string;
};

export type FormattedMoney = {
  primary: string;
  footnote?: string;
};

function resolveListingCurrency(
  listingCurrency: string | undefined,
  listingCountryCode: string | undefined,
  countriesByCode: Map<string, CountryCatalog>,
): string {
  if (listingCurrency?.trim()) return listingCurrency.trim().toUpperCase();
  if (listingCountryCode) {
    const country = countriesByCode.get(listingCountryCode);
    if (country?.currency) return country.currency;
  }
  return DEFAULT_COUNTRY.currency;
}

function localeForListing(
  listingCurrency: string,
  listingCountryCode: string | undefined,
  countriesByCode: Map<string, CountryCatalog>,
): string {
  if (listingCountryCode) {
    const country = countriesByCode.get(listingCountryCode);
    if (country) return country.displayLocale;
  }
  if (listingCurrency === "UGX") return "en-UG";
  if (listingCurrency === "GBP") return "en-GB";
  if (listingCurrency === "USD") return "en-US";
  if (listingCurrency === "KES") return "en-KE";
  if (listingCurrency === "TZS") return "en-TZ";
  if (listingCurrency === "RWF") return "en-RW";
  if (listingCurrency === "NGN") return "en-NG";
  if (listingCurrency === "ZAR") return "en-ZA";
  if (listingCurrency === "AED") return "en-AE";
  if (listingCurrency === "CAD") return "en-CA";
  if (listingCurrency === "EUR") return "de-DE";
  return "en-UG";
}

export function formatMoney(
  amount: number,
  listingCurrency: string,
  viewer: ViewerContext,
  fxRates: FxRateMap,
  options?: {
    listingCountryCode?: string;
    countriesByCode?: Map<string, CountryCatalog>;
  },
): FormattedMoney {
  const countriesByCode = options?.countriesByCode ?? new Map();
  const effectiveListingCurrency = resolveListingCurrency(
    listingCurrency,
    options?.listingCountryCode,
    countriesByCode,
  );
  const listingLocale = localeForListing(
    effectiveListingCurrency,
    options?.listingCountryCode,
    countriesByCode,
  );

  const primary = formatCurrency(amount, effectiveListingCurrency, listingLocale);

  if (effectiveListingCurrency === viewer.displayCurrency) {
    return { primary };
  }

  const converted = convertMoney(
    amount,
    effectiveListingCurrency,
    viewer.displayCurrency,
    fxRates,
  );

  if (converted == null) {
    return { primary };
  }

  const rounded =
    viewer.displayCurrency === "UGX" ||
    viewer.displayCurrency === "KES" ||
    viewer.displayCurrency === "TZS" ||
    viewer.displayCurrency === "RWF" ||
    viewer.displayCurrency === "NGN" ||
    viewer.displayCurrency === "ZAR"
      ? Math.round(converted)
      : Math.round(converted * 100) / 100;

  const footnoteValue = formatCurrency(
    rounded,
    viewer.displayCurrency,
    viewer.displayLocale,
  );

  return {
    primary,
    footnote: `~${footnoteValue}`,
  };
}

export function formatRentPerMonthWithFootnote(
  amount: number | null | undefined,
  listingCurrency: string,
  viewer: ViewerContext,
  fxRates: FxRateMap,
  options?: {
    listingCountryCode?: string;
    countriesByCode?: Map<string, CountryCatalog>;
  },
): string {
  if (amount == null) return "—";

  const formatted = formatMoney(
    amount,
    listingCurrency,
    viewer,
    fxRates,
    options,
  );

  if (formatted.footnote) {
    return `${formatted.primary}/mo (${formatted.footnote})`;
  }

  return `${formatted.primary}/mo`;
}

const ZERO_DECIMAL_CURRENCIES = new Set([
  "UGX",
  "KES",
  "TZS",
  "RWF",
  "NGN",
  "ZAR",
]);

/**
 * Format a canonical-UGX amount (e.g. the unlock fee) in the viewer's display
 * currency — what they'll actually be charged. Falls back to UGX when no FX
 * rate is available. Used for unlock fee labels, not listing rent.
 */
export function formatViewerMoney(
  amountUgx: number,
  viewer: ViewerContext,
  fxRates: FxRateMap,
): string {
  if (viewer.displayCurrency === "UGX") {
    return formatCurrency(amountUgx, "UGX", viewer.displayLocale);
  }
  const converted = convertMoney(amountUgx, "UGX", viewer.displayCurrency, fxRates);
  if (converted == null) {
    return formatCurrency(amountUgx, "UGX", "en-UG");
  }
  const rounded = ZERO_DECIMAL_CURRENCIES.has(viewer.displayCurrency)
    ? Math.round(converted)
    : Math.round(converted * 100) / 100;
  return formatCurrency(rounded, viewer.displayCurrency, viewer.displayLocale);
}

/**
 * Unlock fee for marketing copy — leads with the viewer's currency and notes
 * the canonical UGX charge when they differ (e.g. "£4 (~USh 20,000)").
 */
export function formatCanonicalUgxForViewer(
  amountUgx: number,
  viewer: ViewerContext,
  fxRates: FxRateMap,
): FormattedMoney {
  const primary = formatViewerMoney(amountUgx, viewer, fxRates);
  if (viewer.displayCurrency === "UGX") {
    return { primary };
  }
  const canonical = formatCurrency(amountUgx, "UGX", "en-UG");
  return {
    primary,
    footnote: `~${canonical}`,
  };
}

export function viewerContextFromCountry(
  country: CountryCatalog | undefined,
): ViewerContext {
  return {
    countryCode: country?.code ?? DEFAULT_COUNTRY.code,
    displayLocale: country?.displayLocale ?? "en-UG",
    displayCurrency: country?.currency ?? DEFAULT_COUNTRY.currency,
  };
}
