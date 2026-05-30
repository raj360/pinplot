"use client";

import { useMemo, type FormEvent } from "react";
import { ExploreActiveFilterChips } from "@/components/explore/ExploreActiveFilterChips";
import { AreaSearchCombobox } from "@/components/explore/AreaSearchCombobox";
import { ComboSelect } from "@/components/ui/combo-select";
import { Spinner } from "@/components/ui/spinner";
import { BUILDING_TYPE_FILTER_ENABLED, BUILDING_TYPE_OPTIONS } from "@/lib/filters/building-types";
import { buildExploreFilterChips } from "@/lib/filters/explore-filter-chips";
import { RENT_RANGE_OPTIONS } from "@/lib/filters/rent-ranges";
import type { GeoPoint } from "@/lib/geo/uganda";
import { cn } from "@/lib/utils/cn";

export type ExploreSearchFilters = {
  city: string;
  bedrooms: string;
  bathrooms: string;
  priceRange: string;
  /** Reserved for future API filter — stored in UI only for now. */
  buildingType: string;
};

export const EMPTY_EXPLORE_FILTERS: ExploreSearchFilters = {
  city: "",
  bedrooms: "",
  bathrooms: "",
  priceRange: "",
  buildingType: "",
};

const BEDROOM_OPTIONS = [
  { value: "", label: "Any bedrooms" },
  { value: "1", label: "1+ bedroom" },
  { value: "2", label: "2+ bedrooms" },
  { value: "3", label: "3+ bedrooms" },
  { value: "4", label: "4+ bedrooms" },
];

const BATHROOM_OPTIONS = [
  { value: "", label: "Any bathrooms" },
  { value: "1", label: "1+ bathroom" },
  { value: "2", label: "2+ bathrooms" },
  { value: "3", label: "3+ bathrooms" },
];

