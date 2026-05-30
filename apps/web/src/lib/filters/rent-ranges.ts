import { formatCurrency } from "@/lib/intl/format";

export type RentRangeOption = {
  value: string;
  label: string;
  shortLabel: string;
  minRent?: number;
  maxRent?: number;
};

/** Jiji-style monthly rent presets for Uganda (UGX). */
export const RENT_RANGE_OPTIONS: RentRangeOption[] = [
  { value: "", label: "Any price", shortLabel: "Any price" },
  {
    value: "0-500000",
    label: `Under ${formatCurrency(500_000)}`,
    shortLabel: "Under 500K/mo",
    maxRent: 500_000,
  },
  {
    value: "500000-1000000",
    label: `${formatCurrency(500_000)} – ${formatCurrency(1_000_000)}`,
    shortLabel: "500K – 1M/mo",
    minRent: 500_000,
    maxRent: 1_000_000,
  },
  {
    value: "1000000-2000000",
    label: `${formatCurrency(1_000_000)} – ${formatCurrency(2_000_000)}`,
    shortLabel: "1M – 2M/mo",
    minRent: 1_000_000,
    maxRent: 2_000_000,
  },
  {
    value: "2000000-5000000",
    label: `${formatCurrency(2_000_000)} – ${formatCurrency(5_000_000)}`,
    shortLabel: "2M – 5M/mo",
    minRent: 2_000_000,
    maxRent: 5_000_000,
  },
  {
    value: "5000000-",
    label: `Above ${formatCurrency(5_000_000)}`,
    shortLabel: "Above 5M/mo",
    minRent: 5_000_000,
  },
];

export function parseRentRange(value: string): {
  minRent?: number;
  maxRent?: number;
} {
  if (!value) return {};
  const option = RENT_RANGE_OPTIONS.find((o) => o.value === value);
  if (option) {
    return { minRent: option.minRent, maxRent: option.maxRent };
  }
  const [minRaw, maxRaw] = value.split("-");
  const min = minRaw ? Number(minRaw) : undefined;
  const max = maxRaw ? Number(maxRaw) : undefined;
  return {
    minRent: min != null && Number.isFinite(min) && min > 0 ? min : undefined,
    maxRent: max != null && Number.isFinite(max) && max > 0 ? max : undefined,
  };
}

export function rentRangeLabel(value: string): string | null {
  if (!value) return null;
  return RENT_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function rentRangeShortLabel(value: string): string | null {
  if (!value) return null;
  return RENT_RANGE_OPTIONS.find((o) => o.value === value)?.shortLabel ?? null;
}
