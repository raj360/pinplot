/**
 * Locale and formatting helpers aligned with international standards:
 * - ISO 639-1 + ISO 3166-1: en-UG (English, Uganda)
 * - ISO 4217: UGX currency codes
 * - ISO 8601: date/time interchange
 * - ITU-T E.164: phone numbers (+256…)
 */

export const DEFAULT_LOCALE = "en-UG";
export const DEFAULT_COUNTRY = "UG";
export const DEFAULT_CURRENCY = "UGX";

/** ISO 4217 — format whole UGX amounts (no fractional digits). */
export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Compact rent label, e.g. "UGX 500,000/mo". */
export function formatRentPerMonth(
  amount: number | null | undefined,
  locale: string = DEFAULT_LOCALE,
): string {
  if (amount == null) return "—";
  return `${formatCurrency(amount, DEFAULT_CURRENCY, locale)}/mo`;
}

/** ISO 8601 date → localized medium date. */
export function formatDate(
  value: Date | string,
  locale: string = DEFAULT_LOCALE,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

/** E.164-ish normalization for Uganda (+256) and other leading-+ input. */
export function normalizePhoneE164(raw: string, defaultCountry = "256"): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.startsWith("0")) return `+${defaultCountry}${digits.slice(1)}`;
  if (digits.startsWith(defaultCountry)) return `+${digits}`;
  return `+${defaultCountry}${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}