type ExploreFiltersProps = {
  filters: ExploreSearchFilters;
  appliedFilters: ExploreSearchFilters;
  onChange: (filters: ExploreSearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  onRemoveAppliedFilter: (key: keyof ExploreSearchFilters) => void;
  searching: boolean;
  /** True while refetching results — dims filter controls without full-page overlay. */
  filterLoading?: boolean;
  liveSearch?: boolean;
  onLiveSearchChange?: (enabled: boolean) => void;
  mapVisible: boolean;
  onToggleMap: () => void;
  resultCount?: number;
  userLocation?: GeoPoint | null;
  inUganda?: boolean;
  onRequestLocation?: () => void;
  onClearLocation?: () => void;
  locationLoading?: boolean;
};

export function ExploreFilters({
  filters,
  appliedFilters,
  onChange,
  onSearch,
  onReset,
  onRemoveAppliedFilter,
  searching,
  filterLoading = false,
  liveSearch = false,
  onLiveSearchChange,
  mapVisible,
  onToggleMap,
  resultCount,
  userLocation = null,
  inUganda = false,
  onRequestLocation,
  onClearLocation,
  locationLoading = false,
}: ExploreFiltersProps) {
  function patch(partial: Partial<ExploreSearchFilters>) {
    onChange({ ...filters, ...partial });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!searching) onSearch();
  }

  const activeCount = [
    appliedFilters.city,
    appliedFilters.priceRange,
    appliedFilters.bedrooms,
    appliedFilters.bathrooms,
    BUILDING_TYPE_FILTER_ENABLED ? appliedFilters.buildingType : "",
  ].filter(Boolean).length;

  const appliedChips = useMemo(
    () => buildExploreFilterChips(appliedFilters),
    [appliedFilters],
  );

  const rentOptions = useMemo(
    () =>
      RENT_RANGE_OPTIONS.map(({ value, label, shortLabel }) => ({
        value,
        label,
        shortLabel,
      })),
    [],
  );

  return (
    <form onSubmit={handleSubmit} className="relative px-3 py-2.5 sm:px-4 sm:py-3">
      {filterLoading ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-[#eef2f6]/55"
          aria-hidden
        />
      ) : null}
      {/*
        Breakpoints:
        - default/sm: 2 cols — area + rent full width each on small phones
        - md–lg (768–1279): 4 cols, 2 rows — area full width; filters on one row (iPad, Nest Hub)
        - xl (1280+): 6 cols, 1 row — full desktop strip
      */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-4 md:grid-cols-4 xl:grid-cols-6">
        <AreaSearchCombobox
          compact
          value={filters.city}
          onChange={(city) => patch({ city })}
          userLocation={userLocation}
          inUganda={inUganda}
          onRequestLocation={onRequestLocation}
          onClearLocation={onClearLocation}
          locationLoading={locationLoading}
          active={Boolean(filters.city)}
          loading={filterLoading}
          className="col-span-2 min-w-0 md:col-span-4 xl:col-span-2"
        />
        <ComboSelect
          label="Monthly rent"
          compact
          value={filters.priceRange}
          onChange={(priceRange) => patch({ priceRange })}
          options={rentOptions}
          active={Boolean(filters.priceRange)}
          className={cn(
            "col-span-2 min-w-0 self-start md:col-span-1 xl:col-span-1 [&_button]:bg-surface",
            filterLoading && "[&_button]:pointer-events-none [&_button]:opacity-60",
          )}
        />
        <ComboSelect
          label="Bedrooms"
          compact
          value={filters.bedrooms}
          onChange={(bedrooms) => patch({ bedrooms })}
          options={BEDROOM_OPTIONS}
          active={Boolean(filters.bedrooms)}
          className={cn(
            "min-w-0 self-start md:col-span-1 [&_button]:bg-surface",
            filterLoading && "[&_button]:pointer-events-none [&_button]:opacity-60",
          )}
        />
        <ComboSelect
          label="Bathrooms"
          compact
          value={filters.bathrooms}
          onChange={(bathrooms) => patch({ bathrooms })}
          options={BATHROOM_OPTIONS}
          active={Boolean(filters.bathrooms)}
          className={cn(
            "min-w-0 self-start md:col-span-1 [&_button]:bg-surface",
            filterLoading && "[&_button]:pointer-events-none [&_button]:opacity-60",
          )}
        />
        <ComboSelect
          label="Property type"
          compact
          value={filters.buildingType}
          onChange={(buildingType) => patch({ buildingType })}
          options={[...BUILDING_TYPE_OPTIONS]}
          active={Boolean(filters.buildingType)}
          className={cn(
            "col-span-2 min-w-0 self-start md:col-span-1 xl:col-span-1 [&_button]:bg-surface",
            filterLoading && "[&_button]:pointer-events-none [&_button]:opacity-60",
          )}
          placeholder="Any type"
        />
      </div>

      <ExploreActiveFilterChips
        chips={appliedChips}
        onRemove={onRemoveAppliedFilter}
        disabled={searching}
        className="mt-2.5"
      />

      {!BUILDING_TYPE_FILTER_ENABLED && filters.buildingType ? (
        <p className="mt-1.5 text-[11px] text-muted">
          Property type filter is preview-only — coming soon.
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border/70 pt-2.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {!liveSearch ? (
            <button
              type="submit"
              disabled={searching}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {searching ? (
                <>
                  <Spinner className="size-3.5" label="Searching buildings" />
                  Searching…
                </>
              ) : (
                "Search"
              )}
            </button>
          ) : searching ? (
            <span className="inline-flex min-h-9 items-center gap-1.5 text-sm text-muted">
              <Spinner className="size-3.5" label="Searching buildings" />
              Updating…
            </span>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            disabled={searching}
            className="min-h-9 px-1 font-medium text-primary hover:underline disabled:opacity-60"
          >
            Reset
          </button>
          {onLiveSearchChange ? (
            <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={liveSearch}
                onChange={(event) => onLiveSearchChange(event.target.checked)}
                disabled={searching}
                className="size-3.5 rounded border-border text-primary focus:ring-primary/30"
              />
              Update as you filter
            </label>
          ) : null}
          {activeCount > 0 ? (
            <span className="text-xs text-muted">
              {activeCount} filter{activeCount === 1 ? "" : "s"} active
              {resultCount != null ? ` · ${resultCount} result${resultCount === 1 ? "" : "s"}` : ""}
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
