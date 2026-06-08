import type { Bounds } from "@/lib/api/buildings";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type GeoPlaceKind = "region" | "district" | "city" | "neighborhood";

export type GeoPlace = {
  id: string;
  countryCode: string;
  kind: GeoPlaceKind;
  name: string;
  slug: string;
  center: { lat: number; lng: number };
  bounds: Bounds;
  population: number | null;
};

export async function fetchGeoPlaces(
  countryCode: string,
  options?: { kind?: GeoPlaceKind; limit?: number },
): Promise<GeoPlace[]> {
  const params = new URLSearchParams({ country: countryCode.toUpperCase() });
  if (options?.kind) params.set("kind", options.kind);
  if (options?.limit != null) params.set("limit", String(options.limit));

  const res = await fetch(`${API_URL}/api/v1/geo/places?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  return res.json() as Promise<GeoPlace[]>;
}

/** Client-side fetch for explore picker (session cache in hook). */
export async function fetchGeoPlacesClient(
  countryCode: string,
): Promise<GeoPlace[]> {
  const params = new URLSearchParams({
    country: countryCode.toUpperCase(),
    limit: "120",
  });
  const res = await fetch(`${API_URL}/api/v1/geo/places?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<GeoPlace[]>;
}
