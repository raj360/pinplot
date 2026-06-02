import type { Bounds } from "@/lib/api/buildings";
import { boundsAround } from "@/lib/filters/search-areas";
import { EXPLORE_CITY_RADIUS_DEG } from "@/lib/maps/config";

export type GeocodedPlace = {
  label: string;
  center: { lat: number; lng: number };
  bounds: Bounds;
};

type GeocodeResponse = {
  status: string;
  results?: Array<{
    formatted_address: string;
    address_components: Array<{ long_name: string; types: string[] }>;
    geometry: {
      location: { lat: number; lng: number };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
  }>;
};

/** Resolve a free-text place name in Uganda via Google Geocoding (client-side). */
export async function geocodePlaceInUganda(
  query: string,
): Promise<GeocodedPlace | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key || key.startsWith("your-")) return null;

  const address = /\buganda\b/i.test(trimmed)
    ? trimmed
    : `${trimmed}, Uganda`;

  const params = new URLSearchParams({
    address,
    components: "country:UG",
    key,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
  );
  if (!res.ok) return null;

  const data = (await res.json()) as GeocodeResponse;
  if (data.status !== "OK" || !data.results?.[0]) return null;

  const result = data.results[0];
  const { lat, lng } = result.geometry.location;
  const viewport = result.geometry.viewport;

  const bounds: Bounds = viewport
    ? {
        north: viewport.northeast.lat,
        south: viewport.southwest.lat,
        east: viewport.northeast.lng,
        west: viewport.southwest.lng,
      }
    : boundsAround(lat, lng, EXPLORE_CITY_RADIUS_DEG);

  const locality = result.address_components.find((component) =>
    component.types.includes("locality"),
  )?.long_name;

  return {
    label: locality ?? result.formatted_address.split(",")[0]?.trim() ?? trimmed,
    center: { lat, lng },
    bounds,
  };
}
