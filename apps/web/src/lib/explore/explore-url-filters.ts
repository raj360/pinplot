import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import type { Bounds } from "@/lib/api/buildings";
import { BUILDING_TYPE_OPTIONS } from "@/lib/filters/building-types";
import { isValidRentRangeValue } from "@/lib/filters/rent-ranges";
import { serializeMapBoundsToParams } from "@/lib/explore/map-bounds";

/** Query keys for explore search (filters only — `building` / `map` are separate). */
export const EXPLORE_URL_KEYS = {
  area: "area",
  price: "price",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  type: "type",
} as const;

const VALID_TYPE_VALUES = new Set<string>(
  BUILDING_TYPE_OPTIONS.map((option) => option.value).filter(Boolean),
);

function sanitizeMinCount(raw: string | null): string {
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 9) return "";
  return String(Math.floor(n));
}

function sanitizePriceRange(raw: string | null): string {
  if (!raw) return "";
  return isValidRentRangeValue(raw) ? raw : "";
}

function sanitizeBuildingType(raw: string | null): string {
  if (!raw) return "";
  return VALID_TYPE_VALUES.has(raw) ? raw : "";
}

export function parseExploreFiltersFromSearchParams(
  params: URLSearchParams,
): ExploreSearchFilters {
  return {
    city: params.get(EXPLORE_URL_KEYS.area)?.trim() ?? "",
    priceRange: sanitizePriceRange(params.get(EXPLORE_URL_KEYS.price)),
    bedrooms: sanitizeMinCount(params.get(EXPLORE_URL_KEYS.bedrooms)),
    bathrooms: sanitizeMinCount(params.get(EXPLORE_URL_KEYS.bathrooms)),
    buildingType: sanitizeBuildingType(params.get(EXPLORE_URL_KEYS.type)),
  };
}

export function exploreFiltersEqual(
  a: ExploreSearchFilters,
  b: ExploreSearchFilters,
): boolean {
  return (
    a.city === b.city &&
    a.priceRange === b.priceRange &&
    a.bedrooms === b.bedrooms &&
    a.bathrooms === b.bathrooms &&
    a.buildingType === b.buildingType
  );
}

/** Serialize filters; optionally preserve deep-link params (`building`, `map`). */
export function buildExploreSearchParams(
  filters: ExploreSearchFilters,
  preserve?: URLSearchParams,
  mapBounds?: Bounds | null,
): URLSearchParams {
  const params = new URLSearchParams();

  const buildingId = preserve?.get("building");
  if (buildingId) params.set("building", buildingId);
  if (preserve?.get("map") === "0") params.set("map", "0");

  serializeMapBoundsToParams(params, mapBounds ?? null);

  if (filters.city.trim() && !mapBounds) {
    params.set(EXPLORE_URL_KEYS.area, filters.city.trim());
  }
  if (filters.priceRange) {
    params.set(EXPLORE_URL_KEYS.price, filters.priceRange);
  }
  if (filters.bedrooms) {
    params.set(EXPLORE_URL_KEYS.bedrooms, filters.bedrooms);
  }
  if (filters.bathrooms) {
    params.set(EXPLORE_URL_KEYS.bathrooms, filters.bathrooms);
  }
  if (filters.buildingType) {
    params.set(EXPLORE_URL_KEYS.type, filters.buildingType);
  }

  return params;
}

export function buildExploreHref(
  pathname: string,
  filters: ExploreSearchFilters,
  preserve?: URLSearchParams,
  mapBounds?: Bounds | null,
): string {
  const params = buildExploreSearchParams(filters, preserve, mapBounds);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Update building selection / detail-pane visibility in the shareable URL. */
export function buildExploreSelectionHref(
  pathname: string,
  filters: ExploreSearchFilters,
  options: {
    buildingId?: string | null;
    hideMap?: boolean;
    mapBounds?: Bounds | null;
    preserve?: URLSearchParams;
  },
): string {
  const preserve = new URLSearchParams(options.preserve?.toString() ?? "");

  if (options.buildingId) {
    preserve.set("building", options.buildingId);
  } else {
    preserve.delete("building");
  }

  if (options.hideMap) {
    preserve.set("map", "0");
  } else {
    preserve.delete("map");
  }

  return buildExploreHref(
    pathname,
    filters,
    preserve,
    options.mapBounds ?? null,
  );
}
