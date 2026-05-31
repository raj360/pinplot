export const LIVE_SEARCH_STORAGE_KEY = "plotpin-explore-live-search";
export const LIVE_SEARCH_DEBOUNCE_MS = 450;

export function readLiveSearchPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LIVE_SEARCH_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
