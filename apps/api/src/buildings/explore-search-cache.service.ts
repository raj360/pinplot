import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { BuildingBoundsQueryDto } from "./dto/building.dto";
import { exploreSearchCacheKey } from "./explore-query";

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

/** Short TTL in-memory cache for anonymous GET /buildings (identical bounds + filters). */
@Injectable()
export class ExploreSearchCacheService {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly store = new Map<string, CacheEntry<unknown>>();

  constructor(config: ConfigService) {
    const ttl = Number(config.get<string>("EXPLORE_SEARCH_CACHE_TTL_MS"));
    this.ttlMs = Number.isFinite(ttl) && ttl > 0 ? ttl : 30_000;
    const max = Number(config.get<string>("EXPLORE_SEARCH_CACHE_MAX_ENTRIES"));
    this.maxEntries = Number.isFinite(max) && max > 0 ? max : 256;
  }

  get<T>(query: BuildingBoundsQueryDto): T | null {
    const key = exploreSearchCacheKey(query);
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(query: BuildingBoundsQueryDto, value: T): void {
    if (this.store.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.store.set(exploreSearchCacheKey(query), {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  clear(): void {
    this.store.clear();
  }

  private evictOldest(): void {
    const firstKey = this.store.keys().next().value;
    if (firstKey) this.store.delete(firstKey);
  }
}
