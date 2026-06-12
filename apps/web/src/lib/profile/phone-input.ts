import { parsePhoneNumber, type PhoneNumber } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";
import { getCountries, getCountryCallingCode } from "react-phone-number-input";
import type { UserProfile } from "@/lib/api/profiles";

const FALLBACK_COUNTRY: Country = "GB";

export function callingCodePrefix(
  country: Country | undefined,
  fallback: Country = FALLBACK_COUNTRY,
): string {
  const resolved = country ?? fallback;
  return `+${getCountryCallingCode(resolved)}`;
}

/** react-phone-number-input requires E.164 in `value` (no spaces). */
export function toPhoneInputValue(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;

  try {
    const parsed = parsePhoneNumber(value);
    if (parsed?.number) return parsed.number;
  } catch {
    /* fall through */
  }

  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : undefined;
}

function e164FromParsed(parsed: PhoneNumber | undefined, fallback: string): string {
  return parsed?.number ?? fallback;
}

/** Longest-prefix match so +256 beats +25. */
export function countryFromE164(
  value: string | undefined,
  fallback: Country,
): Country {
  if (!value?.trim()) return fallback;

  try {
    const parsed = parsePhoneNumber(value);
    if (parsed?.country) return parsed.country as Country;
  } catch {
    /* fall through */
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) return fallback;

  let best: { country: Country; len: number } | null = null;
  for (const country of getCountries()) {
    const code = getCountryCallingCode(country);
    if (digits.startsWith(code) && (!best || code.length > best.len)) {
      best = { country, len: code.length };
    }
  }

  return best?.country ?? fallback;
}

/** Trim excess digits; always return E.164 for PhoneInput + form state. */
export function enforceMaxPhoneLength(
  value: string,
  country: Country,
  fallback: Country = FALLBACK_COUNTRY,
): string {
  const activeCountry = country ?? fallback;
  const prefix = callingCodePrefix(activeCountry, fallback);

  try {
    const parsed = parsePhoneNumber(value, activeCountry);
    if (parsed?.isPossible()) {
      return e164FromParsed(parsed, prefix);
    }
  } catch {
    /* fall through to manual trim */
  }

  const ccDigits = prefix.replace(/\D/g, "");
  const digits = value.replace(/\D/g, "");
  if (!digits.startsWith(ccDigits)) return prefix;

  let national = digits.slice(ccDigits.length);
  while (national.length > 0) {
    const candidate = `+${ccDigits}${national}`;
    try {
      const parsed = parsePhoneNumber(candidate, activeCountry);
      if (parsed?.isPossible()) {
        return e164FromParsed(parsed, prefix);
      }
    } catch {
      /* keep trimming */
    }
    national = national.slice(0, -1);
  }

  return prefix;
}

/** Keep at least +{callingCode}; reject edits that strip the prefix. */
export function clampPhoneValue(
  value: string | undefined,
  country: Country | undefined,
  fallback: Country = FALLBACK_COUNTRY,
): string {
  const activeCountry = country ?? fallback;
  const prefix = callingCodePrefix(activeCountry, fallback);

  if (!value?.trim()) return prefix;

  const normalized = toPhoneInputValue(value) ?? value;
  const digits = normalized.replace(/\D/g, "");
  const prefixDigits = prefix.replace(/\D/g, "");
  if (!digits.startsWith(prefixDigits)) {
    try {
      const reparsed = parsePhoneNumber(normalized, activeCountry);
      if (reparsed?.number) {
        return enforceMaxPhoneLength(reparsed.number, activeCountry, fallback);
      }
    } catch {
      /* ignore */
    }
    return prefix;
  }

  if (normalized.length < prefix.length) return prefix;

  return enforceMaxPhoneLength(normalized, activeCountry, fallback);
}

/** True when value is only a bare country calling code. */
export function isBareCallingCode(
  value: string | undefined,
  country: Country | undefined,
  fallback: Country = FALLBACK_COUNTRY,
) {
  if (!value?.trim()) return true;
  const normalized = toPhoneInputValue(value) ?? value.replace(/\s/g, "");
  return normalized === callingCodePrefix(country, fallback);
}

export function normalizePhoneE164(value: string): string | null {
  try {
    const parsed = parsePhoneNumber(value);
    if (parsed?.isValid()) return parsed.format("E.164");
  } catch {
    /* ignore */
  }
  return null;
}

export function isCompletePhoneNumber(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const parsed = parsePhoneNumber(value);
    return Boolean(parsed?.isValid() && parsed.nationalNumber.length >= 4);
  } catch {
    return false;
  }
}

export function primaryPhoneLabel(role: UserProfile["role"] | undefined): string {
  if (role === "LANDLORD" || role === "ADMIN" || role === "SUPERADMIN") {
    return "Primary phone (shared with tenants after unlock)";
  }
  return "Primary phone";
}
