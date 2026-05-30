import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import type { Bounds } from "@/lib/api/buildings";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import { rentRangeShortLabel } from "@/lib/filters/rent-ranges";
import { searchAreaLabel } from "@/lib/filters/search-areas";
import { mapAreaChipLabel } from "@/lib/explore/map-bounds";

export type EmptyResultSuggestion = {
  label: string;
  key: keyof ExploreSearchFilters | "reset" | "mapArea";
};

export function buildExploreEmptySuggestions(
  filters: ExploreSearchFilters,
  mapBounds?: Bounds | null,
): EmptyResultSuggestion[] {
  const suggestions: EmptyResultSuggestion[] = [];

  if (mapBounds) {
    suggestions.push({
      key: "mapArea",
      label: `Clear ${mapAreaChipLabel().toLowerCase()} filter`,
    });
  }

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
