"use client";

import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { UnlockedAccessCompact } from "@/components/buildings/UnlockedAccessCompact";
import type { BuildingDetail } from "@/lib/api/buildings";
import type { TenantUnlock } from "@/lib/api/unlocks";

export function BuildingExplorePanel({
  building,
  activeUnlocks,
}: {
  building: BuildingDetail;
  activeUnlocks: TenantUnlock[];
}) {
  const hasAccess = activeUnlocks.length > 0;
  const hasAvailable = building.availableUnitCount > 0;

  if (hasAccess && !hasAvailable) {
    return (
      <div className="space-y-3">
        {activeUnlocks.map((unlock) => (
          <UnlockedAccessCompact key={unlock.unlockId} unlock={unlock} />
        ))}
      </div>
    );
  }

  if (hasAccess && hasAvailable) {
    return (
      <div className="space-y-4">
        {activeUnlocks.map((unlock) => (
          <UnlockedAccessCompact
            key={unlock.unlockId}
            unlock={unlock}
            showFullLink={false}
          />
        ))}
        <div className="border-t border-border pt-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            More units to unlock
          </p>
          <BuildingDetailPanel building={building} compact showUnlockLink />
        </div>
      </div>
    );
  }

  return <BuildingDetailPanel building={building} compact showUnlockLink />;
}
