"use client";

import Link from "next/link";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { UnlockCountdown } from "@/components/unlocks/UnlockCountdown";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps/directions";
import { ContactActions } from "@/components/contact/ContactActions";
import type { TenantUnlock } from "@/lib/api/unlocks";

export function UnlockedAccessCompact({
  unlock,
  showFullLink = true,
  showBuildingName = false,
  onViewFullDetails,
}: {
  unlock: TenantUnlock;
  showFullLink?: boolean;
  showBuildingName?: boolean;
  onViewFullDetails?: () => void;
}) {
  const { lat, lng } = unlock.location;
  const contact = unlock.contact.phone;
  const address = unlock.contact.exactAddress;

  return (
    <article className="overflow-hidden border-2 border-lime-600/35 bg-lime-50/80">
      <div className="border-b border-lime-600/20 bg-lime-600 px-3 py-2.5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-90">
          Your access
        </p>
        <p className="mt-0.5 text-base font-bold">
          Unit {unlock.unitNumber}
          {showBuildingName && unlock.buildingName ? ` · ${unlock.buildingName}` : ""}
        </p>
        <p className="mt-0.5 text-xs opacity-90">
          <UnlockCountdown expiresAt={unlock.expiresAt} />
        </p>
      </div>

      <div className="space-y-3 p-3 text-sm">
        {address ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Exact address
            </p>
            <p className="mt-1 font-medium">{address}</p>
          </div>
        ) : null}

        {contact ? (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Landlord contact
            </p>
            <div className="mt-2">
              <ContactActions
                compact
                contact={contact}
                secondaryContact={unlock.contact.phoneSecondary}
                whatsAppMessage={`Hi, I unlocked Unit ${unlock.unitNumber} on PlotPin and would like to arrange a viewing.`}
              />
            </div>
          </div>
        ) : null}

        <div className="grid gap-2">
          <a
            href={googleMapsDirectionsUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="bg-lime-700 px-3 py-2 text-center text-sm font-medium text-white"
          >
            Get directions
          </a>
          <a
            href={googleMapsPlaceUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="border border-border bg-surface px-3 py-2 text-center text-sm font-medium"
          >
            Open in Google Maps
          </a>
        </div>

        {showFullLink && onViewFullDetails ? (
          <button
            type="button"
            onClick={onViewFullDetails}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            View full details
          </button>
        ) : showFullLink && unlock.buildingId ? (
          <Link
            href={exploreBuildingUrl(unlock.buildingId, { hideMap: true })}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            View full details
          </Link>
        ) : null}
      </div>
    </article>
  );
}
