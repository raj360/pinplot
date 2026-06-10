"use client";

import { useEffect, useRef } from "react";
import { trackListingImpression } from "@/lib/analytics/track-listing-events";

export function ListingImpressionTracker({
  buildingId,
  source = "explore",
}: {
  buildingId: string;
  source?: "explore" | "featured" | "direct";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      trackListingImpression(buildingId, source);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackListingImpression(buildingId, source);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [buildingId, source]);

  return <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden />;
}
