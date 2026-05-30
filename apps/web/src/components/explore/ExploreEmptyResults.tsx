"use client";

import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import {
  buildExploreEmptySuggestions,
  type EmptyResultSuggestion,
} from "@/lib/filters/explore-empty-state";

type ExploreEmptyResultsProps = {
  appliedFilters: ExploreSearchFilters;
  onRemoveFilter: (key: keyof ExploreSearchFilters) => void;
  onReset: () => void;
};

function handleSuggestion(
  suggestion: EmptyResultSuggestion,
  onRemoveFilter: (key: keyof ExploreSearchFilters) => void,
  onReset: () => void,
) {
  if (suggestion.key === "reset") {
    onReset();
    return;
  }
  onRemoveFilter(suggestion.key);
}

export function ExploreEmptyResults({
  appliedFilters,
  onRemoveFilter,
  onReset,
}: ExploreEmptyResultsProps) {
  const suggestions = buildExploreEmptySuggestions(appliedFilters);
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
                  handleSuggestion(suggestion, onRemoveFilter, onReset)
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
