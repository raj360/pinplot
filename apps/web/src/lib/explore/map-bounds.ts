import type { Bounds } from "@/lib/api/buildings";
import { KAMPALA_BOUNDS } from "@/lib/api/buildings";
import { getBoundsForSearch } from "@/lib/filters/search-areas";
import { EXPLORE_MAP_MIN_ZOOM } from "@/lib/maps/config";

/** URL keys for map-viewport search (shareable). */
export const MAP_BOUNDS_URL_KEYS = {
  north: "bn",
  south: "bs",
  east: "be",
  west: "bw",
} as const;

const BOUNDS_EPSILON = 0.0008;

export function boundsForExploreSearch(
  filters: { city: string },
  mapBounds?: Bounds | null,
): Bounds {
  if (mapBounds) return mapBounds;
  if (filters.city.trim()) return getBoundsForSearch(filters.city);
  return KAMPALA_BOUNDS;
}

export function sanitizeMapBounds(params: URLSearchParams): Bounds | null {
  const north = Number(params.get(MAP_BOUNDS_URL_KEYS.north));
  const south = Number(params.get(MAP_BOUNDS_URL_KEYS.south));
  const east = Number(params.get(MAP_BOUNDS_URL_KEYS.east));
  const west = Number(params.get(MAP_BOUNDS_URL_KEYS.west));

  if (
    !Number.isFinite(north) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(west)
  ) {
    return null;
  }

  if (north <= south || east <= west) return null;
  if (north - south > 0.55 || east - west > 0.55) return null;

  return { north, south, east, west };
}

export function mapBoundsEqual(a: Bounds | null, b: Bounds | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.north - b.north) < BOUNDS_EPSILON &&
    Math.abs(a.south - b.south) < BOUNDS_EPSILON &&
    Math.abs(a.east - b.east) < BOUNDS_EPSILON &&
    Math.abs(a.west - b.west) < BOUNDS_EPSILON
  );
}

/** True when the user has panned/zoomed away from the last searched viewport. */
export function mapViewportDiffersFromSearch(
  viewport: Bounds | null,
  searched: Bounds | null,
): boolean {
  if (!viewport || !searched) return false;

  const vLat = (viewport.north + viewport.south) / 2;
  const vLng = (viewport.east + viewport.west) / 2;
  const sLat = (searched.north + searched.south) / 2;
  const sLng = (searched.east + searched.west) / 2;

  const vLatSpan = viewport.north - viewport.south;
  const vLngSpan = viewport.east - viewport.west;
  const sLatSpan = searched.north - searched.south;
  const sLngSpan = searched.east - searched.west;

  const centerShiftLat = Math.abs(vLat - sLat);
  const centerShiftLng = Math.abs(vLng - sLng);
  const spanChangeLat = Math.abs(vLatSpan - sLatSpan) / Math.max(sLatSpan, 0.001);
  const spanChangeLng = Math.abs(vLngSpan - sLngSpan) / Math.max(sLngSpan, 0.001);

  return (
    centerShiftLat > sLatSpan * 0.12 ||
    centerShiftLng > sLngSpan * 0.12 ||
    spanChangeLat > 0.15 ||
    spanChangeLng > 0.15
  );
}

export function canSearchMapViewport(zoom: number | null): boolean {
  return zoom != null && zoom >= EXPLORE_MAP_MIN_ZOOM;
}

export function serializeMapBoundsToParams(
  params: URLSearchParams,
  bounds: Bounds | null,
): void {
  params.delete(MAP_BOUNDS_URL_KEYS.north);
  params.delete(MAP_BOUNDS_URL_KEYS.south);
  params.delete(MAP_BOUNDS_URL_KEYS.east);
  params.delete(MAP_BOUNDS_URL_KEYS.west);

  if (!bounds) return;

  params.set(MAP_BOUNDS_URL_KEYS.north, bounds.north.toFixed(5));
  params.set(MAP_BOUNDS_URL_KEYS.south, bounds.south.toFixed(5));
  params.set(MAP_BOUNDS_URL_KEYS.east, bounds.east.toFixed(5));
  params.set(MAP_BOUNDS_URL_KEYS.west, bounds.west.toFixed(5));
}

export function mapAreaChipLabel(): string {
  return "Map area";
}
