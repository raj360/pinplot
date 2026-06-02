"use client";

import { MapPin } from "lucide-react";
import type { RefObject } from "react";
import { ExploreEmptyResults } from "@/components/explore/ExploreEmptyResults";
import { FeaturedListingBadge } from "@/components/explore/FeaturedListingBadge";
import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { ExploreResultRowSkeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { Bounds } from "@/lib/api/buildings";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import { hasAccessOnly } from "@/lib/unlocks/display";
import { cn } from "@/lib/utils/cn";
import type { BuildingSummary } from "@plotpin/shared-types";

type ExploreResultsListProps = {
  listRef: RefObject<HTMLUListElement | null>;
  loading: boolean;
  listLoading: boolean;
  buildings: BuildingSummary[];
  selectedId: string | null;
  selectedLoading: boolean;
  hoveredId: string | null;
  appliedFilters: ExploreSearchFilters;
  appliedMapBounds: Bounds | null;
  onSelect: (id: string) => void;
  onOpenAccess: (buildingId: string) => void;
  onRemoveFilter: (key: keyof ExploreSearchFilters) => void;
  onRemoveMapBounds: () => void;
  onReset: () => void;
  onBrowseSupply?: () => void;
};

export function ExploreResultsList({
  listRef,
  loading,
  listLoading,
  buildings,
  selectedId,
  selectedLoading,
  hoveredId,
  appliedFilters,
  appliedMapBounds,
  onSelect,
  onOpenAccess,
  onRemoveFilter,
  onRemoveMapBounds,
  onReset,
  onBrowseSupply,
}: ExploreResultsListProps) {
  const { formatListingRentPerMonth } = useViewerContext();

  return (
    <ul
      ref={listRef}
      className={cn(
        "explore-results-list touch-pan-y",
        "md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain",
      )}
    >
      {loading && buildings.length === 0 ? (
        <>
          {Array.from({ length: 6 }).map((_, index) => (
            <ExploreResultRowSkeleton key={index} />
          ))}
        </>
      ) : null}
      {buildings.map((building) => {
        const active = selectedId === building.id;
        const hovered = hoveredId === building.id;
        const unlocked = (building.myUnlockCount ?? 0) > 0;
        const accessOnly = hasAccessOnly(building);

        return (
          <li key={building.id}>
            <div
              data-building-id={building.id}
              className={cn(
                "flex items-stretch border-b border-border transition-colors",
                active &&
                  (unlocked
                    ? "border-l-[3px] border-l-lime-600 bg-lime-50/70"
                    : "border-l-[3px] border-l-primary bg-primary/5"),
                !active &&
                  hovered &&
                  (unlocked
                    ? "border-l-[3px] border-l-lime-600/50 bg-lime-50/40"
                    : "border-l-[3px] border-l-primary/40 bg-primary/5"),
                !active && !hovered && "hover:bg-background/70",
              )}
            >
              {building.coverThumbUrl ? (
                <div className="relative w-16 shrink-0 sm:w-24">
                  {building.isFeatured ? (
                    <FeaturedListingBadge variant="overlay" />
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={building.coverThumbUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onSelect(building.id)}
                className="min-w-0 flex-1 px-3 py-3.5 text-left sm:px-4 sm:py-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <p
                      className={cn(
                        "text-[15px] font-semibold leading-snug sm:text-base",
                        unlocked ? "text-lime-800" : "text-primary",
                      )}
                    >
                      {building.name}
                    </p>
                    {building.isFeatured ? (
                      <FeaturedListingBadge
                        variant="inline"
                        className={building.coverThumbUrl ? "sm:hidden" : undefined}
                      />
                    ) : null}
                  </div>
                  {active && selectedLoading ? (
                    <Spinner
                      className="mt-1 size-3 shrink-0"
                      label="Loading building"
                    />
                  ) : null}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground/80">
                  <MapPin
                    className="size-3.5 shrink-0 text-muted"
                    aria-hidden
                  />
                  <span className="truncate">
                    {[building.district, building.city]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {building.availableUnitCount > 0 ? (
                    <>
                      {building.availableUnitCount} available · from{" "}
                      <span className="font-medium text-foreground/90">
                        {formatListingRentPerMonth(
                          building.rentFrom,
                          building.currency,
                          building.countryCode,
                        )}
                      </span>
                    </>
                  ) : unlocked ? (
                    <span className="font-medium text-lime-700">
                      Your access · tap to open
                    </span>
                  ) : (
                    <>No units available</>
                  )}
                </p>
              </button>
              {unlocked && !accessOnly ? (
                <button
                  type="button"
                  onClick={() => onOpenAccess(building.id)}
                  className="shrink-0 self-center border-l border-border/70 px-3 py-2 text-[11px] font-medium text-lime-700 underline decoration-lime-600/40 underline-offset-2 hover:bg-lime-50/80 hover:text-lime-800"
                >
                  Your access
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
      {!listLoading && buildings.length === 0 ? (
        <li>
          <ExploreEmptyResults
            appliedFilters={appliedFilters}
            appliedMapBounds={appliedMapBounds}
            onRemoveFilter={onRemoveFilter}
            onRemoveMapBounds={onRemoveMapBounds}
            onReset={onReset}
            onBrowseSupply={onBrowseSupply}
          />
        </li>
      ) : null}
    </ul>
  );
}
