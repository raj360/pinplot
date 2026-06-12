import type { Bounds } from "@/lib/api/buildings";
import type { GeoPlace } from "@/lib/api/geo-places";
import type { CountryCatalog } from "@plotpin/shared-types";
import { boundsAround } from "@/lib/filters/search-areas";
import { EXPLORE_CITY_RADIUS_DEG } from "@/lib/maps/config";

const KIND_RANK: Record<GeoPlace["kind"], number> = {
  city: 0,
  district: 1,
  region: 2,
  neighborhood: 3,
};

/** Primary city/region for a country, matches seed-geo-places backfill order. */
export function pickPrimaryGeoPlace(places: GeoPlace[]): GeoPlace | null {
  if (places.length === 0) return null;
  return [...places].sort((a, b) => {
    const kindDiff = KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (kindDiff !== 0) return kindDiff;
    return (b.population ?? 0) - (a.population ?? 0);
  })[0];
}

/** Last-resort browse center when catalog + geo_places have no data (e.g. KP, ER). */
export const GLOBAL_BROWSE_CENTER = { lat: 20, lng: 0 };

export function resolveCountryMapCenter(
  country: CountryCatalog | undefined,
  geoPlaces: GeoPlace[],
): { lat: number; lng: number } {
  if (country?.mapCenter) return country.mapCenter;
  const place = pickPrimaryGeoPlace(geoPlaces);
  if (place) return place.center;
  return GLOBAL_BROWSE_CENTER;
}

export function resolveCountryMapBounds(
  country: CountryCatalog | undefined,
  geoPlaces: GeoPlace[],
): Bounds {
  if (country?.mapBounds) return country.mapBounds;
  const place = pickPrimaryGeoPlace(geoPlaces);
  if (place) return place.bounds;
  const center = resolveCountryMapCenter(country, geoPlaces);
  return boundsAround(center.lat, center.lng, EXPLORE_CITY_RADIUS_DEG);
}
