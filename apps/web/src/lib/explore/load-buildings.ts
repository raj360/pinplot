import { fetchBuildingsInBounds, type Bounds } from "@/lib/api/buildings";
import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { parseRentRange } from "@/lib/filters/rent-ranges";
import { boundsForExploreSearch } from "@/lib/explore/map-bounds";

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
  // Do NOT force a country filter — the map bounds already constrain results
  // geographically. Forcing countryCode=UG hid live listings in other markets
  // (e.g. a verified London building) even when the viewport was over them.
  return fetchBuildingsInBounds(bounds, {
    city: mapBounds ? undefined : filters.city || undefined,
    bedrooms: parseMinFilter(filters.bedrooms),
    bathrooms: parseMinFilter(filters.bathrooms),
    minRent,
    maxRent,
    buildingType: filters.buildingType || undefined,
  });
}
