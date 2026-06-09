"use client";

import Link from "next/link";
import { PRICING } from "@plotpin/shared-types";
import { BuildingStepHeader } from "@/components/buildings/BuildingStepHeader";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { BuildingLockedCoverPreview } from "@/components/buildings/BuildingLockedCoverPreview";
import { BuildingUnlockedHero } from "@/components/buildings/BuildingUnlockedHero";
import { UnlockPurchasePanel } from "@/components/buildings/UnlockPurchasePanel";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { UnlockedAccessCompact } from "@/components/buildings/UnlockedAccessCompact";
import { UnlockSectionSkeleton } from "@/components/explore/BuildingPreviewSkeleton";
import { ReportListingPanel } from "@/components/buildings/ReportListingPanel";
import type { BuildingDetail } from "@/lib/api/buildings";
import { mergeBuildingMedia } from "@/lib/buildings/media";
import { formatCurrency } from "@/lib/intl/format";
import {
  unlockPanelDescription,
} from "@/lib/unlocks/unlock-pricing";
import { useBuildingUnlocks } from "@/lib/unlocks/use-building-unlocks";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

type BuildingDetailExperienceProps = {
  building: BuildingDetail;
  variant?: "compact" | "full";
  /** stack = explore pane / sheet; sidebar = building page two-column */
  layout?: "stack" | "sidebar";
  onUnlockSuccess?: () => void;
  onExpandToFull?: () => void;
  hideHeader?: boolean;
};

