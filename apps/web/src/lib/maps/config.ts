/** Public explore map — neighborhood level only, not street/roof detail. */
export const EXPLORE_MAP_MAX_ZOOM = 14;
export const EXPLORE_MAP_CLUSTER_ZOOM_STEP = 2;
/** Allow wider city-level browse so jittered pins read as approximate. */
export const EXPLORE_MAP_MIN_ZOOM = 8;
export const EXPLORE_MAP_DEFAULT_ZOOM = 11;
/** Half-span when focusing a listing on the explore map (~1.6 km). */
export const EXPLORE_BUILDING_FOCUS_RADIUS_DEG = 0.014;

/** Half-span (degrees) for preset search areas — ~3.5 km at the equator. */
export const EXPLORE_NEIGHBORHOOD_RADIUS_DEG = 0.032;
/** Half-span for city / town jumps — ~9 km. */
export const EXPLORE_CITY_RADIUS_DEG = 0.08;
/** Half-span for Near me / geo bootstrap — ~10 km. */
export const EXPLORE_NEAR_ME_RADIUS_DEG = 0.09;

/** Explore pin + cluster palette (keep globals.css map tokens in sync). */
export const EXPLORE_MAP_CLUSTER_COLORS = {
  /** Small groups (2–9 listings). */
  small: "#1d4ed8",
  /** Medium groups (10–19 listings). */
  medium: "#f59e0b",
  /** Large groups (20+ listings). */
  large: "#ea580c",
} as const;

/** Hide default Google POI when not using a cloud Map ID (inline styles are ignored with mapId). */
export const EXPLORE_MAP_POI_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

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

/** City-level zoom when the listing picker opens on a country default. */
export const LISTING_PICKER_COUNTRY_ZOOM = 11;
/** Closer zoom once a precise point (geolocation / drag) is chosen. */
export const LISTING_PICKER_PRECISE_ZOOM = 16;

/**
 * Major-city fallback centers for the building-creation map, keyed by viewer
 * country. Used to open the picker near the landlord's region instead of always
 * Kampala. The DB catalog center is preferred when present; this covers diaspora
 * markets whose catalog rows have no map center.
 */
export const LISTING_PICKER_COUNTRY_CENTERS: Record<
  string,
  { lat: number; lng: number }
> = {
  UG: { lat: 0.3476, lng: 32.5825 }, // Kampala
  GB: { lat: 51.5074, lng: -0.1278 }, // London
  US: { lat: 40.7128, lng: -74.006 }, // New York
  KE: { lat: -1.2921, lng: 36.8219 }, // Nairobi
  TZ: { lat: -6.7924, lng: 39.2083 }, // Dar es Salaam
  RW: { lat: -1.9403, lng: 29.8739 }, // Kigali
  NG: { lat: 6.5244, lng: 3.3792 }, // Lagos
  ZA: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
  AE: { lat: 25.2048, lng: 55.2708 }, // Dubai
  CA: { lat: 43.6532, lng: -79.3832 }, // Toronto
  DE: { lat: 52.52, lng: 13.405 }, // Berlin
  IE: { lat: 53.3498, lng: -6.2603 }, // Dublin
  NL: { lat: 52.3676, lng: 4.9041 }, // Amsterdam
  FR: { lat: 48.8566, lng: 2.3522 }, // Paris
  IT: { lat: 41.9028, lng: 12.4964 }, // Rome
  ES: { lat: 40.4168, lng: -3.7038 }, // Madrid
  BE: { lat: 50.8503, lng: 4.3517 }, // Brussels
  SE: { lat: 59.3293, lng: 18.0686 }, // Stockholm
  NO: { lat: 59.9139, lng: 10.7522 }, // Oslo
  DK: { lat: 55.6761, lng: 12.5683 }, // Copenhagen
  CH: { lat: 47.3769, lng: 8.5417 }, // Zurich
  SA: { lat: 24.7136, lng: 46.6753 }, // Riyadh
  QA: { lat: 25.2854, lng: 51.531 }, // Doha
  AU: { lat: -33.8688, lng: 151.2093 }, // Sydney
  NZ: { lat: -36.8485, lng: 174.7633 }, // Auckland
  IN: { lat: 19.076, lng: 72.8777 }, // Mumbai
  SG: { lat: 1.3521, lng: 103.8198 }, // Singapore
  GH: { lat: 5.6037, lng: -0.187 }, // Accra
};
