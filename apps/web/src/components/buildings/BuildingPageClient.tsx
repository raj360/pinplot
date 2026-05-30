"use client";

import type { BuildingDetail } from "@/lib/api/buildings";
import { BuildingDetailExperience } from "@/components/buildings/BuildingDetailExperience";

export function BuildingPageClient({ building }: { building: BuildingDetail }) {
  return (
    <BuildingDetailExperience
      building={building}
      variant="full"
      layout="sidebar"
    />
  );
}
