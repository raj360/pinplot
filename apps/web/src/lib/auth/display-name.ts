import type { UserProfile } from "@/lib/api/profiles";

/** Initials for the header avatar (SchoolSpring-style). */
export function getUserInitials(
  email: string | undefined,
  profile: UserProfile | null,
): string {
  const first = profile?.first_name?.trim();
  const last = profile?.last_name?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();

  if (email) {
    const local = email.split("@")[0] ?? "";
    const parts = local.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }

  return "?";
}

export function getUserDisplayLabel(
  email: string | undefined,
  profile: UserProfile | null,
): string {
  const first = profile?.first_name?.trim();
  const last = profile?.last_name?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return email ?? "Account";
}
