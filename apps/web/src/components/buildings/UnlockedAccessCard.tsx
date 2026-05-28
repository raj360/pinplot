"use client";

import Link from "next/link";
import { LocationMiniMap } from "@/components/maps/LocationMiniMap";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps/directions";
import { formatCurrency } from "@/lib/intl/format";
import { PRICING } from "@plotpin/shared-types";
import type { TenantUnlock } from "@/lib/api/unlocks";

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Exclusive access active";
  const end = new Date(expiresAt);
  const hours = Math.max(
    0,
    Math.round((end.getTime() - Date.now()) / (1000 * 60 * 60)),
  );
  if (hours <= 0) return "Access expiring soon";
  return `${hours}h of exclusive access remaining`;
}

function contactHref(phone: string) {
  if (phone.includes("@")) return `mailto:${phone}`;
  const digits = phone.replace(/\s/g, "");
  return digits.startsWith("+") ? `tel:${digits}` : `tel:+${digits}`;
}

export function UnlockedAccessCard({
  unlock,
  showBuildingLink = true,
}: {
  unlock: TenantUnlock;
  showBuildingLink?: boolean;
}) {
  const { lat, lng } = unlock.location;
  const contact = unlock.contact.phone;
  const address = unlock.contact.exactAddress;

  return (
    <article className="overflow-hidden border-2 border-primary/30 bg-primary/5">
      <div className="border-b border-primary/20 bg-primary px-4 py-3 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
          Unlocked · paid access
        </p>
        <p className="mt-1 text-lg font-bold">
          Unit {unlock.unitNumber}
          {unlock.buildingName ? ` · ${unlock.buildingName}` : ""}
        </p>
        <p className="mt-1 text-sm opacity-90">{formatExpiry(unlock.expiresAt)}</p>
      </div>

      <div className="space-y-4 p-4">
        <LocationMiniMap
          lat={lat}
          lng={lng}
          label={unlock.buildingName ?? "Property"}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={googleMapsDirectionsUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
          >
            Get directions
          </a>
          <a
            href={googleMapsPlaceUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="border border-border bg-surface px-4 py-2.5 text-center text-sm font-medium"
          >
            Open in Google Maps
          </a>
        </div>

        <dl className="space-y-3 text-sm">
          {address ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Exact address
              </dt>
              <dd className="mt-1 font-medium">{address}</dd>
            </div>
          ) : null}
          {contact ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Landlord contact
              </dt>
              <dd className="mt-1">
                <a
                  href={contactHref(contact)}
                  className="font-medium text-primary hover:underline"
                >
                  {contact}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        <p className="text-xs text-muted">
          You paid {formatCurrency(PRICING.tenantUnlockFeeUgx)} for{" "}
          {PRICING.unlockExclusiveHours}h exclusive access. Save this page or
          visit{" "}
          <Link href="/tenant/unlocks" className="text-primary hover:underline">
            My unlocks
          </Link>{" "}
          anytime before it expires.
        </p>

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
