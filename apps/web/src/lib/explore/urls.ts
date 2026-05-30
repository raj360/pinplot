import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { buildExploreSearchParams } from "@/lib/explore/explore-url-filters";

export function exploreBuildingUrl(
  buildingId: string,
  options?: { hideMap?: boolean; filters?: ExploreSearchFilters },
) {
  const params = buildExploreSearchParams(options?.filters ?? {
    city: "",
    bedrooms: "",
    bathrooms: "",
    priceRange: "",
    buildingType: "",
  });
  params.set("building", buildingId);
  if (options?.hideMap) params.set("map", "0");
  return `/explore?${params.toString()}`;
}

export function exploreSearchUrl(filters: ExploreSearchFilters) {
  const params = buildExploreSearchParams(filters);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}
