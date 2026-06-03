"use client";

import Link from "next/link";
import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import type { Bounds } from "@/lib/api/buildings";
import {
  buildExploreEmptySuggestions,
  type EmptyResultSuggestion,
} from "@/lib/filters/explore-empty-state";
import { boundsOverlapUganda } from "@/lib/geo/uganda";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

type ExploreEmptyResultsProps = {
  appliedFilters: ExploreSearchFilters;
  appliedMapBounds?: Bounds | null;
  onRemoveFilter: (key: keyof ExploreSearchFilters) => void;
  onRemoveMapBounds?: () => void;
  onReset: () => void;
  onBrowseSupply?: () => void;
};

function handleSuggestion(
  suggestion: EmptyResultSuggestion,
  onRemoveFilter: (key: keyof ExploreSearchFilters) => void,
  onRemoveMapBounds: (() => void) | undefined,
  onReset: () => void,
) {
  if (suggestion.key === "reset") {
    onReset();
    return;
  }
  if (suggestion.key === "mapArea") {
    onRemoveMapBounds?.();
    return;
  }
  onRemoveFilter(suggestion.key);
}

export function ExploreEmptyResults({
  appliedFilters,
  appliedMapBounds = null,
  onRemoveFilter,
  onRemoveMapBounds,
  onReset,
  onBrowseSupply,
}: ExploreEmptyResultsProps) {
  const { viewer } = useViewerContext();
  const suggestions = buildExploreEmptySuggestions(
    appliedFilters,
    appliedMapBounds,
  );
  const hasActiveFilters = suggestions.length > 0;
  const outsideSupply =
    appliedMapBounds != null && !boundsOverlapUganda(appliedMapBounds);
  const diasporaViewer = viewer.countryCode !== "UG";

  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">
        {outsideSupply && diasporaViewer
          ? "No listings in this area yet"
          : "No available units match your search"}
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {outsideSupply && diasporaViewer ? (
          <>
            PlotPin supply is in Uganda for now. Browse Kampala to see available
            units, or list your building if you are a landlord.
          </>
        ) : hasActiveFilters ? (
          "Try adjusting one of your filters:"
        ) : (
          "Listings change often — check back soon or browse all Kampala."
        )}
      </p>

      {suggestions.length > 0 ? (
        <ul className="mt-4 flex flex-col items-center gap-2">
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.key}-${suggestion.label}`}>
              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    suggestion,
                    onRemoveFilter,
                    onRemoveMapBounds,
                    onReset,
                  )
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-2">
        {outsideSupply && onBrowseSupply ? (
          <button
            type="button"
            onClick={onBrowseSupply}
            className="text-sm font-medium text-primary hover:underline"
          >
            Browse listings in Uganda
          </button>
        ) : null}
        <Link
          href="/landlord/new"
          className="text-sm font-medium text-primary hover:underline"
        >
          List your building — free to submit
        </Link>
      </div>
    </div>
  );
}
