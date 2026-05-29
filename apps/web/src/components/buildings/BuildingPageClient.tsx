"use client";

import { BuildingStepHeader } from "@/components/buildings/BuildingStepHeader";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { BuildingUnlockedHero } from "@/components/buildings/BuildingUnlockedHero";
import { UnlockPurchasePanel } from "@/components/buildings/UnlockPurchasePanel";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { LoadingState } from "@/components/ui/loading-state";
import type { BuildingDetail } from "@/lib/api/buildings";
import { mergeBuildingMedia } from "@/lib/buildings/media";
import { formatCurrency } from "@/lib/intl/format";
import { useBuildingUnlocks } from "@/lib/unlocks/use-building-unlocks";
import Link from "next/link";
import { PRICING } from "@plotpin/shared-types";

export function BuildingPageClient({ building }: { building: BuildingDetail }) {
  const unlocks = useBuildingUnlocks(building.id, building.units);
  const location = [building.district, building.city].filter(Boolean).join(", ");
  const hasAccess = unlocks.activeUnlocks.length > 0;
  const media = mergeBuildingMedia(building, unlocks.activeUnlocks[0]);

  if (unlocks.loading) {
    return (
      <div className="mt-4">
        <LoadingState label="Loading building access" compact />
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <BuildingUnlockedHero
          name={building.name}
          location={location}
          imageUrls={media.imageUrls}
          coverImageUrl={media.coverImageUrl}
          videoUrl={media.videoUrl}
        />

        <section className="space-y-4">
          <BuildingStepHeader
            step={1}
            label="Visit"
            title="Your exclusive access"
            description="Exact address, landlord contact, and directions for units you unlocked."
          />
          {unlocks.activeUnlocks.map((unlock) => (
            <UnlockedAccessCard
              key={unlock.unlockId}
              unlock={unlock}
              showBuildingLink={false}
              showAccessNote={false}
            />
          ))}
          <p className="text-xs text-muted">
            You paid {formatCurrency(PRICING.tenantUnlockFeeUgx)} per unit for{" "}
            {PRICING.unlockExclusiveHours}h exclusive access. Save this page or
            visit{" "}
            <Link href="/tenant/unlocks" className="text-primary hover:underline">
              My unlocks
            </Link>{" "}
            anytime before it expires.
          </p>
        </section>

        {unlocks.availableUnits.length > 0 ? (
          <section className="space-y-4 border-t border-border pt-6">
            <BuildingStepHeader
              step={2}
              label="Unlock more"
              title="Unlock another unit"
              description="Other units may still be available at this building when you arrive."
              optional
            />
            <UnlockPurchasePanel
              buildingId={building.id}
              availableUnits={unlocks.availableUnits}
              error={unlocks.error}
              isAuthenticated={unlocks.isAuthenticated}
              onUnlock={unlocks.handleUnlock}
              unlockingId={unlocks.unlockingId}
              showHeading={false}
              description="Each unit unlock includes its own contact window and directions."
            />
          </section>
        ) : null}

        <details className="group border-t border-border pt-6">
          <summary className="cursor-pointer list-none marker:content-none text-sm font-medium text-muted [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-border underline-offset-2 group-open:no-underline">
              Building overview · {building.units.length} units
            </span>
          </summary>
          <div className="mt-4">
            <BuildingDetailPanel
              building={building}
              compact
              showUnlockLink={false}
            />
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(18rem,100%)] lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-4">
        <BuildingDetailPanel building={building} showUnlockLink={false} />

        {building.hasPremiumMedia ? (
          <p className="border border-dashed border-border bg-surface px-3 py-2.5 text-sm text-muted">
            Photos and building tour unlock after you pay for contact access.
          </p>
        ) : null}
      </div>

      {unlocks.showUnlockSection ? (
        <aside className="min-w-0 lg:sticky lg:top-20">
          <section className="space-y-3">
            <BuildingStepHeader
              step={1}
              label="Unlock"
              title="Get landlord contact"
              description="Pay once to reveal exact address, contact details, photos, and directions."
            />
            <UnlockPurchasePanel
              buildingId={building.id}
              availableUnits={unlocks.availableUnits}
              error={unlocks.error}
              isAuthenticated={unlocks.isAuthenticated}
              onUnlock={unlocks.handleUnlock}
              unlockingId={unlocks.unlockingId}
              showHeading={false}
              layout="sidebar"
            />
          </section>
        </aside>
      ) : null}
    </div>
  );
}
