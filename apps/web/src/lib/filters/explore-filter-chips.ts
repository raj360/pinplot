import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import type { Bounds } from "@/lib/api/buildings";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import {
  rentRangeShortLabel,
  type RentRangeMoney,
} from "@/lib/filters/rent-ranges";
import { searchAreaLabel } from "@/lib/filters/search-areas";
import { mapAreaChipLabel } from "@/lib/explore/map-bounds";

export type ExploreFilterChipKey = keyof ExploreSearchFilters | "mapArea";

export type ExploreFilterChip = {
  key: ExploreFilterChipKey;
  label: string;
};

export function buildExploreFilterChips(
  filters: ExploreSearchFilters,
  mapBounds?: Bounds | null,
  money?: RentRangeMoney,
): ExploreFilterChip[] {
  const chips: ExploreFilterChip[] = [];

  if (mapBounds) {
    const place = searchAreaLabel(filters.city) ?? filters.city.trim();
    chips.push({
      key: "mapArea",
      label: place || mapAreaChipLabel(),
    });
  } else {
    const area = searchAreaLabel(filters.city) ?? filters.city.trim();
    if (area) {
      chips.push({ key: "city", label: area });
    }
  }

  const price = rentRangeShortLabel(filters.priceRange, money);
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
