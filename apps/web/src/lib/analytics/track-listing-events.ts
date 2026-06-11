import { getAccessToken } from "@/lib/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SESSION_KEY = "plotpin_analytics_session";

export type ListingAnalyticsEventType =
  | "IMPRESSION"
  | "DETAIL_VIEW"
  | "UNLOCK_CLICK";

export type ListingAnalyticsEvent = {
  eventType: ListingAnalyticsEventType;
  buildingId: string;
  unitId?: string;
  source?: "explore" | "featured" | "direct";
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const pending: ListingAnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const seenImpressions = new Set<string>();

export function trackListingEvent(event: ListingAnalyticsEvent) {
  if (typeof window === "undefined") return;
  if (event.eventType === "IMPRESSION") {
    const key = `${event.buildingId}:${event.source ?? "explore"}`;
    if (seenImpressions.has(key)) return;
    seenImpressions.add(key);
  }

  pending.push(event);
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushListingEvents();
  }, 1200);
}

export async function flushListingEvents(countryCode?: string) {
  if (pending.length === 0) return;
  const batch = pending.splice(0, 20);
  const token = await getAccessToken().catch(() => null);
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    await fetch(`${API_URL}/api/v1/analytics/events`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        events: batch.map((event) => ({
          eventType: event.eventType,
          buildingId: event.buildingId,
          unitId: event.unitId,
          source: event.source,
        })),
        sessionId: getSessionId(),
        countryCode,
      }),
      keepalive: true,
    });
  } catch {
    pending.unshift(...batch);
  }
}

export function trackListingImpression(
  buildingId: string,
  source: ListingAnalyticsEvent["source"] = "explore",
) {
  trackListingEvent({ eventType: "IMPRESSION", buildingId, source });
}

export function trackListingDetailView(
  buildingId: string,
  source: ListingAnalyticsEvent["source"] = "explore",
) {
  trackListingEvent({ eventType: "DETAIL_VIEW", buildingId, source });
}

export function trackUnlockClick(buildingId: string, unitId: string) {
  trackListingEvent({
    eventType: "UNLOCK_CLICK",
    buildingId,
    unitId,
    source: "explore",
  });
}
