"use client";

import Link from "next/link";
import { PRICING } from "@plotpin/shared-types";
import { PlotPinMapHero } from "@/components/home/PlotPinMapHero";
import { HomeHeroSkeleton } from "@/components/home/HomePageSkeletons";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

export function HeroSection() {
  const { ready, viewer, countriesByCode, formatUnlockFeeLabel } =
    useViewerContext();

  if (!ready) {
    return <HomeHeroSkeleton />;
  }

  const country = countriesByCode.get(viewer.countryCode);
  const countryName = country?.name ?? "your area";
  const isUganda = viewer.countryCode === "UG";

  const unlockFee = formatUnlockFeeLabel(PRICING.tenantUnlockFeeUgx);
  const unlockCopy =
    isUganda && unlockFee.footnote
      ? `${unlockFee.primary} (${unlockFee.footnote})`
      : unlockFee.primary;

  return (
    <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:gap-10">
      <div className="max-w-xl">
        <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {`Rentals · ${countryName}`}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Find verified rentals on the map. Pay once to unlock the landlord.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Browse approximate pins for free — the map opens where you are
          {!isUganda ? `, ${countryName}` : ""}. Unlock the exact location and
          landlord contact for{" "}
          <span className="font-medium text-foreground">{unlockCopy}</span>.
          {!isUganda
            ? " Rent is shown in local currency with a familiar hint for you."
            : ""}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-card hover:bg-primary/95"
          >
            Open map
          </Link>
          <Link
            href="/landlord"
            className="border border-border bg-surface px-4 py-2.5 text-sm font-medium shadow-xs hover:bg-neutral-25"
          >
            List a property
          </Link>
        </div>
      </div>

      <div className="relative aspect-4/3 w-full overflow-hidden border border-border bg-surface shadow-card sm:aspect-16/10 lg:aspect-auto lg:h-[340px]">
        <PlotPinMapHero className="absolute inset-0" />
      </div>
    </section>
  );
}
