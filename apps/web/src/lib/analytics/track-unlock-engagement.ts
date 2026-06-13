import type { TenantUnlock } from "@/lib/api/unlocks";
import {
  trackListingEvent,
  type ListingAnalyticsEventType,
} from "@/lib/analytics/track-listing-events";

export type UnlockEngagementEventType = Extract<
  ListingAnalyticsEventType,
  "CONTACT_CALL" | "CONTACT_WHATSAPP" | "CONTACT_COPY" | "DIRECTIONS"
>;

export function trackUnlockEngagement(
  eventType: UnlockEngagementEventType,
  unlock: Pick<TenantUnlock, "unlockId" | "buildingId" | "unitId">,
) {
  trackListingEvent({
    eventType,
    buildingId: unlock.buildingId,
    unitId: unlock.unitId,
    unlockId: unlock.unlockId,
    source: "unlocks",
  });
}
