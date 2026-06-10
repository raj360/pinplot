import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/lib/intl/format";
import { convertMoney, type FxRateMap } from "@/lib/intl/fx-rates";

export type RentRangeOption = {
  value: string;
  label: string;
  shortLabel: string;
  minRent?: number;
  maxRent?: number;
};

export type RentRangeMoney = {
  currency?: string;
  locale?: string;
  fxRates?: FxRateMap;
};

/**
 * Canonical monthly-rent tier edges, expressed in the home-supply currency
 * (UGX). For markets without a curated ladder we convert these via FX and snap
 * to human numbers so the brackets read naturally in the viewer's own currency
 * instead of showing Ugandan shilling amounts everywhere.
 */
const BASE_UGX_THRESHOLDS = [500_000, 1_000_000, 2_000_000, 5_000_000];

/**
 * Curated monthly-rent tier edges per currency, reflecting typical big-city
 * asking rents in each market (research-informed approximations). FX-from-UGX
 * understates developed markets, so these give realistic brackets — e.g. USD
 * spans "Under $1k" through "Above $5k". Currencies absent here fall back to the
 * FX-derived ladder.
 */
const MARKET_THRESHOLDS: Record<string, [number, number, number, number]> = {
  // East / sub-Saharan Africa
  UGX: [500_000, 1_000_000, 2_000_000, 5_000_000],
  KES: [30_000, 60_000, 120_000, 250_000],
  TZS: [400_000, 800_000, 1_500_000, 3_000_000],
  RWF: [300_000, 600_000, 1_200_000, 2_500_000],
  NGN: [300_000, 700_000, 1_500_000, 3_000_000],
  GHS: [2_000, 4_000, 8_000, 15_000],
  ZAR: [8_000, 15_000, 30_000, 60_000],
  // North America / Europe / Oceania
  USD: [1_000, 2_000, 3_500, 5_000],
  GBP: [1_000, 2_000, 3_500, 5_000],
  EUR: [1_000, 2_000, 3_500, 5_000],
  CAD: [1_500, 2_500, 4_000, 6_000],
  AUD: [1_500, 2_500, 4_000, 6_000],
  NZD: [1_500, 2_500, 4_000, 6_000],
  CHF: [1_500, 2_500, 4_000, 6_000],
  SGD: [2_000, 3_500, 5_500, 9_000],
  // Nordics
  SEK: [10_000, 18_000, 30_000, 50_000],
  NOK: [12_000, 20_000, 35_000, 55_000],
  DKK: [8_000, 14_000, 24_000, 40_000],
  // Gulf
  AED: [4_000, 8_000, 15_000, 25_000],
  SAR: [3_000, 6_000, 10_000, 20_000],
  QAR: [4_000, 8_000, 15_000, 25_000],
  // South Asia
  INR: [15_000, 30_000, 60_000, 120_000],
};

/** Snap a raw amount to a tidy 1 / 2 / 2.5 / 5 / 10 × 10^n value. */
function niceRound(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const snapped =
    normalized < 1.5
      ? 1
      : normalized < 3
        ? 2
        : normalized < 4
          ? 2.5
          : normalized < 7.5
            ? 5
            : 10;
  return snapped * magnitude;
}

/** Compact currency label, e.g. "USh 500K", "£1.5K", "₦3M". */
export function compactMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: DEFAULT_CURRENCY,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
}

