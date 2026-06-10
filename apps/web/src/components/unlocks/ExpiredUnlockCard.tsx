"use client";

import Link from "next/link";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import type { TenantUnlock } from "@/lib/api/unlocks";

export function ExpiredUnlockCard({ unlock }: { unlock: TenantUnlock }) {
  const expiredDate = unlock.expiresAt
    ? new Date(unlock.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Past unlock
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">
            Unit {unlock.unitNumber}
            {unlock.buildingName ? ` · ${unlock.buildingName}` : ""}
          </p>
          {expiredDate ? (
            <p className="mt-1 text-sm text-muted">Ended {expiredDate}</p>
          ) : null}
        </div>
        <span className="bg-muted/30 px-2 py-1 text-xs font-medium text-muted">
          Expired
        </span>
      </div>

      <p className="mt-4 text-sm text-muted">
        {unlock.locksUnit === false
          ? "Your verified contact window has ended. Landlord details are no longer shown here."
          : "Your exclusive window has ended. Contact details are no longer available from this unlock."}
      </p>

      <Link
        href={exploreBuildingUrl(unlock.buildingId, { hideMap: true })}
        className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
      >
        Unlock again on Explore →
      </Link>
    </article>
  );
}
