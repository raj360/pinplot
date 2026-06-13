import { apiFetch } from "./client";

export type UserProfile = {
  id: string;
  role: "TENANT" | "LANDLORD" | "ADMIN" | "SUPERADMIN";
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone_secondary?: string | null;
  phone_verified_at?: string | null;
  phone_secondary_verified_at?: string | null;
  country_code: string;
  is_verified: boolean;
  created_at?: string;
  landlord_terms_accepted_at?: string | null;
  tenant_unlock_terms_accepted_at?: string | null;
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName?: string;
  phone: string;
  phoneSecondary?: string;
};

export function fetchMyProfile() {
  return apiFetch<UserProfile | null>("/profiles/me");
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return apiFetch<UserProfile>("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** localStorage timestamp, snooze profile prompt for 7 days. */
export const PROFILE_PROMPT_SNOOZED_KEY = "plotpin-profile-prompt-snoozed-at";
export const PROFILE_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function isProfilePromptSnoozed() {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(PROFILE_PROMPT_SNOOZED_KEY);
  if (!raw) return false;
  const snoozedAt = Number(raw);
  if (!Number.isFinite(snoozedAt)) return false;
  return Date.now() - snoozedAt < PROFILE_PROMPT_SNOOZE_MS;
}

export function snoozeProfilePrompt() {
  localStorage.setItem(PROFILE_PROMPT_SNOOZED_KEY, String(Date.now()));
}

export function clearProfilePromptSnooze() {
  localStorage.removeItem(PROFILE_PROMPT_SNOOZED_KEY);
}

export function notifyProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("plotpin:profile-updated"));
}
