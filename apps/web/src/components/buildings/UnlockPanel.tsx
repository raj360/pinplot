"use client";

import { UnlockPurchasePanel } from "@/components/buildings/UnlockPurchasePanel";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { LoadingState } from "@/components/ui/loading-state";
import { useBuildingUnlocks } from "@/lib/unlocks/use-building-unlocks";
import type { UnitLike } from "@/lib/buildings/unit-summary";

/** Legacy wrapper — prefer BuildingPageClient on the building detail route. */
export function UnlockPanel({
  buildingId,
  units,
}: {
  buildingId: string;
  units: UnitLike[];
}) {
  const unlocks = useBuildingUnlocks(buildingId, units);

  if (unlocks.loading) {
    return (
      <section className="mt-8">
        <LoadingState label="Loading unlock status" compact />
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-6">
      {unlocks.activeUnlocks.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Your exclusive access</h2>
            <p className="mt-1 text-sm text-muted">
              Contact, map, and directions for units you unlocked.
            </p>
          </div>
          {unlocks.activeUnlocks.map((unlock) => (
            <UnlockedAccessCard
              key={unlock.unlockId}
              unlock={unlock}
              showBuildingLink={false}
            />
          ))}
        </div>
      ) : null}

      {unlocks.showUnlockSection ? (
        <UnlockPurchasePanel
          buildingId={buildingId}
          availableUnits={unlocks.availableUnits}
          error={unlocks.error}
          isAuthenticated={unlocks.isAuthenticated}
          onUnlock={unlocks.handleUnlock}
          unlockingId={unlocks.unlockingId}
          unlockCredits={unlocks.unlockCredits}
          needsUnlockTerms={unlocks.needsUnlockTerms}
          acceptUnlockTerms={unlocks.acceptUnlockTerms}
          onAcceptUnlockTermsChange={unlocks.setAcceptUnlockTerms}
        />
      ) : null}
    </section>
  );
}
