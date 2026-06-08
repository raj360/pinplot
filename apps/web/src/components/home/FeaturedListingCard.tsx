"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { FeaturedListingBadge } from "@/components/explore/FeaturedListingBadge";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import type { BuildingSummary } from "@plotpin/shared-types";

type FeaturedListingCardProps = {
  building: BuildingSummary;
};

export function FeaturedListingCard({ building }: FeaturedListingCardProps) {
  const { formatListingRentPerMonth } = useViewerContext();
  const location = [building.district, building.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/explore?building=${building.id}`}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-sm border border-border bg-surface shadow-card transition-shadow hover:shadow-card-md"
    >
      <div className="relative aspect-4/3 shrink-0 bg-panel">
        {building.coverThumbUrl ? (
          <>
            <FeaturedListingBadge variant="overlay" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={building.coverThumbUrl}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <FeaturedListingBadge variant="inline" />
            <span className="text-sm font-medium text-muted">Photo coming soon</span>
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-primary group-hover:underline sm:text-base">
          {building.name}
        </h3>
        {location ? (
          <p className="mt-1 flex min-w-0 items-start gap-1.5 text-xs text-muted sm:mt-1.5 sm:text-sm">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-2 min-w-0 break-words">{location}</span>
          </p>
        ) : null}
        <p className="mt-auto space-y-0.5 pt-2 text-xs leading-snug text-muted sm:pt-3 sm:text-sm">
          {building.availableUnitCount > 0 ? (
            <>
              <span className="block">
                {building.availableUnitCount} available
              </span>
              <span className="block font-medium text-foreground">
                from{" "}
                {formatListingRentPerMonth(
                  building.rentFrom,
                  building.currency,
                  building.countryCode,
                )}
              </span>
            </>
          ) : (
            "View on map"
          )}
        </p>
      </div>
    </Link>
  );
}
