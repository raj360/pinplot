"use client";

import Link from "next/link";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { UnlockCountdown } from "@/components/unlocks/UnlockCountdown";
import { UnlockTimeProgress } from "@/components/unlocks/UnlockTimeProgress";
import { LocationMiniMap } from "@/components/maps/LocationMiniMap";
import { googleMapsDirectionsUrl, googleMapsPlaceUrl } from "@/lib/maps/directions";
import { formatCurrency } from "@/lib/intl/format";
import { PRICING } from "@plotpin/shared-types";
import type { TenantUnlock } from "@/lib/api/unlocks";
import { ContactActions } from "@/components/contact/ContactActions";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { resolveImageUrls } from "@/lib/buildings/media";
import { trackUnlockEngagement } from "@/lib/analytics/track-unlock-engagement";
import type { ContactEngagementAction } from "@/components/contact/ContactActions";
import {
  UnlockAccessMobileBar,
  UnlockAccessTools,
} from "@/components/unlocks/UnlockAccessTools";

function engagementTracker(
  unlock: Pick<TenantUnlock, "unlockId" | "buildingId" | "unitId">,
) {
  return (action: ContactEngagementAction) => {
    if (action === "call") {
      trackUnlockEngagement("CONTACT_CALL", unlock);
    } else if (action === "whatsapp") {
      trackUnlockEngagement("CONTACT_WHATSAPP", unlock);
    } else {
      trackUnlockEngagement("CONTACT_COPY", unlock);
    }
  };
}

export function UnlockedAccessCard({
  unlock,
  showBuildingLink = true,
  showAccessNote = true,
  /** Pre-purchase flows hide contact behind a tap. Paid unlock hubs show it immediately. */
  revealOnClick = false,
  showMobileActions = true,
}: {
  unlock: TenantUnlock;
  showBuildingLink?: boolean;
  showAccessNote?: boolean;
  revealOnClick?: boolean;
  showMobileActions?: boolean;
}) {
  const { lat, lng } = unlock.location;
  const contact = unlock.contact.phone;
  const address = unlock.contact.exactAddress;
  const photos = resolveImageUrls(unlock);
  const coverPhoto = photos[0];
  const track = engagementTracker(unlock);
  const whatsAppMessage = `Hi, I unlocked Unit ${unlock.unitNumber} on PlotPin and would like to arrange a viewing.`;

  return (
    <>
      <article
        className={`overflow-hidden rounded-[var(--radius-DEFAULT)] border border-border bg-surface ${showMobileActions ? "pb-20 lg:pb-0" : ""}`}
      >
      <div className="border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="flex gap-4 p-4">
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPhoto}
              alt=""
              className="hidden h-20 w-28 shrink-0 object-cover sm:block"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
              Unlocked · paid access
            </p>
            <p className="mt-1 text-lg font-bold leading-snug">
              Unit {unlock.unitNumber}
              {unlock.buildingName ? ` · ${unlock.buildingName}` : ""}
            </p>
            <p className="mt-1 text-sm opacity-90">
              <UnlockCountdown
                expiresAt={unlock.expiresAt}
                locksUnit={unlock.locksUnit ?? true}
              />
            </p>
            <UnlockTimeProgress
              unlockedAt={unlock.unlockedAt}
              expiresAt={unlock.expiresAt}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="space-y-4">
          {contact ? (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                {unlock.contact.contactIsEmailFallback
                  ? "Landlord email"
                  : "Landlord contact"}
              </h3>
              <div className="mt-2">
                <ContactActions
                  contact={contact}
                  secondaryContact={unlock.contact.phoneSecondary}
                  whatsAppMessage={whatsAppMessage}
                  compact
                  revealOnClick={revealOnClick}
                  onEngagement={track}
                />
              </div>
            </section>
          ) : null}

          {address ? (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
                Exact address
              </h3>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
                  {address}
                </p>
                <CopyTextButton
                  text={address}
                  onCopy={() => trackUnlockEngagement("CONTACT_COPY", unlock)}
                />
              </div>
            </section>
          ) : null}

          {showAccessNote ? (
            <p className="text-xs text-muted lg:hidden">
              You paid {formatCurrency(PRICING.tenantUnlockFeeUgx)} for{" "}
              {unlock.exclusiveHours}h{" "}
              {unlock.locksUnit === false ? "verified contact" : "exclusive"}{" "}
              access. Return here anytime before it expires.
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <LocationMiniMap
            lat={lat}
            lng={lng}
            label={unlock.buildingName ?? "Property"}
            className="h-44 sm:h-48"
          />
          <a
            href={googleMapsDirectionsUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackUnlockEngagement("DIRECTIONS", unlock)}
            className="flex min-h-11 items-center justify-center bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Get directions
          </a>
          <a
            href={googleMapsPlaceUrl(lat, lng)}
            target="_blank"
            rel="noreferrer"
            className="block text-center text-xs font-medium text-primary hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

      <div className="space-y-3 border-t border-border px-4 py-3">
        <UnlockAccessTools unlock={unlock} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          {showAccessNote ? (
            <p className="hidden lg:block">
              Paid {formatCurrency(PRICING.tenantUnlockFeeUgx)} ·{" "}
              {unlock.exclusiveHours}h{" "}
              {unlock.locksUnit === false ? "contact" : "exclusive"} access ·
              Unlocked{" "}
              {new Date(unlock.unlockedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
          ) : (
            <span />
          )}
          {showBuildingLink && unlock.buildingId ? (
            <Link
              href={exploreBuildingUrl(unlock.buildingId, { hideMap: true })}
              className="font-medium text-primary hover:underline"
            >
              View listing
            </Link>
          ) : null}
        </div>
      </div>
      </article>
      {showMobileActions ? <UnlockAccessMobileBar unlock={unlock} /> : null}
    </>
  );
}
