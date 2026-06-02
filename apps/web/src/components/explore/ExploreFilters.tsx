"use client";

import { MapPin } from "lucide-react";
import { useMemo, type FormEvent } from "react";
import { ExploreActiveFilterChips } from "@/components/explore/ExploreActiveFilterChips";
import { AreaSearchCombobox } from "@/components/explore/AreaSearchCombobox";
import { ExploreFiltersPopover } from "@/components/explore/ExploreFiltersPopover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { buildExploreFilterChips } from "@/lib/filters/explore-filter-chips";
import { countActivePropertyFilters } from "@/lib/filters/explore-filter-summary";
import type { Bounds } from "@/lib/api/buildings";
import type { ExploreFilterChipKey } from "@/lib/filters/explore-filter-chips";
import type { GeoPoint } from "@/lib/geo/uganda";
import { cn } from "@/lib/utils/cn";

export type ExploreSearchFilters = {
  /** Place jump label — not sent to API when searching by map viewport. */
  city: string;
  bedrooms: string;
  bathrooms: string;
  priceRange: string;
  buildingType: string;
};

export const EMPTY_EXPLORE_FILTERS: ExploreSearchFilters = {
  city: "",
  bedrooms: "",
  bathrooms: "",
  priceRange: "",
  buildingType: "",
};

type ExploreFiltersProps = {
  filters: ExploreSearchFilters;
  appliedFilters: ExploreSearchFilters;
  appliedMapBounds?: Bounds | null;
  whereDisplayOverride?: string;
  onApplyFilters: (filters: ExploreSearchFilters) => void;
  onPlaceJump: (place: string) => void | Promise<void>;
  onNearMe: () => void | Promise<void>;
  onReset: () => void;
  onRemoveAppliedFilter: (key: keyof ExploreSearchFilters) => void;
  onRemoveMapBounds?: () => void;
  searching: boolean;
  filterLoading?: boolean;
  mapVisible: boolean;
  onToggleMap: () => void;
  resultCount?: number;
  /** For sorting areas inside the Where dropdown only. */
  userLocation?: GeoPoint | null;
  inUganda?: boolean;
  locationLoading?: boolean;
};

export function ExploreFilters({
  filters,
  appliedFilters,
  appliedMapBounds = null,
  whereDisplayOverride,
  onApplyFilters,
  onPlaceJump,
  onNearMe,
  onReset,
  onRemoveAppliedFilter,
  onRemoveMapBounds,
  searching,
  filterLoading = false,
  mapVisible,
  onToggleMap,
  resultCount,
  userLocation = null,
  inUganda = false,
  locationLoading = false,
}: ExploreFiltersProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
  }

  const activeCount = [
    appliedMapBounds ? "map" : "",
    appliedFilters.city,
    ...[
      appliedFilters.priceRange,
      appliedFilters.bedrooms,
      appliedFilters.bathrooms,
      appliedFilters.buildingType,
    ].filter(Boolean),
  ].filter(Boolean).length;

  const appliedChips = useMemo(
    () => buildExploreFilterChips(appliedFilters, appliedMapBounds),
    [appliedFilters, appliedMapBounds],
  );

  function handleRemoveChip(key: ExploreFilterChipKey) {
    if (key === "mapArea") {
      onRemoveMapBounds?.();
      return;
    }
    onRemoveAppliedFilter(key);
  }

  const propertyFilterCount = countActivePropertyFilters(appliedFilters);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative isolate z-20 px-3 py-2.5 sm:px-4 sm:py-3"
    >
      {filterLoading ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-lg bg-panel/50"
          aria-hidden
        />
      ) : null}

      <div className="card-elevated overflow-visible rounded-lg">
        <div className="flex flex-col overflow-visible sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 divide-y divide-border overflow-visible sm:divide-x sm:divide-y-0">
            <AreaSearchCombobox
              variant="segment"
              value={filters.city}
              displayOverride={whereDisplayOverride}
              onChange={(place) => void onPlaceJump(place)}
              userLocation={userLocation}
              inUganda={inUganda}
              locationLoading={locationLoading}
              active={Boolean(
                whereDisplayOverride || filters.city || appliedMapBounds,
              )}
              loading={filterLoading}
              placeholder="Browse map area"
              className="min-w-0 flex-[1.15] sm:max-w-[16rem] md:max-w-[18rem]"
            />
            <ExploreFiltersPopover
              filters={appliedFilters}
              onApply={onApplyFilters}
              disabled={filterLoading}
              className="min-w-0 flex-1"
            />
          </div>

          <div className="flex shrink-0 flex-col justify-center gap-1 border-t border-border p-2 sm:border-l sm:border-t-0 sm:px-3 sm:py-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={locationLoading}
              loadingLabel="Finding your location"
              onClick={() => void onNearMe()}
              className="min-h-9 w-full sm:w-auto"
            >
              <MapPin className="size-3.5" aria-hidden />
              Near me
            </Button>
            <p className="hidden text-center text-[10px] text-muted sm:block">
              Uses your device GPS
            </p>
          </div>
        </div>
      </div>

      <ExploreActiveFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        disabled={searching}
        className="mt-2.5"
      />

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border/70 pt-2.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {searching ? (
            <span className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted">
              <Spinner className="size-3.5" label="Updating map results" />
              Updating results…
            </span>
          ) : (
            <span className="text-xs text-muted">
              Pan the map to explore — listings update automatically
            </span>
          )}
          <button
            type="button"
            onClick={onReset}
            disabled={searching}
            className="min-h-9 px-1 font-medium text-primary hover:underline disabled:opacity-60"
          >
            Reset all
          </button>
          {activeCount > 0 ? (
            <span className="text-xs text-muted">
              {activeCount} active
              {propertyFilterCount > 0 && appliedMapBounds
                ? ` (${propertyFilterCount} property)`
                : ""}
              {resultCount != null
                ? ` · ${resultCount} result${resultCount === 1 ? "" : "s"}`
                : ""}
            </span>
          ) : resultCount != null ? (
            <span className="text-xs text-muted">
              {resultCount} result{resultCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleMap}
          className={cn("min-h-9 shrink-0 font-medium text-primary hover:underline")}
        >
          {mapVisible ? "Hide map" : "Show map"}
        </button>
      </div>
    </form>
  );
}
