import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import { rentRangeShortLabel } from "@/lib/filters/rent-ranges";
import { searchAreaLabel } from "@/lib/filters/search-areas";

export type ExploreFilterChipKey = keyof ExploreSearchFilters;

export type ExploreFilterChip = {
  key: ExploreFilterChipKey;
  label: string;
};

export function buildExploreFilterChips(
  filters: ExploreSearchFilters,
): ExploreFilterChip[] {
  const chips: ExploreFilterChip[] = [];

  const area = searchAreaLabel(filters.city) ?? filters.city.trim();
  if (area) {
    chips.push({ key: "city", label: area });
  }

  const price = rentRangeShortLabel(filters.priceRange);
  if (price) {
    chips.push({ key: "priceRange", label: price });
  }

  if (filters.bedrooms) {
    chips.push({
      key: "bedrooms",
      label: `${filters.bedrooms}+ bedroom${filters.bedrooms === "1" ? "" : "s"}`,
    });
  }

  if (filters.bathrooms) {
    chips.push({
      key: "bathrooms",
      label: `${filters.bathrooms}+ bathroom${filters.bathrooms === "1" ? "" : "s"}`,
    });
  }

  const typeLabel = buildingTypeLabel(filters.buildingType);
  if (typeLabel) {
    chips.push({ key: "buildingType", label: typeLabel });
  }

  return chips;
}
