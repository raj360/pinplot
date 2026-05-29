import type { BuildingDetail } from "./buildings";
import { fetchBuilding } from "./buildings";
import { getAccessToken } from "./client";

const cache = new globalThis.Map<string, BuildingDetail>();
const inflight = new globalThis.Map<string, Promise<BuildingDetail>>();

async function cacheKey(id: string) {
  const token = await getAccessToken();
  return token ? `${id}:auth` : id;
}

export function getCachedBuilding(id: string, authenticated = false) {
  return cache.get(authenticated ? `${id}:auth` : id);
}

export async function fetchBuildingCached(id: string): Promise<BuildingDetail> {
  const key = await cacheKey(id);
  const hit = cache.get(key);
  if (hit) return hit;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetchBuilding(id)
    .then((detail) => {
      cache.set(key, detail);
      inflight.delete(key);
      return detail;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export function primeBuildingCache(id: string, detail: BuildingDetail) {
  cache.set(id, detail);
}

export function clearBuildingCache(id?: string) {
  if (id) {
    cache.delete(id);
    cache.delete(`${id}:auth`);
    return;
  }
  cache.clear();
}
