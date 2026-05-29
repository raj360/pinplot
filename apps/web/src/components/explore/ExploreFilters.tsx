"use client";

import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { ComboSelect } from "@/components/ui/combo-select";
import { Spinner } from "@/components/ui/spinner";
import { RENT_RANGE_OPTIONS } from "@/lib/filters/rent-ranges";
import { cn } from "@/lib/utils/cn";

export type ExploreSearchFilters = {
  city: string;
  bedrooms: string;
  bathrooms: string;
  priceRange: string;
};

export const EMPTY_EXPLORE_FILTERS: ExploreSearchFilters = {
  city: "",
  bedrooms: "",
  bathrooms: "",
  priceRange: "",
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
};

export function ExploreFilters({
  filters,
  onChange,
  onSearch,
  onReset,
  searching,
  mapVisible,
  onToggleMap,
}: ExploreFiltersProps) {
  function patch(partial: Partial<ExploreSearchFilters>) {
    onChange({ ...filters, ...partial });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!searching) onSearch();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-border/80 bg-[#eef2f6] px-3 py-2.5 sm:px-4 sm:py-3"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Input
          label="Search area"
          compact
          type="text"
          value={filters.city}
          onChange={(e) => patch({ city: e.target.value })}
          placeholder="Kampala, Namuwongo…"
          className="col-span-2 sm:col-span-1 lg:col-span-1 [&_input]:bg-surface"
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
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border/60 pt-2 text-sm">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-60"
          >
            {searching ? (
              <>
                <Spinner className="size-3" label="Searching buildings" />
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
            className="font-medium text-primary hover:underline disabled:opacity-60"
          >
            Reset
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleMap}
          className={cn("font-medium text-primary hover:underline")}
        >
          {mapVisible ? "Hide map" : "Show map"}
        </button>
      </div>
    </form>
  );
}