/** Tier edges in the target currency (curated market ladder, else FX-tidied). */
export function rentRangeThresholds(money?: RentRangeMoney): number[] {
  const currency = (money?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  const curated = MARKET_THRESHOLDS[currency];
  if (curated) return [...curated];
  if (currency === DEFAULT_CURRENCY || !money?.fxRates) {
    return [...BASE_UGX_THRESHOLDS];
  }
  return BASE_UGX_THRESHOLDS.map((threshold) => {
    const converted = convertMoney(
      threshold,
      DEFAULT_CURRENCY,
      currency,
      money.fxRates!,
    );
    return converted != null ? niceRound(converted) : threshold;
  });
}

/** A believable starting rent for a market, in its own currency. */
export function typicalMonthlyRent(money?: RentRangeMoney): number {
  const currency = (money?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  const curated = MARKET_THRESHOLDS[currency];
  if (curated) return curated[0];
  if (currency === DEFAULT_CURRENCY || !money?.fxRates) return 500_000;
  const converted = convertMoney(500_000, DEFAULT_CURRENCY, currency, money.fxRates);
  return converted != null ? niceRound(converted) : 500_000;
}

/** Default unit rent on the landlord create form — monthly or nightly by type. */
export function typicalListingRent(
  buildingType: string | undefined,
  money?: RentRangeMoney,
): number {
  const monthly = typicalMonthlyRent(money);
  if (buildingType === "airbnb") {
    return niceRound(Math.max(monthly / 30, 10));
  }
  return monthly;
}

/** Build the Jiji-style rent presets in the viewer's currency. */
export function buildRentRangeOptions(money?: RentRangeMoney): RentRangeOption[] {
  const currency = (money?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  const locale = money?.locale ?? DEFAULT_LOCALE;
  const [t1, t2, t3, t4] = rentRangeThresholds(money);
  const c = (amount: number) => compactMoney(amount, currency, locale);

  return [
    { value: "", label: "Any price", shortLabel: "Any price" },
    {
      value: `0-${t1}`,
      label: `Under ${c(t1)}`,
      shortLabel: `Under ${c(t1)}/mo`,
      maxRent: t1,
    },
    {
      value: `${t1}-${t2}`,
      label: `${c(t1)} – ${c(t2)}`,
      shortLabel: `${c(t1)} – ${c(t2)}/mo`,
      minRent: t1,
      maxRent: t2,
    },
    {
      value: `${t2}-${t3}`,
      label: `${c(t2)} – ${c(t3)}`,
      shortLabel: `${c(t2)} – ${c(t3)}/mo`,
      minRent: t2,
      maxRent: t3,
    },
    {
      value: `${t3}-${t4}`,
      label: `${c(t3)} – ${c(t4)}`,
      shortLabel: `${c(t3)} – ${c(t4)}/mo`,
      minRent: t3,
      maxRent: t4,
    },
    {
      value: `${t4}-`,
      label: `Above ${c(t4)}`,
      shortLabel: `Above ${c(t4)}/mo`,
      minRent: t4,
    },
  ];
}

export function parseRentRange(value: string): {
  minRent?: number;
  maxRent?: number;
} {
  if (!value) return {};
  const [minRaw, maxRaw] = value.split("-");
  const min = minRaw ? Number(minRaw) : undefined;
  const max = maxRaw ? Number(maxRaw) : undefined;
  return {
    minRent: min != null && Number.isFinite(min) && min > 0 ? min : undefined,
    maxRent: max != null && Number.isFinite(max) && max > 0 ? max : undefined,
  };
}

/** A "min-max" rent value, where at least one bound is a positive integer. */
export function isValidRentRangeValue(value: string): boolean {
  if (!/^\d*-\d*$/.test(value)) return false;
  const { minRent, maxRent } = parseRentRange(value);
  return minRent != null || maxRent != null;
}

/** Human label for a rent value, formatted in the given currency. */
export function rentRangeShortLabel(
  value: string,
  money?: RentRangeMoney,
): string | null {
  if (!value) return null;
  const currency = (money?.currency ?? DEFAULT_CURRENCY).toUpperCase();
  const locale = money?.locale ?? DEFAULT_LOCALE;
  const { minRent, maxRent } = parseRentRange(value);
  const c = (amount: number) => compactMoney(amount, currency, locale);

  if (minRent != null && maxRent != null) return `${c(minRent)} – ${c(maxRent)}/mo`;
  if (maxRent != null) return `Under ${c(maxRent)}/mo`;
  if (minRent != null) return `Above ${c(minRent)}/mo`;
  return null;
}

export function rentRangeLabel(
  value: string,
  money?: RentRangeMoney,
): string | null {
  return rentRangeShortLabel(value, money)?.replace(/\s*\/mo$/, "") ?? null;
}
