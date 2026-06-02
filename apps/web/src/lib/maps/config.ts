/** Public explore map — neighborhood level only, not street/roof detail. */
export const EXPLORE_MAP_MAX_ZOOM = 14;
export const EXPLORE_MAP_CLUSTER_ZOOM_STEP = 2;
/** Allow one step wider than before so users can browse larger areas. */
export const EXPLORE_MAP_MIN_ZOOM = 9;
export const EXPLORE_MAP_DEFAULT_ZOOM = 12;

/** Half-span (degrees) for preset search areas — ~3.5 km at the equator. */
export const EXPLORE_NEIGHBORHOOD_RADIUS_DEG = 0.032;
/** Half-span for city / town jumps — ~9 km. */
export const EXPLORE_CITY_RADIUS_DEG = 0.08;
/** Half-span for Near me / geo bootstrap — ~8 km. */
export const EXPLORE_NEAR_ME_RADIUS_DEG = 0.07;

/** Explore pin + cluster palette (keep globals.css map tokens in sync). */
export const EXPLORE_MAP_CLUSTER_COLORS = {
  /** Small groups (2–9 listings). */
  small: "#1d4ed8",
  /** Medium groups (10–19 listings). */
  medium: "#f59e0b",
  /** Large groups (20+ listings). */
  large: "#ea580c",
} as const;

/** Individual building pins — softer + smaller than cluster bubbles. */
export const EXPLORE_MAP_PIN_COLORS = {
  available: "#fdba74",
  availableText: "#7c2d12",
  active: "#1d4ed8",
  activeText: "#ffffff",
  unlocked: "#84cc16",
  unlockedText: "#ffffff",
  unlockedActive: "#15803d",
  unlockedActiveText: "#ffffff",
  highlightRing: "#1d4ed8",
  highlightRingUnlocked: "#166534",
} as const;

/** @deprecated Use EXPLORE_MAP_PIN_COLORS / EXPLORE_MAP_CLUSTER_COLORS */
export const EXPLORE_MAP_MARKER_COLORS = {
  available: EXPLORE_MAP_PIN_COLORS.available,
  active: EXPLORE_MAP_PIN_COLORS.active,
  unlocked: EXPLORE_MAP_PIN_COLORS.unlocked,
  unlockedActive: EXPLORE_MAP_PIN_COLORS.unlockedActive,
} as const;

/** Unlocked / paid maps — exact location with satellite allowed. */
export const UNLOCKED_MAP_MIN_ZOOM = 10;
export const UNLOCKED_MAP_MAX_ZOOM = 20;
export const UNLOCKED_MAP_DEFAULT_ZOOM = 17;

/** Approximate pin jitter radius shown to tenants before unlock (~200 m). */
export const APPROXIMATE_LOCATION_RADIUS_M = 200;
