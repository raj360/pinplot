"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BuildingSummary } from "@plotpin/shared-types";
import { FeaturedListingCard } from "@/components/home/FeaturedListingCard";

type FeaturedListingsCarouselProps = {
  buildings: BuildingSummary[];
  ariaLabel: string;
};

export function FeaturedListingsCarousel({
  buildings,
  ariaLabel,
}: FeaturedListingsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(buildings.length > 1);

  const syncScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanScrollPrev(scrollLeft > 4);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = 16;
    const step = (card?.offsetWidth ?? track.clientWidth * 0.85) + gap;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    syncScrollState();
  }, [buildings, syncScrollState]);

  if (buildings.length === 0) return null;

  return (
    <div className="relative">
      {buildings.length > 1 ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-linear-to-l from-background to-transparent sm:block" />
      ) : null}

      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        aria-label={ariaLabel}
        onScroll={syncScrollState}
      >
        {buildings.map((building) => (
          <div
            key={building.id}
            data-carousel-card
            className="w-[min(85vw,320px)] shrink-0 snap-start sm:w-[300px]"
          >
            <FeaturedListingCard building={building} showCountry />
          </div>
        ))}
      </div>

      {buildings.length > 1 ? (
        <div className="mt-3 hidden justify-end gap-2 sm:flex">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-sm border border-border bg-surface text-foreground transition-colors hover:bg-panel disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous featured listings"
            disabled={!canScrollPrev}
            onClick={() => scrollByPage(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-sm border border-border bg-surface text-foreground transition-colors hover:bg-panel disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next featured listings"
            disabled={!canScrollNext}
            onClick={() => scrollByPage(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
