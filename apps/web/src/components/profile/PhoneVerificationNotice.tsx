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

  return (
    <div className="border border-dashed border-border bg-muted/20 px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label} verification
      </p>
      <p className="mt-1 text-xs text-muted">
        SMS verification is planned for the next sprint. Your number is saved
        but not verified yet — tenants can still call you today.
      </p>
    </div>
  );
}

export function profileHasUnverifiedPhones(profile: UserProfile | null) {
  if (!profile) return false;
  return Boolean(
    (profile.phone && !profile.phone_verified_at) ||
      (profile.phone_secondary && !profile.phone_secondary_verified_at),
  );
}
