import { fetchBuildingsInBounds, type Bounds } from "@/lib/api/buildings";
import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { parseRentRange } from "@/lib/filters/rent-ranges";
import { boundsForExploreSearch } from "@/lib/explore/map-bounds";
import { DEFAULT_EXPLORE_COUNTRY } from "@/lib/geo/uganda";

function parseMinFilter(value: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function loadExploreBuildings(
  filters: ExploreSearchFilters,
  mapBounds?: Bounds | null,
) {
  const bounds = boundsForExploreSearch(filters, mapBounds);
  const { minRent, maxRent } = parseRentRange(filters.priceRange);
  return fetchBuildingsInBounds(bounds, {
    city: mapBounds ? undefined : filters.city || undefined,
    bedrooms: parseMinFilter(filters.bedrooms),
    bathrooms: parseMinFilter(filters.bathrooms),
    minRent,
    maxRent,
    buildingType: filters.buildingType || undefined,
    countryCode: DEFAULT_EXPLORE_COUNTRY,
  });
}
