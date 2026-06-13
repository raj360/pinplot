import { formatPhoneDisplay } from "@plotpin/shared-types";
import type { UserProfile } from "@/lib/api/profiles";
import { getUserDisplayLabel } from "@/lib/auth/display-name";
import { isCompletePhoneNumber } from "@/lib/profile/phone-input";

export function ProfileAccountSummary({
  profile,
  email,
}: {
  profile: UserProfile | null;
  email?: string;
}) {
  const displayName = getUserDisplayLabel(email, profile);
  const phones = [profile?.phone, profile?.phone_secondary].filter(
    (value): value is string => Boolean(value && isCompletePhoneNumber(value)),
  );

  if (!displayName && !email && phones.length === 0) {
    return null;
  }

  return (
    <div className="card-elevated px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Account
      </p>
      <dl className="mt-2 space-y-2 text-sm">
        <div>
          <dt className="sr-only">Name</dt>
          <dd className="font-medium text-foreground">{displayName}</dd>
        </div>
        {email ? (
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="mt-0.5 text-foreground">{email}</dd>
          </div>
        ) : null}
        {phones.length > 0 ? (
          <div>
            <dt className="text-xs text-muted">Phone</dt>
            <dd className="mt-0.5 text-foreground">
              {phones.map((phone) => formatPhoneDisplay(phone)).join(" · ")}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
