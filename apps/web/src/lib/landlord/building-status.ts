import type { LandlordBuilding } from "@/lib/api/buildings";

/** Building approved by admin but no units marked AVAILABLE yet. */
export function buildingNeedsUnitSetup(building: {
  isVerified: boolean;
  availableUnitCount: number;
}): boolean {
  return building.isVerified && building.availableUnitCount === 0;
}

/** At least one unit is visible to tenants on explore. */
export function buildingVisibleOnExplore(building: {
  isVerified: boolean;
  availableUnitCount: number;
}): boolean {
  return building.isVerified && building.availableUnitCount > 0;
}

export type LandlordBuildingStatus = {
  label: string;
  hint?: string;
  className: string;
  /** Emphasize Manage units / Mark available CTA */
  actionRequired: boolean;
};

export function getLandlordBuildingStatus(building: {
  isVerified: boolean;
  availableUnitCount: number;
  totalUnits: number;
}): LandlordBuildingStatus {
  if (!building.isVerified) {
    return {
      label: "Pending review",
      hint: "Admin is reviewing your listing",
      className: "bg-amber-100 text-amber-900",
      actionRequired: false,
    };
  }

  if (building.availableUnitCount === 0) {
    return {
      label: "Approved — action needed",
      hint: "Mark at least one unit available to appear on the map",
      className: "bg-sky-100 text-sky-900",
      actionRequired: true,
    };
  }

  return {
    label: `${building.availableUnitCount} unit${building.availableUnitCount === 1 ? "" : "s"} on map`,
    hint: "Tenants can discover these units on explore",
    className: "bg-green-100 text-green-800",
    actionRequired: false,
  };
}

export function countBuildingsNeedingSetup(
  buildings: Pick<LandlordBuilding, "isVerified" | "availableUnitCount">[],
): number {
  return buildings.filter(buildingNeedsUnitSetup).length;
}

export function countBuildingsVisibleOnExplore(
  buildings: Pick<LandlordBuilding, "isVerified" | "availableUnitCount">[],
): number {
  return buildings.filter(buildingVisibleOnExplore).length;
}
