import { apiFetch } from "./client";

export type UnlockStatus =
  | {
      unitId: string;
      unitNumber: string;
      status: string;
      unlockState: "available";
      feeUgx: number;
      exclusiveHours: number;
    }
  | {
      unitId: string;
      unitNumber: string;
      status: string;
      unlockState: "locked_by_other" | "unavailable";
      feeUgx: number;
      exclusiveHours: number;
    }
  | {
      unitId: string;
      unitNumber: string;
      status: string;
      unlockState: "winner";
      feeUgx: number;
      exclusiveHours: number;
      expiresAt: string | null;
      contact: {
        phone: string | null;
        exactAddress: string | null;
      };
    };

export async function fetchUnlockStatus(unitId: string) {
  return apiFetch<UnlockStatus>(`/units/${unitId}/unlock`);
}

export async function unlockUnit(unitId: string) {
  return apiFetch<Extract<UnlockStatus, { unlockState: "winner" }>>(
    `/units/${unitId}/unlock`,
    { method: "POST", body: JSON.stringify({}) },
  );
}
