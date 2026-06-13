import { apiFetch } from "./client";

export type TenantUnlock = {
  unlockId: string;
  unitId: string;
  unitNumber: string;
  buildingId: string;
  buildingName: string;
  unlockState: "winner" | "expired";
  unlockedAt: string;
  expiresAt: string | null;
  exclusiveHours: number;
  locksUnit?: boolean;
  rentPeriod?: "month" | "day";
  contact: {
    phone: string | null;
    phoneSecondary?: string | null;
    exactAddress: string | null;
    /** True when only sign-in email is available, landlord has no phone on profile. */
    contactIsEmailFallback?: boolean;
  };
  location: {
    lat: number;
    lng: number;
  };
  /** Included on unlock responses, gated on public building endpoints. */
  coverImageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  /** Listing context for unlock hub cards (Phase 4). */
  bedrooms?: number;
  rentAmount?: number;
  listingCurrency?: string;
  district?: string | null;
  city?: string | null;
  /** Settled payment from `payments` join on list endpoints. */
  amountPaid?: number;
  paidCurrency?: string;
};

export type UnlockStatus =
  | {
      unitId: string;
      unitNumber: string;
      buildingId: string;
      status: string;
      unlockState: "available";
      feeUgx: number;
      quoteLabel?: string;
      buildingType?: string | null;
      bedrooms?: number;
      unlockCreditsAvailable?: number;
      exclusiveHours: number;
  locksUnit?: boolean;
  rentPeriod?: "month" | "day";
    }
  | {
      unitId: string;
      unitNumber: string;
      buildingId: string;
      status: string;
      unlockState: "locked_by_other" | "unavailable";
      feeUgx: number;
      quoteLabel?: string;
      buildingType?: string | null;
      bedrooms?: number;
      unlockCreditsAvailable?: number;
      exclusiveHours: number;
  locksUnit?: boolean;
  rentPeriod?: "month" | "day";
    }
  | (TenantUnlock & {
      status: string;
      feeUgx: number;
      unlockCreditsAvailable?: number;
      paidWithCredit?: boolean;
      creditType?: string;
    });

export type UnlockListStatus = "active" | "expired" | "all";

export async function fetchMyUnlocks(status: UnlockListStatus = "active") {
  const params = status === "active" ? "" : `?status=${status}`;
  return apiFetch<TenantUnlock[]>(`/unlocks/mine${params}`);
}

export async function fetchBuildingUnlocks(buildingId: string) {
  return apiFetch<TenantUnlock[]>(`/unlocks/building/${buildingId}`);
}

export async function fetchUnlockStatus(unitId: string) {
  return apiFetch<UnlockStatus>(`/units/${unitId}/unlock`);
}

export async function unlockUnit(
  unitId: string,
  options?: { acceptTerms?: boolean; paymentId?: string },
) {
  return apiFetch<TenantUnlock & { status: string; feeUgx: number }>(
    `/units/${unitId}/unlock`,
    {
      method: "POST",
      body: JSON.stringify({
        acceptTerms: options?.acceptTerms ?? false,
        paymentId: options?.paymentId,
      }),
    },
  );
}
