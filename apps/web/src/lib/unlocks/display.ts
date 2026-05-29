import type { TenantUnlock } from "@/lib/api/unlocks";

export function formatUnlockExpiry(expiresAt: string | null) {
  if (!expiresAt) return "Exclusive access active";
  const end = new Date(expiresAt);
  const hours = Math.max(
    0,
    Math.round((end.getTime() - Date.now()) / (1000 * 60 * 60)),
  );
  if (hours <= 0) return "Access expiring soon";
  return `${hours}h of exclusive access remaining`;
}

export function contactHref(phone: string) {
  if (phone.includes("@")) return `mailto:${phone}`;
  const digits = phone.replace(/\s/g, "");
  return digits.startsWith("+") ? `tel:${digits}` : `tel:+${digits}`;
}

export function getBuildingUnlocks(
  unlocks: TenantUnlock[],
  buildingId: string,
) {
  return unlocks.filter((unlock) => unlock.buildingId === buildingId);
}

export function hasAccessOnly(
  building: { availableUnitCount: number; myUnlockCount?: number },
) {
  return (building.myUnlockCount ?? 0) > 0 && building.availableUnitCount === 0;
}
