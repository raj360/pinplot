import type { AreaSearchOption } from "@/lib/filters/search-areas";

export type RecentArea = {
  value: string;
  label: string;
};

const STORAGE_KEY = "plotpin.recentAreas.v1";
const MAX_RECENT_AREAS = 6;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

/** Read saved area jumps (most-recent first). Safe on the server (returns []). */
export function loadRecentAreas(): RecentArea[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RecentArea =>
          typeof entry?.value === "string" &&
          typeof entry?.label === "string" &&
          entry.value.trim().length > 0,
      )
      .slice(0, MAX_RECENT_AREAS);
  } catch {
    return [];
  }
}

/** Persist a successful area jump and return the updated, de-duped list. */
export function recordRecentArea(area: RecentArea): RecentArea[] {
  const value = area.value.trim();
  const label = area.label.trim() || value;
  if (!value) return loadRecentAreas();

  const existing = loadRecentAreas().filter(
    (entry) => entry.value.toLowerCase() !== value.toLowerCase(),
  );
  const next = [{ value, label }, ...existing].slice(0, MAX_RECENT_AREAS);

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full / unavailable, recents are best-effort only.
    }
  }
  return next;
}

export function clearRecentAreas(): RecentArea[] {
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return [];
}

/** Map recents into combobox options (skips the currently-selected value). */
export function recentAreaOptions(
  recents: RecentArea[],
  currentValue?: string,
): AreaSearchOption[] {
  const current = currentValue?.trim().toLowerCase();
  return recents
    .filter((entry) => entry.value.toLowerCase() !== current)
    .map((entry) => ({
      value: entry.value,
      label: entry.label,
      section: "recent" as const,
    }));
}
