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
import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import type { Bounds } from "@/lib/api/buildings";
import type { ExploreFilterChipKey } from "@/lib/filters/explore-filter-chips";
import type { GeoPoint } from "@/lib/geo/uganda";
import type { RecentArea } from "@/lib/filters/recent-areas";
import type { SearchAreaPreset } from "@/lib/filters/search-areas";
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
  mapToggleBusy?: boolean;
  onToggleMap: () => void;
  resultCount?: number;
  /** For sorting areas inside the Where dropdown only. */
  userLocation?: GeoPoint | null;
  inUganda?: boolean;
  locationLoading?: boolean;
  /** Recently searched areas (localStorage) for the Where dropdown. */
  recentAreas?: RecentArea[];
  /** Seeded geo catalog for the viewer's country. */
  geoPresets?: SearchAreaPreset[];
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
  mapToggleBusy = false,
  onToggleMap,
  resultCount,
  userLocation = null,
  inUganda = false,
  locationLoading = false,
  recentAreas,
  geoPresets,
}: ExploreFiltersProps) {
  const { viewer, countriesByCode } = useViewerContext();
  const viewerCountryName = countriesByCode.get(viewer.countryCode)?.name;

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
    () =>
      buildExploreFilterChips(appliedFilters, appliedMapBounds, {
        currency: viewer.displayCurrency,
        locale: viewer.displayLocale,
      }),
    [appliedFilters, appliedMapBounds, viewer.displayCurrency, viewer.displayLocale],
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
      className="relative isolate z-20 px-3 py-1 sm:px-4 sm:py-1.5"
    >
      {filterLoading ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-lg bg-panel/50"
          aria-hidden
        />
      ) : null}

      <div className="card-elevated overflow-visible rounded-lg">
        <div className="flex flex-col overflow-visible sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 flex-row items-stretch divide-x divide-border overflow-visible">
            <AreaSearchCombobox
              variant="segment"
              value={filters.city}
              displayOverride={whereDisplayOverride}
              onChange={(place) => void onPlaceJump(place)}
              userLocation={userLocation}
              inUganda={inUganda}
              viewerCountryCode={viewer.countryCode}
              viewerCountryName={viewerCountryName}
              recentAreas={recentAreas}
              seededPresets={geoPresets}
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

          <div className="flex shrink-0 flex-col justify-center border-t border-border p-1.5 sm:border-l sm:border-t-0 sm:px-2.5 sm:py-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={locationLoading}
              loadingLabel="Finding your location"
              onClick={() => void onNearMe()}
              className="min-h-8 w-full sm:w-auto"
              title="Uses your device GPS"
            >
              <MapPin className="size-3.5" aria-hidden />
              Near me
            </Button>
          </div>
        </div>
      </div>

      <ExploreActiveFilterChips
        chips={appliedChips}
        onRemove={handleRemoveChip}
        disabled={searching}
        className="mt-1"
      />

      <div className="mt-1 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {searching ? (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <Spinner className="size-3" label="Updating map results" />
              Updating…
            </span>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            disabled={searching}
            className="font-medium text-primary hover:underline disabled:opacity-60"
          >
            Reset all
          </button>
          {activeCount > 0 ? (
            <span className="text-muted">
              {activeCount} active
              {propertyFilterCount > 0 && appliedMapBounds
                ? ` (${propertyFilterCount} property)`
                : ""}
              {resultCount != null
                ? ` · ${resultCount} result${resultCount === 1 ? "" : "s"}`
                : ""}
            </span>
          ) : resultCount != null ? (
            <span className="text-muted">
              {resultCount} result{resultCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleMap}
          disabled={mapToggleBusy}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-60",
          )}
        >
          {mapToggleBusy ? (
            <>
              <Spinner className="size-3" label="Loading listing" />
              Opening…
            </>
          ) : mapVisible ? (
            "Hide map"
          ) : (
            "Show map"
          )}
        </button>
      </div>
    </form>
  );
}
