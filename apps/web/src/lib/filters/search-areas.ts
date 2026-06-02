import type { Bounds } from "@/lib/api/buildings";
import { KAMPALA_BOUNDS } from "@/lib/api/buildings";
import {
  EXPLORE_CITY_RADIUS_DEG,
  EXPLORE_NEAR_ME_RADIUS_DEG,
  EXPLORE_NEIGHBORHOOD_RADIUS_DEG,
} from "@/lib/maps/config";
import {
  distanceKm,
  formatDistanceKm,
  isInUganda,
  type GeoPoint,
} from "@/lib/geo/uganda";

export type SearchAreaPreset = {
  value: string;
  label: string;
  center: { lat: number; lng: number };
  bounds: Bounds;
};

const DELTA = EXPLORE_NEIGHBORHOOD_RADIUS_DEG;
const CITY_DELTA = EXPLORE_CITY_RADIUS_DEG;
const NEARBY_RADIUS_KM = 22;

export function boundsAround(
  lat: number,
  lng: number,
  delta = DELTA,
): Bounds {
  return {
    north: lat + delta,
    south: lat - delta,
    east: lng + delta,
    west: lng - delta,
  };
}

/** Major towns — map viewport jump (not a text filter on the API). */
export const UGANDA_CITY_PRESETS: SearchAreaPreset[] = [
  { value: "Jinja", label: "Jinja", center: { lat: 0.4244, lng: 33.2041 }, bounds: boundsAround(0.4244, 33.2041, CITY_DELTA) },
  { value: "Bugembe", label: "Bugembe", center: { lat: 0.4661, lng: 33.2334 }, bounds: boundsAround(0.4661, 33.2334, CITY_DELTA) },
  { value: "Entebbe", label: "Entebbe", center: { lat: 0.0512, lng: 32.4634 }, bounds: boundsAround(0.0512, 32.4634, CITY_DELTA) },
  { value: "Wakiso", label: "Wakiso", center: { lat: 0.4044, lng: 32.4594 }, bounds: boundsAround(0.4044, 32.4594, CITY_DELTA) },
  { value: "Mukono", label: "Mukono", center: { lat: 0.3533, lng: 32.7553 }, bounds: boundsAround(0.3533, 32.7553, CITY_DELTA) },
  { value: "Mbarara", label: "Mbarara", center: { lat: -0.6167, lng: 30.65 }, bounds: boundsAround(-0.6167, 30.65, CITY_DELTA) },
  { value: "Gulu", label: "Gulu", center: { lat: 2.7746, lng: 32.298 }, bounds: boundsAround(2.7746, 32.298, CITY_DELTA) },
];

/** Kampala neighbourhoods — extend as coverage grows. */
export const AREA_PRESETS: SearchAreaPreset[] = [
  { value: "Namuwongo", label: "Namuwongo", center: { lat: 0.308, lng: 32.612 }, bounds: boundsAround(0.308, 32.612) },
  { value: "Nakasero", label: "Nakasero", center: { lat: 0.328, lng: 32.588 }, bounds: boundsAround(0.328, 32.588) },
  { value: "Ntinda", label: "Ntinda", center: { lat: 0.352, lng: 32.613 }, bounds: boundsAround(0.352, 32.613) },
  { value: "Kololo", label: "Kololo", center: { lat: 0.331, lng: 32.595 }, bounds: boundsAround(0.331, 32.595) },
  { value: "Bugolobi", label: "Bugolobi", center: { lat: 0.315, lng: 32.61 }, bounds: boundsAround(0.315, 32.61) },
  { value: "Muyenga", label: "Muyenga", center: { lat: 0.295, lng: 32.605 }, bounds: boundsAround(0.295, 32.605) },
  { value: "Bukoto", label: "Bukoto", center: { lat: 0.358, lng: 32.598 }, bounds: boundsAround(0.358, 32.598) },
  { value: "Naguru", label: "Naguru", center: { lat: 0.338, lng: 32.608 }, bounds: boundsAround(0.338, 32.608) },
  { value: "Kabalagala", label: "Kabalagala", center: { lat: 0.285, lng: 32.585 }, bounds: boundsAround(0.285, 32.585) },
  { value: "Makindye", label: "Makindye", center: { lat: 0.278, lng: 32.575 }, bounds: boundsAround(0.278, 32.575) },
  { value: "Wandegeya", label: "Wandegeya", center: { lat: 0.345, lng: 32.568 }, bounds: boundsAround(0.345, 32.568) },
  { value: "Lubaga", label: "Lubaga", center: { lat: 0.302, lng: 32.552 }, bounds: boundsAround(0.302, 32.552) },
  { value: "Kasubi", label: "Kasubi", center: { lat: 0.318, lng: 32.538 }, bounds: boundsAround(0.318, 32.538) },
  { value: "Nateete", label: "Nateete", center: { lat: 0.305, lng: 32.528 }, bounds: boundsAround(0.305, 32.528) },
  { value: "Naalya", label: "Naalya", center: { lat: 0.368, lng: 32.625 }, bounds: boundsAround(0.368, 32.625) },
  { value: "Kyanja", label: "Kyanja", center: { lat: 0.385, lng: 32.615 }, bounds: boundsAround(0.385, 32.615) },
  { value: "Munyonyo", label: "Munyonyo", center: { lat: 0.268, lng: 32.615 }, bounds: boundsAround(0.268, 32.615) },
  { value: "Bunga", label: "Bunga", center: { lat: 0.278, lng: 32.618 }, bounds: boundsAround(0.278, 32.618) },
  { value: "Kansanga", label: "Kansanga", center: { lat: 0.288, lng: 32.6 }, bounds: boundsAround(0.288, 32.6) },
  { value: "Kampala Central Division", label: "Central Kampala", center: { lat: 0.315, lng: 32.582 }, bounds: boundsAround(0.315, 32.582) },
];

