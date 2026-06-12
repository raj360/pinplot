"use client";

import { UnlockCountdown } from "@/components/unlocks/UnlockCountdown";

/** Live countdown while a unit is on tenant hold (exclusive map lock). */
export function LandlordUnitHoldLine({
  lockedUntil,
  activeUnlockExpiresAt,
}: {
  lockedUntil: string | null;
  activeUnlockExpiresAt?: string | null;
}) {
  const expiresAt = lockedUntil ?? activeUnlockExpiresAt ?? null;

  return (
    <p className="mt-1 text-xs text-amber-900/90">
      <span className="font-medium text-amber-900">Tenant hold · </span>
      <UnlockCountdown expiresAt={expiresAt} locksUnit className="text-amber-900" />
    </p>
  );
}
