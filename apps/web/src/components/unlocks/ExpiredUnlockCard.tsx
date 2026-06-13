"use client";

import Link from "next/link";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { resolveImageUrls } from "@/lib/buildings/media";
import type { TenantUnlock } from "@/lib/api/unlocks";
import { cn } from "@/lib/utils/cn";

export function ExpiredUnlockCard({
  unlock,
  highlighted = false,
}: {
  unlock: TenantUnlock;
  highlighted?: boolean;
}) {
  const expiredDate = unlock.expiresAt
    ? new Date(unlock.expiresAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const coverPhoto = resolveImageUrls(unlock)[0];

  return (
    <article
      className={cn(
        "card-elevated p-4",
        highlighted && "ring-2 ring-primary/25",
      )}
    >
      <div className="flex gap-4">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt=""
            className="hidden h-16 w-24 shrink-0 object-cover sm:block"
          />
        ) : null}
        <div className="min-w-0 flex-1">
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
            <span className="rounded-[var(--radius-DEFAULT)] bg-muted/30 px-2 py-1 text-xs font-medium text-muted">
              Expired
            </span>
          </div>

          <p className="mt-3 text-sm text-muted">
            {unlock.locksUnit === false
              ? "Your verified contact window has ended. Landlord details are no longer shown here."
              : "Your exclusive window has ended. Contact details are no longer available from this unlock."}
          </p>

          <Link
            href={exploreBuildingUrl(unlock.buildingId, { hideMap: true })}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Unlock again on Explore →
          </Link>
        </div>
      </div>
    </article>
  );
}
