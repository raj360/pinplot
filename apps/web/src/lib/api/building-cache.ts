import type { BuildingDetail } from "./buildings";
import { fetchBuilding } from "./buildings";

const cache = new globalThis.Map<string, BuildingDetail>();
const inflight = new globalThis.Map<string, Promise<BuildingDetail>>();

export function getCachedBuilding(id: string) {
  return cache.get(id);
}

export async function fetchBuildingCached(id: string): Promise<BuildingDetail> {
  const hit = cache.get(id);
  if (hit) return hit;

  const pending = inflight.get(id);
  if (pending) return pending;

  const promise = fetchBuilding(id)
    .then((detail) => {
      cache.set(id, detail);
      inflight.delete(id);
      return detail;
    })
    .catch((err) => {
      inflight.delete(id);
      throw err;
    });

  inflight.set(id, promise);
  return promise;
}

export function primeBuildingCache(id: string, detail: BuildingDetail) {
  cache.set(id, detail);
}
