"use client";

import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import type { Bounds } from "@/lib/api/buildings";
import {
  buildExploreEmptySuggestions,
  type EmptyResultSuggestion,
} from "@/lib/filters/explore-empty-state";

type ExploreEmptyResultsProps = {
  appliedFilters: ExploreSearchFilters;
  appliedMapBounds?: Bounds | null;
  onRemoveFilter: (key: keyof ExploreSearchFilters) => void;
  onRemoveMapBounds?: () => void;
  onReset: () => void;
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
}: ExploreEmptyResultsProps) {
  const suggestions = buildExploreEmptySuggestions(
    appliedFilters,
    appliedMapBounds,
  );
  const hasActiveFilters = suggestions.length > 0;

  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">
        No available units match your search
      </p>
      <p className="mt-1.5 text-sm text-muted">
        {hasActiveFilters
          ? "Try adjusting one of your filters:"
          : "Listings change often — check back soon or browse all Kampala."}
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
    </div>
  );
}
