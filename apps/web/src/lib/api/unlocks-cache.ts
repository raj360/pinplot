import { fetchBuildingUnlocks, type TenantUnlock } from "./unlocks";

const CACHE_PREFIX = "plotpin:building-unlocks:";
const CACHE_TTL_MS = 15 * 60 * 1000;

type CachedUnlockPayload = {
  unlocks: TenantUnlock[];
  at: number;
};

/** In-flight dedupe only; unlock state is network-sourced after cache hydrate. */
const inflight = new globalThis.Map<string, Promise<TenantUnlock[]>>();

export function readCachedBuildingUnlocks(
  buildingId: string,
): TenantUnlock[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${buildingId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUnlockPayload;
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.unlocks;
  } catch {
    return null;
  }
}

export function writeCachedBuildingUnlocks(
  buildingId: string,
  unlocks: TenantUnlock[],
) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedUnlockPayload = { unlocks, at: Date.now() };
    sessionStorage.setItem(
      `${CACHE_PREFIX}${buildingId}`,
      JSON.stringify(payload),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearCachedBuildingUnlocks(buildingId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${CACHE_PREFIX}${buildingId}`);
}

export async function fetchBuildingUnlocksFresh(
  buildingId: string,
): Promise<TenantUnlock[]> {
  const pending = inflight.get(buildingId);
  if (pending) return pending;

  const promise = fetchBuildingUnlocks(buildingId)
    .then((unlocks) => {
      writeCachedBuildingUnlocks(buildingId, unlocks);
      return unlocks;
    })
    .finally(() => {
      inflight.delete(buildingId);
    });

  inflight.set(buildingId, promise);
  return promise;
}

export function cancelInflightBuildingUnlocks(buildingId?: string) {
  if (buildingId) {
    inflight.delete(buildingId);
    return;
  }
  inflight.clear();
}
