"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BuildingSummary } from "@plotpin/shared-types";
import { FeaturedListingCard } from "@/components/home/FeaturedListingCard";
import { HomeFeaturedSkeleton } from "@/components/home/HomePageSkeletons";
import { fetchFeaturedBuildings } from "@/lib/api/buildings";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

type FeaturedListingsSectionProps = {
  /** SSR list for the edge-detected region — shown once viewer context matches. */
  initialBuildings: BuildingSummary[];
  serverCountryCode: string;
};

export function FeaturedListingsSection({
  initialBuildings,
  serverCountryCode,
}: FeaturedListingsSectionProps) {
  const { ready, viewer } = useViewerContext();
  const needsAltList = ready && viewer.countryCode !== serverCountryCode;
  const [altList, setAltList] = useState<BuildingSummary[] | null>(null);
  const [altListRegion, setAltListRegion] = useState<string | null>(null);

  const altListCurrent =
    altListRegion === viewer.countryCode ? altList : null;

  useEffect(() => {
    if (!ready || viewer.countryCode === serverCountryCode) return;

    const region = viewer.countryCode;
    let cancelled = false;

    void fetchFeaturedBuildings(12, region)
      .then((next) => {
        if (!cancelled) {
          setAltList(next.length > 0 ? next : initialBuildings);
          setAltListRegion(region);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAltList(initialBuildings);
          setAltListRegion(region);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ready, viewer.countryCode, serverCountryCode, initialBuildings]);

  const showSkeleton = !ready || (needsAltList && altListCurrent === null);
  const buildings =
    needsAltList && altListCurrent ? altListCurrent : initialBuildings;

  if (showSkeleton) {
    return <HomeFeaturedSkeleton />;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Featured listings
          </h2>
          <p className="mt-1 text-sm text-muted">
            Verified properties promoted on PlotPin — browse free, unlock when
            you are ready.
          </p>
        </div>
        <Link
          href="/explore"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          View all on map
        </Link>
      </div>

      {buildings.length > 0 ? (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {buildings.map((building) => (
            <li key={building.id} className="min-w-0">
              <FeaturedListingCard building={building} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            Featured listings will appear here as verified supply grows. Explore
            what is available today.
          </p>
          <Link
            href="/explore"
            className="mt-4 inline-block bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Open map explorer
          </Link>
        </div>
      )}
    </section>
  );
}
