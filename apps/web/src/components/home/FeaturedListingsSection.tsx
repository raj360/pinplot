"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BuildingSummary } from "@plotpin/shared-types";
import { FeaturedListingCard } from "@/components/home/FeaturedListingCard";
import { FeaturedListingsCarousel } from "@/components/home/FeaturedListingsCarousel";
import { HomeFeaturedSkeleton } from "@/components/home/HomePageSkeletons";
import { fetchFeaturedBuildings } from "@/lib/api/buildings";
import {
  featuredListingsGlobalHeading,
  featuredListingsGlobalHint,
  featuredListingsHeadline,
  featuredListingsIntro,
  featuredListingsLocalHeading,
} from "@/lib/copy/supply-discovery";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

type FeaturedFeed = {
  local: BuildingSummary[];
  global: BuildingSummary[];
};

type FeaturedListingsSectionProps = {
  /** SSR feed for the edge-detected region — shown once viewer context matches. */
  initialFeed: FeaturedFeed;
  serverCountryCode: string;
};

async function loadFeaturedFeed(countryCode: string): Promise<FeaturedFeed> {
  const [local, global] = await Promise.all([
    fetchFeaturedBuildings({
      limit: 6,
      countryCode,
      localOnly: true,
    }),
    fetchFeaturedBuildings({
      limit: 12,
      excludeCountryCode: countryCode,
    }),
  ]);
  return { local, global };
}

export function FeaturedListingsSection({
  initialFeed,
  serverCountryCode,
}: FeaturedListingsSectionProps) {
  const { ready, viewer, countriesByCode } = useViewerContext();
  const needsAltFeed = ready && viewer.countryCode !== serverCountryCode;
  const [altFeed, setAltFeed] = useState<FeaturedFeed | null>(null);
  const [altFeedRegion, setAltFeedRegion] = useState<string | null>(null);

  const altFeedCurrent =
    altFeedRegion === viewer.countryCode ? altFeed : null;

  useEffect(() => {
    if (!ready || viewer.countryCode === serverCountryCode) return;

    const region = viewer.countryCode;
    let cancelled = false;

    void loadFeaturedFeed(region)
      .then((next) => {
        if (!cancelled) {
          setAltFeed(next);
          setAltFeedRegion(region);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAltFeed(initialFeed);
          setAltFeedRegion(region);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ready, viewer.countryCode, serverCountryCode, initialFeed]);

  const showSkeleton = !ready || (needsAltFeed && altFeedCurrent === null);
  const feed = needsAltFeed && altFeedCurrent ? altFeedCurrent : initialFeed;
  const viewerCountryName =
    countriesByCode.get(viewer.countryCode)?.name ?? viewer.countryCode;
  const hasLocal = feed.local.length > 0;
  const hasGlobal = feed.global.length > 0;

  if (showSkeleton) {
    return <HomeFeaturedSkeleton />;
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            {featuredListingsHeadline()}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {ready
              ? featuredListingsIntro(viewerCountryName, hasLocal, hasGlobal)
              : "Verified properties promoted on PlotPin — browse free, unlock when you are ready."}
          </p>
        </div>
        <Link
          href="/explore"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          View all on map
        </Link>
      </div>

      {hasLocal ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {featuredListingsLocalHeading(viewerCountryName)}
          </h3>
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {feed.local.map((building) => (
              <li key={building.id} className="min-w-0">
                <FeaturedListingCard building={building} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasGlobal ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {featuredListingsGlobalHeading()}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {featuredListingsGlobalHint(viewerCountryName)}
            </p>
          </div>
          <FeaturedListingsCarousel
            buildings={feed.global}
            ariaLabel="Featured rentals around the world"
          />
        </div>
      ) : null}

      {!hasLocal && !hasGlobal ? (
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
      ) : null}
    </section>
  );
}
