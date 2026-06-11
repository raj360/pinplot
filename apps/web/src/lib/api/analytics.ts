import { apiFetch } from "./client";

export type BuildingMetrics = {
  days: number;
  impressions: number;
  detailViews: number;
  unlockClicks: number;
  unlocks: number;
  detailViewRate: number;
  unlockClickRate: number;
  unlockConversionRate: number;
};

export type AdminAnalyticsOverview = {
  days: number;
  topBuildings: Array<{
    buildingId: string;
    buildingName: string;
    isFeatured: boolean;
    impressions: number;
    detailViews: number;
    unlockClicks: number;
    detailViewRate: number;
  }>;
  featuredComparison: Array<{
    isFeatured: boolean;
    impressions: number;
    detailViews: number;
    detailViewRate: number;
  }>;
};

export async function fetchAdminAnalyticsOverview(days = 30) {
  return apiFetch<AdminAnalyticsOverview>(
    `/admin/analytics/overview?days=${days}`,
  );
}
