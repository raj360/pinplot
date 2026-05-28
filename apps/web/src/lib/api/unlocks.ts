import { apiFetch } from "./client";

export type TenantUnlock = {
  unlockId: string;
  unitId: string;
  unitNumber: string;
  buildingId: string;
  buildingName: string;
  unlockState: "winner";
  unlockedAt: string;
  expiresAt: string | null;
  exclusiveHours: number;
  contact: {
    phone: string | null;
    exactAddress: string | null;
  };
  location: {
    lat: number;
    lng: number;
  };
};

export type UnlockStatus =
  | {
      unitId: string;
      unitNumber: string;
      buildingId: string;
      status: string;
      unlockState: "available";
      feeUgx: number;
      exclusiveHours: number;
    }
  | {
      unitId: string;
      unitNumber: string;
      buildingId: string;
      status: string;
      unlockState: "locked_by_other" | "unavailable";
      feeUgx: number;
      exclusiveHours: number;
    }
  | (TenantUnlock & {
      status: string;
      feeUgx: number;
    });

export async function fetchMyUnlocks() {
  return apiFetch<TenantUnlock[]>("/unlocks/mine");
}

export async function fetchBuildingUnlocks(buildingId: string) {
  return apiFetch<TenantUnlock[]>(`/unlocks/building/${buildingId}`);
}

export async function fetchUnlockStatus(unitId: string) {
  return apiFetch<UnlockStatus>(`/units/${unitId}/unlock`);
}

export async function unlockUnit(unitId: string) {
  return apiFetch<TenantUnlock & { status: string; feeUgx: number }>(
    `/units/${unitId}/unlock`,
    { method: "POST", body: JSON.stringify({}) },
  );
}
