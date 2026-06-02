/** Debounce for filter dropdown changes. */
export const FILTER_LIVE_SEARCH_DEBOUNCE_MS = 450;

/** Debounce after map pan/zoom before refetching listings. */
export const MAP_LIVE_SEARCH_DEBOUNCE_MS = 550;

/** @deprecated Map + filter live search is always on; kept for localStorage migration. */
export const LIVE_SEARCH_STORAGE_KEY = "plotpin-explore-live-search";

/** @deprecated Always returns true — live search is the default UX. */
export const LIVE_SEARCH_DEBOUNCE_MS = FILTER_LIVE_SEARCH_DEBOUNCE_MS;

export function readLiveSearchPreference(): boolean {
  return true;
}
