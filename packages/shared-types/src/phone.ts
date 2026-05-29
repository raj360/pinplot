/** Phone helpers — store contacts as E.164 (+…). Uganda is the default market. */

export type PhoneCountry = {
  code: string;
  name: string;
  dialCode: string;
  placeholder: string;
  nationalMaxLength: number;
};

/** Common markets for Uganda launch + diaspora landlords/testers. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: "UG", name: "Uganda", dialCode: "256", placeholder: "700 000 000", nationalMaxLength: 9 },
  { code: "KE", name: "Kenya", dialCode: "254", placeholder: "712 345 678", nationalMaxLength: 9 },
  { code: "TZ", name: "Tanzania", dialCode: "255", placeholder: "712 345 678", nationalMaxLength: 9 },
  { code: "RW", name: "Rwanda", dialCode: "250", placeholder: "781 234 567", nationalMaxLength: 9 },
  { code: "US", name: "United States", dialCode: "1", placeholder: "202 555 0100", nationalMaxLength: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "44", placeholder: "7911 123456", nationalMaxLength: 10 },
  { code: "CA", name: "Canada", dialCode: "1", placeholder: "416 555 0100", nationalMaxLength: 10 },
  { code: "AE", name: "UAE", dialCode: "971", placeholder: "50 123 4567", nationalMaxLength: 9 },
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
  const maxLen = country?.nationalMaxLength ?? 15;
  if (nationalDigits.length < 6 || nationalDigits.length > maxLen) return null;

  const e164 = `+${dc}${nationalDigits}`;
  return isValidE164(e164) ? e164 : null;
}

export function isValidE164(stored: string | null | undefined) {
  if (!stored?.trim()) return false;
  if (stored.includes("@")) return true;
  const digits = digitsOnly(stored);
  return digits.length >= 8 && digits.length <= 15;
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

  if (trimmed.startsWith("+") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
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
    const digits = digitsOnly(trimmed);
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
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
