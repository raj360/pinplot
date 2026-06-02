import { apiFetch } from "./client";

export type LaunchFeaturedStats = {
  maxSlots: number;
  activeLaunchGrants: number;
  remainingSlots: number;
};

export type FeaturedGrantResult = {
  id: string;
  name: string;
  isFeatured: boolean;
  featuredUntil?: string;
  source?: string;
};

export type LaunchFeaturedGrantResponse = LaunchFeaturedStats & {
  granted: FeaturedGrantResult[];
  message?: string;
};

export async function fetchLaunchFeaturedStats() {
  return apiFetch<LaunchFeaturedStats>("/admin/featured/launch-stats");
}

export async function runLaunchFeaturedGrant(options?: {
  limit?: number;
  durationDays?: number;
}) {
  return apiFetch<LaunchFeaturedGrantResponse>("/admin/featured/launch-grant", {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

export async function setBuildingFeatured(
  buildingId: string,
  featured: boolean,
  durationDays?: number,
) {
  return apiFetch<FeaturedGrantResult>(`/admin/buildings/${buildingId}/featured`, {
    method: "PATCH",
    body: JSON.stringify({ featured, durationDays }),
  });
}
