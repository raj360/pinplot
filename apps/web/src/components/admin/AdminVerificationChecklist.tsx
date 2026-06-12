"use client";

import type { AdminVerificationChecklist } from "@plotpin/shared-types";
import { cn } from "@/lib/utils/cn";

const ITEMS: { key: keyof AdminVerificationChecklist; label: string }[] = [
  {
    key: "phoneMatchesListing",
    label: "Listing phone matches landlord profile (or documented agent)",
  },
  { key: "photosAuthentic", label: "Photos match building type and area" },
  { key: "pinPlausible", label: "Pin is plausible for stated district/city" },
  { key: "rentConsistent", label: "Rent on units is internally consistent" },
  {
    key: "duplicatePinReviewed",
    label: "Duplicate pin risk reviewed (see warnings below)",
  },
  { key: "landlordNotSuspended", label: "Landlord account is not suspended" },
  {
    key: "ownershipAttestationRecorded",
    label: "Ownership attestation recorded on submit",
  },
];

export function VerificationChecklistForm({
  value,
  onChange,
  ownershipAttestedAt,
  landlordPhoneMissing,
  landlordSuspended,
  className,
}: {
  value: AdminVerificationChecklist;
  onChange: (next: AdminVerificationChecklist) => void;
  ownershipAttestedAt: string | null;
  landlordPhoneMissing: boolean;
  landlordSuspended: boolean | null;
  className?: string;
}) {
  function toggle(key: keyof AdminVerificationChecklist) {
    onChange({ ...value, [key]: !value[key] });
  }

  return (
    <section
      className={cn(
        "border border-border bg-surface p-4",
        className,
      )}
    >
      <h2 className="text-sm font-medium">Verification checklist</h2>
      <p className="mt-1 text-xs text-muted">
        All items required before Approve & go live.
      </p>
      {landlordPhoneMissing ? (
        <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          Landlord has no phone on profile. Approval is blocked until they add
          one in Settings.
        </p>
      ) : null}
      {!ownershipAttestedAt ? (
        <p className="mt-2 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Ownership attestation missing on this listing.
        </p>
      ) : null}
      {landlordSuspended ? (
        <p className="mt-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          Landlord account is suspended.
        </p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {ITEMS.map((item) => (
          <li key={item.key}>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={value[item.key]}
                onChange={() => toggle(item.key)}
                disabled={
                  item.key === "ownershipAttestationRecorded" &&
                  !ownershipAttestedAt
                }
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const EMPTY_VERIFICATION_CHECKLIST: AdminVerificationChecklist = {
  phoneMatchesListing: false,
  photosAuthentic: false,
  pinPlausible: false,
  rentConsistent: false,
  duplicatePinReviewed: false,
  landlordNotSuspended: false,
  ownershipAttestationRecorded: false,
};