export const ALL_AREA_PRESETS: SearchAreaPreset[] = [
  ...UGANDA_CITY_PRESETS,
  ...AREA_PRESETS,
];

export type AreaSearchOption = {
  value: string;
  label: string;
  distanceKm?: number;
  section?: "nearby" | "cities" | "kampala" | "all";
};

export function rankAreaOptions(
  userLocation: GeoPoint | null,
  inUganda: boolean,
): AreaSearchOption[] {
  const rankedKampala = [...AREA_PRESETS]
    .map((preset) => ({
      preset,
      distanceKm: userLocation
        ? distanceKm(userLocation, preset.center)
        : undefined,
    }))
    .sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return a.preset.label.localeCompare(b.preset.label);
    });

  const rankedCities = [...UGANDA_CITY_PRESETS]
    .map((preset) => ({
      preset,
      distanceKm: userLocation
        ? distanceKm(userLocation, preset.center)
        : undefined,
    }))
    .sort((a, b) => a.preset.label.localeCompare(b.preset.label));

  const options: AreaSearchOption[] = [
    { value: "", label: "Browse map area", section: "all" },
  ];

  for (const entry of rankedCities) {
    options.push({
      value: entry.preset.value,
      label: entry.preset.label,
      section: "cities",
    });
  }

  for (const entry of rankedKampala) {
    const nearby =
      inUganda &&
      userLocation &&
      entry.distanceKm != null &&
      entry.distanceKm <= NEARBY_RADIUS_KM;

    options.push({
      value: entry.preset.value,
      label: entry.preset.label,
      distanceKm: entry.distanceKm,
      section: nearby ? "nearby" : "kampala",
    });
  }

  return options;
}

export function filterAreaOptions(
  options: AreaSearchOption[],
  query: string,
): AreaSearchOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter((option) => {
    if (!option.value) {
      return (
        "browse map".includes(normalized) ||
        "map area".includes(normalized) ||
        normalized.length <= 2
      );
    }
    return (
      option.label.toLowerCase().includes(normalized) ||
      option.value.toLowerCase().includes(normalized)
    );
  });
}

export function resolveSearchArea(query: string): SearchAreaPreset | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  return (
    ALL_AREA_PRESETS.find((preset) => {
      const value = preset.value.toLowerCase();
      const label = preset.label.toLowerCase();
      return (
        value === normalized ||
        label === normalized ||
        value.includes(normalized) ||
        label.includes(normalized) ||
        normalized.includes(label)
      );
    }) ?? null
  );
}

export function searchAreaLabel(query: string): string | null {
  if (!query.trim()) return null;
  return resolveSearchArea(query)?.label ?? query.trim();
}

export function getBoundsForSearch(query: string): Bounds {
  const preset = resolveSearchArea(query);
  if (preset) return preset.bounds;

  return KAMPALA_BOUNDS;
}

export function getMapFocusForSearch(
  query: string,
  userLocation?: GeoPoint | null,
): {
  bounds: Bounds;
  center: { lat: number; lng: number };
} | null {
  const preset = resolveSearchArea(query);
  if (preset) {
    return { bounds: preset.bounds, center: preset.center };
  }

  if (userLocation && isInUganda(userLocation.lat, userLocation.lng)) {
    return {
      bounds: boundsAround(
        userLocation.lat,
        userLocation.lng,
        EXPLORE_NEAR_ME_RADIUS_DEG,
      ),
      center: userLocation,
    };
  }

  return null;
}

export { formatDistanceKm };
