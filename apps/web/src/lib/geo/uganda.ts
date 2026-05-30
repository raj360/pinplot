/** Rough bounding box for Uganda (mainland). */
export const UGANDA_BOUNDS = {
  south: -1.5,
  north: 4.6,
  west: 29.5,
  east: 35.0,
};

export const DEFAULT_EXPLORE_COUNTRY = "UG";

export type GeoPoint = {
  lat: number;
  lng: number;
};

export function isInUganda(lat: number, lng: number): boolean {
  return (
    lat >= UGANDA_BOUNDS.south &&
    lat <= UGANDA_BOUNDS.north &&
    lng >= UGANDA_BOUNDS.west &&
    lng <= UGANDA_BOUNDS.east
  );
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return "< 1 km";
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
