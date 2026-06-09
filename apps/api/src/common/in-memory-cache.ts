type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export function createInMemoryCache<T>(ttlMs: number) {
  let entry: CacheEntry<T> | null = null;

  return {
    get(): T | null {
      if (!entry || Date.now() >= entry.expiresAt) {
        entry = null;
        return null;
      }
      return entry.value;
    },
    set(value: T) {
      entry = { value, expiresAt: Date.now() + ttlMs };
    },
    clear() {
      entry = null;
    },
  };
}
