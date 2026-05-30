"use client";

import type { FormEvent } from "react";
import { AreaSearchCombobox } from "@/components/explore/AreaSearchCombobox";
import { ComboSelect } from "@/components/ui/combo-select";
import { Spinner } from "@/components/ui/spinner";
import { BUILDING_TYPE_FILTER_ENABLED, BUILDING_TYPE_OPTIONS } from "@/lib/filters/building-types";
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
  onChange: (filters: ExploreSearchFilters) => void;
  onSearch: () => void;
  onReset: () => void;
  searching: boolean;
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
  onChange,
  onSearch,
  onReset,
  searching,
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
    filters.city,
    filters.priceRange,
    filters.bedrooms,
    filters.bathrooms,
    BUILDING_TYPE_FILTER_ENABLED ? filters.buildingType : "",
  ].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 sm:grid-cols-3 sm:gap-x-3 lg:grid-cols-6">
        <AreaSearchCombobox
          compact
          value={filters.city}
          onChange={(city) => patch({ city })}
          userLocation={userLocation}
          inUganda={inUganda}
          onRequestLocation={onRequestLocation}
          onClearLocation={onClearLocation}
          locationLoading={locationLoading}
          className="col-span-2 sm:col-span-2 lg:col-span-2"
        />
        <ComboSelect
          label="Monthly rent"
          compact
          value={filters.priceRange}
          onChange={(priceRange) => patch({ priceRange })}
          options={RENT_RANGE_OPTIONS}
          className="col-span-2 sm:col-span-1 [&_button]:bg-surface"
        />
        <ComboSelect
          label="Bedrooms"
          compact
          value={filters.bedrooms}
          onChange={(bedrooms) => patch({ bedrooms })}
          options={BEDROOM_OPTIONS}
          className="[&_button]:bg-surface"
        />
        <ComboSelect
          label="Bathrooms"
          compact
          value={filters.bathrooms}
          onChange={(bathrooms) => patch({ bathrooms })}
          options={BATHROOM_OPTIONS}
          className="[&_button]:bg-surface"
        />
        <ComboSelect
          label="Property type"
          compact
          value={filters.buildingType}
          onChange={(buildingType) => patch({ buildingType })}
          options={[...BUILDING_TYPE_OPTIONS]}
          className="col-span-2 sm:col-span-1 lg:col-span-1 [&_button]:bg-surface"
          placeholder="Any type"
        />
      </div>

      {!BUILDING_TYPE_FILTER_ENABLED && filters.buildingType ? (
        <p className="mt-1.5 text-[11px] text-muted">
          Property type filter is preview-only — coming soon.
        </p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border/70 pt-2.5 text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
          <button
            type="button"
            onClick={onReset}
            disabled={searching}
            className="min-h-9 px-1 font-medium text-primary hover:underline disabled:opacity-60"
          >
            Reset
          </button>
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