export function BuildingDetailExperience({
  building,
  variant = "full",
  layout = "stack",
  onUnlockSuccess,
  onExpandToFull,
  hideHeader = false,
}: BuildingDetailExperienceProps) {
  const { formatUnlockFee, viewer } = useViewerContext();
  const unlocks = useBuildingUnlocks(building.id, building.units, {
    buildingType: building.buildingType,
    countryCode: building.countryCode,
    tenantCountryCode: viewer.countryCode,
  });
  const location = [building.district, building.city].filter(Boolean).join(", ");
  const hasAccess = unlocks.activeUnlocks.length > 0;
  const media = mergeBuildingMedia(building, unlocks.activeUnlocks[0]);

  const handleUnlock = async (unitId: string) => {
    const ok = await unlocks.handleUnlock(unitId);
    if (ok) onUnlockSuccess?.();
  };

  const unlockPanelLayout = layout === "sidebar" ? "sidebar" : "grid";

  const unlockPanelProps = {
    buildingId: building.id,
    availableUnits: unlocks.availableUnits,
    error: unlocks.error,
    isAuthenticated: unlocks.isAuthenticated,
    onUnlock: handleUnlock,
    unlockingId: unlocks.unlockingId,
    unlockCredits: unlocks.unlockCredits,
    primaryCreditUgx: unlocks.primaryCreditUgx,
    unitQuotes: unlocks.unitQuotes,
    representativeQuote: unlocks.representativeQuote,
    layout: unlockPanelLayout,
    showUnlockTerms: unlocks.showUnlockTerms,
    needsUnlockTerms: unlocks.showUnlockTerms,
    acceptUnlockTerms: unlocks.acceptUnlockTerms,
    onAcceptUnlockTermsChange: unlocks.setAcceptUnlockTerms,
    checkoutMethod: unlocks.checkoutMethod,
    onCheckoutMethodChange: unlocks.setCheckoutMethod,
    showMobileMoneyCheckout: unlocks.showMobileMoneyCheckout,
    profilePhone: unlocks.profilePhone,
    listingCurrency: building.currency,
    listingCountryCode: building.countryCode,
  } as const;

  const firstUnlockDescription = unlockPanelDescription({
    unlockCredits: unlocks.unlockCredits,
    primaryCreditUgx: unlocks.primaryCreditUgx,
    quote: unlocks.representativeQuote,
    formatFee: formatUnlockFee,
  });

  if (variant === "compact") {
    if (hasAccess && building.availableUnitCount === 0) {
      return (
        <div className="space-y-3">
          {unlocks.activeUnlocks.map((unlock) => (
            <UnlockedAccessCompact
              key={unlock.unlockId}
              unlock={unlock}
              showFullLink={Boolean(onExpandToFull)}
              showBuildingName={false}
              onViewFullDetails={onExpandToFull}
            />
          ))}
        </div>
      );
    }

    if (hasAccess) {
      return (
        <div className="space-y-3">
          {unlocks.activeUnlocks.map((unlock) => (
            <UnlockedAccessCompact
              key={unlock.unlockId}
              unlock={unlock}
              showFullLink={Boolean(onExpandToFull)}
              showBuildingName={false}
              onViewFullDetails={onExpandToFull}
            />
          ))}

          {unlocks.loadingUnlocks && building.availableUnitCount > 0 ? (
            <UnlockSectionSkeleton />
          ) : unlocks.showUnlockSection && building.availableUnitCount > 0 ? (
            <UnlockPurchasePanel
              {...unlockPanelProps}
              title="Unlock another unit"
              description={firstUnlockDescription}
            />
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {building.coverThumbUrl ? (
          <BuildingLockedCoverPreview
            src={building.coverThumbUrl}
            constrainOnDesktop={false}
          />
        ) : null}

        <BuildingDetailPanel
          building={building}
          compact
          showUnlockLink={false}
          hideHeader={hideHeader}
        />

        {unlocks.loadingUnlocks && building.availableUnitCount > 0 ? (
          <UnlockSectionSkeleton />
        ) : unlocks.showUnlockSection && building.availableUnitCount > 0 ? (
          <UnlockPurchasePanel
            {...unlockPanelProps}
            title="Unlock contact"
            description={firstUnlockDescription}
          />
        ) : null}
      </div>
    );
  }

  if (hasAccess) {
    return (
      <div className="space-y-6">
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
            {PRICING.unlockExclusiveHours}h exclusive access. Visit{" "}
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
              {...unlockPanelProps}
              showHeading={false}
              description="Each unit unlock includes its own contact window and directions."
            />
          </section>
        ) : null}

        <ReportListingPanel
          buildingId={building.id}
          buildingName={building.name}
        />

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

  const detailColumn = (
    <div className="min-w-0 space-y-4">
      {building.coverThumbUrl && !hasAccess ? (
        <BuildingLockedCoverPreview src={building.coverThumbUrl} />
      ) : null}

      <BuildingDetailPanel
        building={building}
        showUnlockLink={false}
        hideHeader={hideHeader}
      />

      {building.hasPremiumMedia && !hasAccess ? (
        <p className="border border-dashed border-border bg-surface px-3 py-2.5 text-sm text-muted">
          Full photo gallery and building tour unlock after you pay for contact
          access.
        </p>
      ) : null}
    </div>
  );

  const unlockColumn =
    unlocks.loadingUnlocks && !unlocks.activeUnlocks.length ? (
      <section className="min-w-0 space-y-3">
        <BuildingStepHeader
          step={1}
          label="Unlock"
          title="Get landlord contact"
          description="Pay once to reveal exact address, contact details, photos, and directions."
        />
        <UnlockSectionSkeleton />
      </section>
    ) : unlocks.showUnlockSection ? (
      <section className="min-w-0 space-y-3">
        <BuildingStepHeader
          step={1}
          label="Unlock"
          title="Get landlord contact"
          description="Pay once to reveal exact address, contact details, photos, and directions."
        />
        <UnlockPurchasePanel {...unlockPanelProps} showHeading={false} />
      </section>
    ) : null;

  if (layout === "sidebar") {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(18rem,100%)] lg:items-start lg:gap-8">
        {detailColumn}
        {unlockColumn ? (
          <aside className="min-w-0 lg:sticky lg:top-20">{unlockColumn}</aside>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {detailColumn}
      {unlockColumn}
    </div>
  );
}
