import { fetchBuildingUnlocks, type TenantUnlock } from "./unlocks";

/** In-flight dedupe only — no persistent cache; unlock state is always network-sourced. */
const inflight = new globalThis.Map<string, Promise<TenantUnlock[]>>();

export async function fetchBuildingUnlocksFresh(
  buildingId: string,
): Promise<TenantUnlock[]> {
  const pending = inflight.get(buildingId);
  if (pending) return pending;

  const promise = fetchBuildingUnlocks(buildingId).finally(() => {
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
