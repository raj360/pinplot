import type { BuildingSummary } from "@plotpin/shared-types";
import { apiFetch } from "./client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type BuildingDetail = BuildingSummary & {
  description?: string;
  units: Array<{
    id: string;
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
    currency: string;
    status: string;
  }>;
};

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Default map bounds — greater Kampala */
export const KAMPALA_BOUNDS: Bounds = {
  north: 0.4,
  south: 0.28,
  east: 32.72,
  west: 32.52,
};

export async function fetchBuildingsInBounds(
  bounds: Bounds = KAMPALA_BOUNDS,
  filters?: { city?: string; minRent?: number; maxRent?: number; bedrooms?: number },
): Promise<BuildingSummary[]> {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
  });
  if (filters?.city) params.set("city", filters.city);
  if (filters?.minRent != null) params.set("minRent", String(filters.minRent));
  if (filters?.maxRent != null) params.set("maxRent", String(filters.maxRent));
  if (filters?.bedrooms != null) params.set("bedrooms", String(filters.bedrooms));

  const res = await fetch(`${API_URL}/api/v1/buildings?${params}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Failed to load buildings");
  return res.json();
}

export async function fetchBuilding(id: string): Promise<BuildingDetail> {
  const res = await fetch(`${API_URL}/api/v1/buildings/${id}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error("Building not found");
  return res.json();
}

export async function syncProfile(accessToken: string) {
  const res = await fetch(`${API_URL}/api/v1/profiles/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Profile sync failed");
  return res.json();
}

export type LandlordBuilding = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  isVerified: boolean;
  totalUnits: number;
  availableUnitCount: number;
};

export type CreateBuildingPayload = {
  name: string;
  description?: string;
  city: string;
  district?: string;
  approximateLat: number;
  approximateLng: number;
  exactAddress?: string;
  videoUrl?: string;
  totalUnits: number;
  units: Array<{
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
  }>;
};

export async function fetchMyBuildings() {
  return apiFetch<LandlordBuilding[]>("/buildings/mine/list");
}

export async function createBuilding(payload: CreateBuildingPayload) {
  return apiFetch<BuildingDetail>("/buildings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function setProfileRole(role: "LANDLORD" | "TENANT") {
  return apiFetch("/profiles/me/role", {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export type PendingBuilding = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  created_at: string;
  approximate_lat: number;
  approximate_lng: number;
  cover_image_path: string | null;
  video_url: string | null;
  landlord_id: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

export function getLandlordDisplayName(building: PendingBuilding): string {
  const name = [building.first_name, building.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  if (building.email) return building.email;
  return "—";
}

export async function fetchPendingBuildings() {
  return apiFetch<PendingBuilding[]>("/admin/buildings/pending");
}

export async function verifyBuilding(id: string, verified: boolean) {
  return apiFetch(`/admin/buildings/${id}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ verified }),
  });
}

export async function registerBuildingImage(
  buildingId: string,
  storagePath: string,
  isPrimary = true,
) {
  return apiFetch(`/buildings/${buildingId}/images`, {
    method: "POST",
    body: JSON.stringify({ storagePath, isPrimary }),
  });
}
