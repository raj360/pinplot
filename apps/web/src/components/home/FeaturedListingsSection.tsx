"use client";

import Link from "next/link";
import type { BuildingSummary } from "@plotpin/shared-types";
import { FeaturedListingCard } from "@/components/home/FeaturedListingCard";

type FeaturedListingsSectionProps = {
  buildings: BuildingSummary[];
};

export function FeaturedListingsSection({
  buildings,
}: FeaturedListingsSectionProps) {
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => (
            <li key={building.id}>
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
