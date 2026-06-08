import type {
  AdminVerificationChecklist,
  BuildingSummary,
} from "@plotpin/shared-types";
import { apiFetch, getAccessToken } from "./client";
import { readApiError } from "./http-errors";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type BuildingDetail = BuildingSummary & {
  description?: string;
  videoUrl?: string;
  /** All building photos when the viewer has unlock access. */
  imageUrls?: string[];
  /** True when cover/video exist but URLs are withheld until unlock. */
  hasPremiumMedia?: boolean;
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
  filters?: {
    city?: string;
    minRent?: number;
    maxRent?: number;
    bedrooms?: number;
    bathrooms?: number;
    buildingType?: string;
    countryCode?: string;
  },
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
  if (filters?.bathrooms != null) params.set("bathrooms", String(filters.bathrooms));
  if (filters?.buildingType) params.set("buildingType", filters.buildingType);
  if (filters?.countryCode) params.set("countryCode", filters.countryCode);

  const token = await getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}/api/v1/buildings?${params}`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    throw await readApiError(res, "Failed to load buildings");
  }
  return res.json();
}

export async function fetchFeaturedBuildings(
  limit = 12,
  countryCode?: string,
): Promise<BuildingSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (countryCode) params.set("countryCode", countryCode);
  const res = await fetch(`${API_URL}/api/v1/buildings/featured?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw await readApiError(res, "Failed to load featured listings");
  }
  return res.json();
}

export async function fetchBuilding(id: string): Promise<BuildingDetail> {
  const token = await getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}/api/v1/buildings/${id}`, {
    headers,
    ...(token ? { cache: "no-store" as const } : { next: { revalidate: 30 } }),
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
  rejectedAt: string | null;
  rejectionReason: string | null;
  totalUnits: number;
  availableUnitCount: number;
};

export type CreateBuildingPayload = {
  acceptTerms: boolean;
  ownershipAttestation: boolean;
  name: string;
  description?: string;
  city: string;
  district?: string;
  /** ISO 3166-1 alpha-2 country of the building (drives listing currency). */
  countryCode?: string;
  approximateLat: number;
  approximateLng: number;
  exactLat?: number;
  exactLng?: number;
  exactAddress?: string;
  videoUrl?: string;
  buildingType?: string;
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

export type LandlordBuildingDetail = {
  id: string;
  name: string;
  description?: string;
  city: string;
  district: string | null;
  countryCode: string;
  buildingType: string;
  totalUnits: number;
  isVerified: boolean;
  rejectedAt: string | null;
  rejectionReason: string | null;
  availableUnitCount: number;
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

export async function fetchMyBuilding(id: string) {
  return apiFetch<LandlordBuildingDetail>(`/buildings/mine/${id}`);
}

export type UpdateMyBuildingPayload = {
  name?: string;
  description?: string;
  city?: string;
  district?: string;
  countryCode?: string;
  buildingType?: string;
};

export async function updateMyBuilding(
  id: string,
  payload: UpdateMyBuildingPayload,
) {
  return apiFetch<LandlordBuildingDetail>(`/buildings/mine/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type UpdateUnitStatusResult = {
  unit: LandlordBuildingDetail["units"][number];
};

export async function updateUnitStatus(
  buildingId: string,
  unitId: string,
  status: "AVAILABLE" | "UNAVAILABLE" | "RENTED",
) {
  return apiFetch<UpdateUnitStatusResult>(
    `/buildings/${buildingId}/units/${unitId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
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
  /** Landlord-placed pin — use for admin review maps. */
  pin_lat: number;
  pin_lng: number;
  total_units: number;
  unit_count: number;
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

export async function verifyBuilding(
  id: string,
  payload: {
    verified: boolean;
    checklist?: AdminVerificationChecklist;
    acknowledgeDuplicatePin?: boolean;
  },
) {
  return apiFetch(`/admin/buildings/${id}/verify`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function rejectBuilding(id: string, reason: string) {
  return apiFetch<{
    id: string;
    name: string;
    rejectedAt: string;
    rejectionReason: string;
    notification: { delivered: boolean; channel: string };
  }>(`/admin/buildings/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function resubmitBuildingForReview(id: string) {
  return apiFetch<{
    id: string;
    name: string;
    isVerified: boolean;
    rejectedAt: null;
    rejectionReason: null;
  }>(`/buildings/mine/${id}/resubmit-review`, {
    method: "PATCH",
  });
}

export type AdminPendingUnit = {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  currency: string;
  status: string;
};

export type DuplicatePinWarning = {
  id: string;
  name: string;
  landlordId: string | null;
  distanceM: number;
};

export type AdminPendingBuildingDetail = {
  id: string;
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  /** ISO country of the building — drives listing currency/locale. */
  countryCode: string;
  /** Listing currency (e.g. UGX, GBP) — units are priced in this. */
  currency: string;
  buildingType: string;
  exactAddress: string | null;
  coverImagePath: string | null;
  videoUrl: string | null;
  totalUnits: number;
  pinLat: number;
  pinLng: number;
  isVerified: boolean;
  ownershipAttestedAt: string | null;
  duplicatePinWarnings: DuplicatePinWarning[];
  landlordPhoneRequired: boolean;
  units: AdminPendingUnit[];
  landlord: {
    id: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    email: string | null;
    suspendedAt: string | null;
  };
};

export type AdminUpdateBuildingPayload = {
  name?: string;
  city?: string;
  district?: string;
  exactAddress?: string;
  coverImagePath?: string;
  videoUrl?: string;
  buildingType?: string;
  exactLat?: number;
  exactLng?: number;
  totalUnits?: number;
};

export function getAdminLandlordDisplayName(
  building: AdminPendingBuildingDetail,
): string {
  const name = [building.landlord.firstName, building.landlord.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  if (building.landlord.email) return building.landlord.email;
  return "—";
}

export async function fetchAdminPendingBuilding(id: string) {
  return apiFetch<AdminPendingBuildingDetail>(`/admin/buildings/${id}`);
}

export async function updateAdminPendingBuilding(
  id: string,
  payload: AdminUpdateBuildingPayload,
) {
  return apiFetch<AdminPendingBuildingDetail>(`/admin/buildings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function adminAddPendingUnit(
  buildingId: string,
  unit: {
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: number;
  },
) {
  return apiFetch<AdminPendingUnit>(`/admin/buildings/${buildingId}/units`, {
    method: "POST",
    body: JSON.stringify(unit),
  });
}

export async function adminUpdatePendingUnit(
  buildingId: string,
  unitId: string,
  unit: {
    unitNumber?: string;
    bedrooms?: number;
    bathrooms?: number;
    rentAmount?: number;
  },
) {
  return apiFetch<AdminPendingUnit>(
    `/admin/buildings/${buildingId}/units/${unitId}`,
    {
      method: "PATCH",
      body: JSON.stringify(unit),
    },
  );
}

export async function adminDeletePendingUnit(buildingId: string, unitId: string) {
  return apiFetch<{ deleted: boolean }>(
    `/admin/buildings/${buildingId}/units/${unitId}`,
    { method: "DELETE" },
  );
}
