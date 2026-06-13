import { parsePhoneNumber } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";
import type { UserProfile } from "@/lib/api/profiles";
import {
  inferViewerCountryFromBrowser,
  readStoredViewerCountry,
} from "@/lib/intl/resolve-viewer-country";

/** Neutral international fallback when region cannot be inferred. */
const PHONE_COUNTRY_FALLBACK: Country = "GB";

function isPhoneCountry(code: string | null | undefined): code is Country {
  if (!code?.trim()) return false;
  return /^[A-Z]{2}$/i.test(code.trim());
}

/**
 * Default phone country for profile forms: saved number, account country,
 * display-country override, then browser region. Avoids hardcoding Uganda.
 */
export function resolveProfilePhoneDefaultCountry(
  profile: UserProfile | null | undefined,
  phone?: string | null,
): Country {
  const storedPhone = phone?.trim() || profile?.phone?.trim();
  if (storedPhone) {
    try {
      const parsed = parsePhoneNumber(storedPhone);
      if (parsed?.country && isPhoneCountry(parsed.country)) {
        return parsed.country as Country;
      }
    } catch {
      /* ignore parse errors */
    }
  }

  const profileCountry = profile?.country_code?.trim().toUpperCase();
  if (isPhoneCountry(profileCountry)) {
    return profileCountry as Country;
  }

  const storedViewer = readStoredViewerCountry()?.trim().toUpperCase();
  if (isPhoneCountry(storedViewer)) {
    return storedViewer as Country;
  }

  const inferred = inferViewerCountryFromBrowser();
  if (isPhoneCountry(inferred)) {
    return inferred as Country;
  }

  return PHONE_COUNTRY_FALLBACK;
}
