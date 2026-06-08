import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import {
  rentRangeShortLabel,
  type RentRangeMoney,
} from "@/lib/filters/rent-ranges";

export function countActivePropertyFilters(filters: ExploreSearchFilters): number {
  return [
    filters.priceRange,
    filters.bedrooms,
    filters.bathrooms,
    filters.buildingType,
  ].filter(Boolean).length;
}

/** Compact label for the composed “Filters” segment trigger. */
export function propertyFiltersSummary(
  filters: ExploreSearchFilters,
  money?: RentRangeMoney,
): string {
  const parts: string[] = [];

  const price = rentRangeShortLabel(filters.priceRange, money);
  if (price) parts.push(price.replace(/\s*\/mo$/, ""));

  if (filters.bedrooms) {
    parts.push(
      `${filters.bedrooms}+ bed${filters.bedrooms === "1" ? "" : "s"}`,
    );
  }

  if (filters.bathrooms) {
    parts.push(
      `${filters.bathrooms}+ bath${filters.bathrooms === "1" ? "" : "s"}`,
    );
  }

  const type = buildingTypeLabel(filters.buildingType);
  if (type) parts.push(type);

  return parts.length > 0 ? parts.join(" · ") : "Any price & type";
}
