"use client";

import Link from "next/link";
import { UnlockCountdown } from "@/components/unlocks/UnlockCountdown";
import { LocationMiniMap } from "@/components/maps/LocationMiniMap";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps/directions";
import { formatCurrency } from "@/lib/intl/format";
import { PRICING } from "@plotpin/shared-types";
import type { TenantUnlock } from "@/lib/api/unlocks";
import { ContactActions } from "@/components/contact/ContactActions";

export function UnlockedAccessCard({
  unlock,
  showBuildingLink = true,
  showAccessNote = true,
}: {
  unlock: TenantUnlock;
  showBuildingLink?: boolean;
  showAccessNote?: boolean;
}) {
  const { lat, lng } = unlock.location;
  const contact = unlock.contact.phone;
  const address = unlock.contact.exactAddress;

  return (
    <article className="overflow-hidden border border-border bg-surface">
      <div className="border-b border-primary/20 bg-primary px-4 py-3 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
          Unlocked · paid access
        </p>
        <p className="mt-1 text-lg font-bold">
          Unit {unlock.unitNumber}
          {unlock.buildingName ? ` · ${unlock.buildingName}` : ""}
        </p>
        <p className="mt-1 text-sm opacity-90">
          <UnlockCountdown expiresAt={unlock.expiresAt} />
        </p>
      </div>

      <div className="space-y-4 p-4">
        <LocationMiniMap
          lat={lat}
          lng={lng}
          label={unlock.buildingName ?? "Property"}
          className="h-36"
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={googleMapsDirectionsUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
          >
            Get directions
          </a>
          <a
            href={googleMapsPlaceUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="border border-border bg-background px-4 py-2 text-center text-sm font-medium"
          >
            Open in Google Maps
          </a>
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          {address ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Exact address
              </dt>
              <dd className="mt-1 font-medium">{address}</dd>
            </div>
          ) : null}
          {contact ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                {unlock.contact.contactIsEmailFallback
                  ? "Landlord email"
                  : "Landlord contact"}
              </dt>
              <dd className="mt-2">
                <ContactActions
                  contact={contact}
                  secondaryContact={unlock.contact.phoneSecondary}
                  whatsAppMessage={`Hi, I unlocked Unit ${unlock.unitNumber} on PlotPin and would like to arrange a viewing.`}
                />
              </dd>
            </div>
          ) : null}
        </dl>

        {showAccessNote ? (
          <p className="text-xs text-muted">
            You paid {formatCurrency(PRICING.tenantUnlockFeeUgx)} for{" "}
            {PRICING.unlockExclusiveHours}h exclusive access. Save this page or
            visit{" "}
            <Link href="/tenant/unlocks" className="text-primary hover:underline">
              My unlocks
            </Link>{" "}
            anytime before it expires.
          </p>
        ) : null}

        {showBuildingLink && unlock.buildingId ? (
          <Link
            href={`/buildings/${unlock.buildingId}`}
            className="inline-block text-sm text-primary hover:underline"
          >
            View building page
          </Link>
        ) : null}
      </div>
    </article>
  );
}
