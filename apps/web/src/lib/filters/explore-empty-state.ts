import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import { rentRangeShortLabel } from "@/lib/filters/rent-ranges";
import { searchAreaLabel } from "@/lib/filters/search-areas";

export type EmptyResultSuggestion = {
  label: string;
  key: keyof ExploreSearchFilters | "reset";
};

export function buildExploreEmptySuggestions(
  filters: ExploreSearchFilters,
): EmptyResultSuggestion[] {
  const suggestions: EmptyResultSuggestion[] = [];

  if (filters.priceRange) {
    const price = rentRangeShortLabel(filters.priceRange);
    suggestions.push({
      key: "priceRange",
      label: price ? `Clear rent (${price})` : "Clear rent filter",
    });
  }

  if (filters.bedrooms) {
    suggestions.push({
      key: "bedrooms",
      label: `Relax to any bedrooms (now ${filters.bedrooms}+)`,
    });
  }

  if (filters.bathrooms) {
    suggestions.push({
      key: "bathrooms",
      label: `Relax to any bathrooms (now ${filters.bathrooms}+)`,
    });
  }

  if (filters.buildingType) {
    const type = buildingTypeLabel(filters.buildingType);
    if (type) {
      suggestions.push({
        key: "buildingType",
        label: `Include all property types (not just ${type})`,
      });
    }
  }

  if (filters.city) {
    const area = searchAreaLabel(filters.city) ?? filters.city.trim();
    suggestions.push({
      key: "city",
      label: area ? `Try all Kampala instead of ${area}` : "Try all Kampala",
    });
  }

  if (suggestions.length >= 2) {
    suggestions.push({ key: "reset", label: "Reset all filters" });
  }

  return suggestions.slice(0, 4);
}
