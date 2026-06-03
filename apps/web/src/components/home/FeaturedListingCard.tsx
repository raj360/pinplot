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
      className="group flex flex-col overflow-hidden border border-border bg-surface shadow-card transition-shadow hover:shadow-card-md"
    >
      <div className="relative aspect-[4/3] bg-panel">
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
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-primary group-hover:underline">
          {building.name}
        </h3>
        {location ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-1">{location}</span>
          </p>
        ) : null}
        <p className="mt-auto pt-3 text-sm text-muted">
          {building.availableUnitCount > 0 ? (
            <>
              {building.availableUnitCount} available · from{" "}
              <span className="font-medium text-foreground">
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
