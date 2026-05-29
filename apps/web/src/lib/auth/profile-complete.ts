import type { UserProfile } from "@/lib/api/profiles";
import { isValidStoredPhone } from "@plotpin/shared-types";

export function isProfileIncomplete(profile: UserProfile | null | undefined) {
  if (!profile) return false;

  const firstName = profile.first_name?.trim();
  const phone = profile.phone?.trim();

  if (!firstName || !phone) return true;

  return !isValidStoredPhone(phone);
}

export function profileCompletionMessage(role: UserProfile["role"] | undefined) {
  if (role === "LANDLORD") {
    return "Tenants reach you by call or WhatsApp when they unlock a unit. Uganda (+256) is recommended for local listings; add an international number if you're abroad.";
  }
  return "Add your name and a reachable phone number. Uganda (+256) is the default, but you can pick another country if you're testing from abroad.";
}
