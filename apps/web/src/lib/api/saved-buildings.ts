import { apiFetch } from "./client";

export type SavedBuilding = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  countryCode: string;
  buildingType: string;
  availableUnitCount: number;
  rentFrom: number | null;
  currency: string;
  rentPeriod?: string | null;
  coverThumbUrl?: string;
  isFeatured: boolean;
  savedAt: string;
};

export async function fetchSavedBuildings() {
  return apiFetch<SavedBuilding[]>("/saved-buildings/mine");
}

export async function fetchSavedBuildingIds() {
  return apiFetch<string[]>("/saved-buildings/ids");
}

export async function saveBuilding(buildingId: string) {
  return apiFetch<{ saved: boolean; buildingId: string }>(
    `/saved-buildings/${buildingId}`,
    { method: "POST" },
  );
}

export async function unsaveBuilding(buildingId: string) {
  return apiFetch<{ saved: boolean; buildingId: string }>(
    `/saved-buildings/${buildingId}`,
    { method: "DELETE" },
  );
}
