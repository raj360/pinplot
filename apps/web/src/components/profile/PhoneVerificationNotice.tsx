import type { UserProfile } from "@/lib/api/profiles";

export function PhoneVerificationNotice({
  phone,
  verifiedAt,
  label = "Primary phone",
}: {
  phone?: string | null;
  verifiedAt?: string | null;
  label?: string;
}) {
  if (!phone) return null;

  if (verifiedAt) {
    return (
      <p className="text-xs text-lime-700">
        {label} verified · {new Date(verifiedAt).toLocaleDateString()}
      </p>
    );
  }

  return null;
}

/** One-line summary when any saved number is not SMS-verified yet. */
export function ProfilePhoneVerificationSummary({
  profile,
}: {
  profile: UserProfile | null;
}) {
  if (!profileHasUnverifiedPhones(profile)) return null;

  return (
    <p className="text-xs text-muted">
      SMS verification is coming soon. Your numbers are saved and tenants can
      still call you today.
    </p>
  );
}

export function profileHasUnverifiedPhones(profile: UserProfile | null) {
  if (!profile) return false;
  return Boolean(
    (profile.phone && !profile.phone_verified_at) ||
      (profile.phone_secondary && !profile.phone_secondary_verified_at),
  );
}
