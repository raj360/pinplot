import type { Bounds } from "@/lib/api/buildings";
import { KAMPALA_BOUNDS } from "@/lib/api/buildings";
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

const DELTA = 0.022;
const NEARBY_RADIUS_KM = 18;

function boundsAround(lat: number, lng: number, delta = DELTA): Bounds {
  return {
    north: lat + delta,
    south: lat - delta,
    east: lng + delta,
    west: lng - delta,
  };
}

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

export type AreaSearchOption = {
  value: string;
  label: string;
  distanceKm?: number;
  section?: "nearby" | "all";
};

export function rankAreaOptions(
  userLocation: GeoPoint | null,
  inUganda: boolean,
): AreaSearchOption[] {
  const ranked = [...AREA_PRESETS]
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

  const options: AreaSearchOption[] = [
    { value: "", label: "All Kampala", section: "all" },
  ];

  for (const entry of ranked) {
    const nearby =
      inUganda &&
      userLocation &&
      entry.distanceKm != null &&
      entry.distanceKm <= NEARBY_RADIUS_KM;

    options.push({
      value: entry.preset.value,
      label: entry.preset.label,
      distanceKm: entry.distanceKm,
      section: nearby ? "nearby" : "all",
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
      return "all kampala".includes(normalized) || normalized.length <= 2;
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
    AREA_PRESETS.find((preset) => {
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
      bounds: boundsAround(userLocation.lat, userLocation.lng, 0.045),
      center: userLocation,
    };
  }

  return null;
}

export { formatDistanceKm };
