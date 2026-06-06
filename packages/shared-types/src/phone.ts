/** Phone helpers — store contacts as E.164 (+…). Uganda is the default market. */

import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export type PhoneCountry = {
  code: string;
  name: string;
  dialCode: string;
  placeholder: string;
  nationalMaxLength: number;
};

/**
 * PlotPin country catalog + common diaspora corridors (matches `countries` migration 017).
 * Used for legacy dial-code pickers; `react-phone-number-input` covers all countries in the web app.
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "UG", name: "Uganda", dialCode: "256", placeholder: "700 000 000", nationalMaxLength: 9 },
  { code: "KE", name: "Kenya", dialCode: "254", placeholder: "712 345 678", nationalMaxLength: 9 },
  { code: "TZ", name: "Tanzania", dialCode: "255", placeholder: "712 345 678", nationalMaxLength: 9 },
  { code: "RW", name: "Rwanda", dialCode: "250", placeholder: "781 234 567", nationalMaxLength: 9 },
  { code: "NG", name: "Nigeria", dialCode: "234", placeholder: "802 123 4567", nationalMaxLength: 10 },
  { code: "ZA", name: "South Africa", dialCode: "27", placeholder: "82 123 4567", nationalMaxLength: 9 },
  { code: "US", name: "United States", dialCode: "1", placeholder: "202 555 0100", nationalMaxLength: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "44", placeholder: "7911 123456", nationalMaxLength: 10 },
  { code: "CA", name: "Canada", dialCode: "1", placeholder: "416 555 0100", nationalMaxLength: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "971", placeholder: "50 123 4567", nationalMaxLength: 9 },
  { code: "DE", name: "Germany", dialCode: "49", placeholder: "151 23456789", nationalMaxLength: 11 },
  { code: "IN", name: "India", dialCode: "91", placeholder: "98765 43210", nationalMaxLength: 10 },
];

export const DEFAULT_PHONE_DIAL_CODE = "256";

const UG_MOBILE_NATIONAL = /^7\d{8}$/;

export function digitsOnly(input: string) {
  return input.replace(/\D/g, "");
}

export function getPhoneCountry(dialCode: string) {
  return PHONE_COUNTRIES.find((country) => country.dialCode === dialCode);
}

export function splitE164(stored: string | null | undefined) {
  if (!stored?.trim() || stored.includes("@")) return null;

  const normalized = stored.startsWith("+") ? stored : `+${digitsOnly(stored)}`;
  const parsed = parsePhoneNumberFromString(normalized);
  if (parsed?.isValid()) {
    return {
      dialCode: parsed.countryCallingCode,
      national: parsed.nationalNumber,
      countryCode: parsed.country ?? "UG",
    };
  }

  const digits = digitsOnly(stored);
  if (!digits) return null;

  const sorted = [...PHONE_COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length,
  );

  for (const country of sorted) {
    if (digits.startsWith(country.dialCode)) {
      return {
        dialCode: country.dialCode,
        national: digits.slice(country.dialCode.length),
        countryCode: country.code,
      };
    }
  }

  return {
    dialCode: DEFAULT_PHONE_DIAL_CODE,
    national: digits.replace(/^256/, ""),
    countryCode: "UG",
  };
}

export function combineToE164(dialCode: string, national: string): string | null {
  const dc = digitsOnly(dialCode);
  const nationalDigits = digitsOnly(national);
  if (!dc || !nationalDigits) return null;

  if (dc === "256") {
    return normalizeUgandaPhone(nationalDigits);
  }

  const country = getPhoneCountry(dc);
  if (country?.code) {
    const parsed = parsePhoneNumberFromString(nationalDigits, country.code as CountryCode);
    if (parsed?.isValid()) {
      return parsed.format("E.164");
    }
  }

  const e164 = `+${dc}${nationalDigits}`;
  return isValidE164(e164) ? e164 : null;
}

export function isValidE164(stored: string | null | undefined) {
  if (!stored?.trim()) return false;
  if (stored.includes("@")) return true;
  return isValidPhoneNumber(stored);
}

/** Parse user input into E.164 (+256…) or null if invalid. */
export function normalizeUgandaPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.includes("@")) return null;

  const digits = digitsOnly(trimmed);

  if (digits.startsWith("256")) {
    const national = digits.slice(3);
    if (UG_MOBILE_NATIONAL.test(national)) return `+256${national}`;
    return null;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    const national = digits.slice(1);
    if (UG_MOBILE_NATIONAL.test(national)) return `+256${national}`;
    return null;
  }

  if (UG_MOBILE_NATIONAL.test(digits)) {
    return `+256${digits}`;
  }

  if (trimmed.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(trimmed, "UG");
    if (parsed?.isValid()) return parsed.format("E.164");
  }

  return null;
}

export function normalizePhoneE164(
  national: string,
  dialCode = DEFAULT_PHONE_DIAL_CODE,
): string | null {
  const trimmed = national.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(trimmed);
    return parsed?.isValid() ? parsed.format("E.164") : null;
  }

  return combineToE164(dialCode, trimmed);
}

export function isValidUgandaMobile(stored: string | null | undefined) {
  if (!stored?.trim()) return false;
  const normalized = normalizeUgandaPhone(stored) ?? stored.replace(/\s/g, "");
  return /^\+2567\d{8}$/.test(normalized);
}

export function isValidStoredPhone(stored: string | null | undefined) {
  if (!stored?.trim()) return false;
  if (stored.includes("@")) return true;
  return isValidE164(stored);
}

export function formatPhoneDisplay(stored: string) {
  if (stored.includes("@")) return stored;

  const parsedNumber = parsePhoneNumberFromString(stored);
  if (parsedNumber?.isValid()) {
    return parsedNumber.formatInternational();
  }

  const parsed = splitE164(stored);
  if (!parsed) return stored;

  if (parsed.dialCode === "256" && parsed.national.length === 9) {
    return `+256 ${parsed.national.slice(0, 3)} ${parsed.national.slice(3, 6)} ${parsed.national.slice(6)}`;
  }

  return `+${parsed.dialCode} ${parsed.national}`;
}

export function nationalDigitsFromStored(stored: string) {
  return splitE164(stored)?.national ?? digitsOnly(stored);
}

export function dialCodeFromStored(stored: string) {
  return splitE164(stored)?.dialCode ?? DEFAULT_PHONE_DIAL_CODE;
}

export function telHref(stored: string) {
  if (stored.includes("@")) return `mailto:${stored}`;
  const parsed = splitE164(stored);
  if (parsed) return `tel:+${parsed.dialCode}${parsed.national}`;
  const digits = digitsOnly(stored);
  return digits ? `tel:+${digits}` : `tel:${stored}`;
}

export function whatsAppHref(stored: string, message?: string) {
  if (stored.includes("@")) return null;
  const parsed = splitE164(stored);
  const digits = parsed ? `${parsed.dialCode}${parsed.national}` : digitsOnly(stored);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function isEmailContact(value: string) {
  return value.includes("@");
}

export function isPhoneContact(value: string) {
  return !isEmailContact(value);
}

export function supportsWhatsApp(stored: string) {
  return Boolean(whatsAppHref(stored));
}
