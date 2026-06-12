import type { Bounds } from "@/lib/api/buildings";
import { KAMPALA_BOUNDS } from "@/lib/api/buildings";
import {
  EXPLORE_CITY_RADIUS_DEG,
  EXPLORE_NEAR_ME_RADIUS_DEG,
  EXPLORE_NEIGHBORHOOD_RADIUS_DEG,
} from "@/lib/maps/config";
import {
  distanceKm,
  formatDistanceKm,
  isInUganda,
  type GeoPoint,
} from "@/lib/geo/uganda";

export type SearchAreaPreset = {
  value: string;
  label: string;
  center: { lat: number; lng: number };
  bounds: Bounds;
  /** ISO country this area belongs to (supply market). */
  country: string;
  kind?: "region" | "district" | "city" | "neighborhood";
};

/** Seeded catalog from GET /geo/places, merged into resolveSearchArea at runtime. */
let runtimeAreaPresets: SearchAreaPreset[] = [];

export function setRuntimeAreaPresets(presets: SearchAreaPreset[]): void {
  runtimeAreaPresets = presets;
}

export function geoPlacesToPresets(
  places: Array<{
    countryCode: string;
    kind: "region" | "district" | "city" | "neighborhood";
    name: string;
    slug: string;
    center: { lat: number; lng: number };
    bounds: Bounds;
  }>,
): SearchAreaPreset[] {
  return places.map((place) => ({
    value: place.slug,
    label: place.name,
    country: place.countryCode,
    center: place.center,
    bounds: place.bounds,
    kind: place.kind,
  }));
}

function allResolvablePresets(): SearchAreaPreset[] {
  if (runtimeAreaPresets.length === 0) return ALL_AREA_PRESETS;
  const staticByValue = new Map(
    ALL_AREA_PRESETS.map((preset) => [preset.value.toLowerCase(), preset]),
  );
  for (const preset of runtimeAreaPresets) {
    staticByValue.set(preset.value.toLowerCase(), preset);
  }
  return [...staticByValue.values()];
}

/**
 * Countries where PlotPin currently has listing supply (inventory on the map).
 * Browse/explore works globally via geo_places; only supply markets show homes.
 */
export const SUPPLY_MARKET_CODES = ["UG"] as const;
export type SupplyMarketCode = (typeof SUPPLY_MARKET_CODES)[number];

const SUPPLY_MARKET_NAMES: Record<string, string> = {
  UG: "Uganda",
};

export function isSupplyMarket(code: string | null | undefined): boolean {
  if (!code) return false;
  return (SUPPLY_MARKET_CODES as readonly string[]).includes(
    code.trim().toUpperCase(),
  );
}

export function supplyMarketName(code: string): string {
  return SUPPLY_MARKET_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

/** Human label for all supply markets, e.g. "Uganda" (or "Uganda & Kenya"). */
export function supplyMarketsLabel(): string {
  const names = SUPPLY_MARKET_CODES.map((code) => supplyMarketName(code));
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

const DELTA = EXPLORE_NEIGHBORHOOD_RADIUS_DEG;
const CITY_DELTA = EXPLORE_CITY_RADIUS_DEG;
const NEARBY_RADIUS_KM = 22;

export function boundsAround(
  lat: number,
  lng: number,
  delta = DELTA,
): Bounds {
  return {
    north: lat + delta,
    south: lat - delta,
    east: lng + delta,
    west: lng - delta,
  };
}

/** Major towns, map viewport jump (not a text filter on the API). */
export const UGANDA_CITY_PRESETS: SearchAreaPreset[] = [
  { value: "Jinja", label: "Jinja", country: "UG", center: { lat: 0.4244, lng: 33.2041 }, bounds: boundsAround(0.4244, 33.2041, CITY_DELTA) },
  { value: "Bugembe", label: "Bugembe", country: "UG", center: { lat: 0.4661, lng: 33.2334 }, bounds: boundsAround(0.4661, 33.2334, CITY_DELTA) },
  { value: "Entebbe", label: "Entebbe", country: "UG", center: { lat: 0.0512, lng: 32.4634 }, bounds: boundsAround(0.0512, 32.4634, CITY_DELTA) },
  { value: "Wakiso", label: "Wakiso", country: "UG", center: { lat: 0.4044, lng: 32.4594 }, bounds: boundsAround(0.4044, 32.4594, CITY_DELTA) },
  { value: "Mukono", label: "Mukono", country: "UG", center: { lat: 0.3533, lng: 32.7553 }, bounds: boundsAround(0.3533, 32.7553, CITY_DELTA) },
  { value: "Mbarara", label: "Mbarara", country: "UG", center: { lat: -0.6167, lng: 30.65 }, bounds: boundsAround(-0.6167, 30.65, CITY_DELTA) },
  { value: "Gulu", label: "Gulu", country: "UG", center: { lat: 2.7746, lng: 32.298 }, bounds: boundsAround(2.7746, 32.298, CITY_DELTA) },
];

/** Kampala neighbourhoods, extend as coverage grows. */
export const AREA_PRESETS: SearchAreaPreset[] = [
  { value: "Namuwongo", label: "Namuwongo", country: "UG", center: { lat: 0.308, lng: 32.612 }, bounds: boundsAround(0.308, 32.612) },
  { value: "Nakasero", label: "Nakasero", country: "UG", center: { lat: 0.328, lng: 32.588 }, bounds: boundsAround(0.328, 32.588) },
  { value: "Ntinda", label: "Ntinda", country: "UG", center: { lat: 0.352, lng: 32.613 }, bounds: boundsAround(0.352, 32.613) },
  { value: "Kololo", label: "Kololo", country: "UG", center: { lat: 0.331, lng: 32.595 }, bounds: boundsAround(0.331, 32.595) },
  { value: "Bugolobi", label: "Bugolobi", country: "UG", center: { lat: 0.315, lng: 32.61 }, bounds: boundsAround(0.315, 32.61) },
  { value: "Muyenga", label: "Muyenga", country: "UG", center: { lat: 0.295, lng: 32.605 }, bounds: boundsAround(0.295, 32.605) },
  { value: "Bukoto", label: "Bukoto", country: "UG", center: { lat: 0.358, lng: 32.598 }, bounds: boundsAround(0.358, 32.598) },
  { value: "Naguru", label: "Naguru", country: "UG", center: { lat: 0.338, lng: 32.608 }, bounds: boundsAround(0.338, 32.608) },
  { value: "Kabalagala", label: "Kabalagala", country: "UG", center: { lat: 0.285, lng: 32.585 }, bounds: boundsAround(0.285, 32.585) },
  { value: "Makindye", label: "Makindye", country: "UG", center: { lat: 0.278, lng: 32.575 }, bounds: boundsAround(0.278, 32.575) },
  { value: "Wandegeya", label: "Wandegeya", country: "UG", center: { lat: 0.345, lng: 32.568 }, bounds: boundsAround(0.345, 32.568) },
  { value: "Lubaga", label: "Lubaga", country: "UG", center: { lat: 0.302, lng: 32.552 }, bounds: boundsAround(0.302, 32.552) },
  { value: "Kasubi", label: "Kasubi", country: "UG", center: { lat: 0.318, lng: 32.538 }, bounds: boundsAround(0.318, 32.538) },
  { value: "Nateete", label: "Nateete", country: "UG", center: { lat: 0.305, lng: 32.528 }, bounds: boundsAround(0.305, 32.528) },
  { value: "Naalya", label: "Naalya", country: "UG", center: { lat: 0.368, lng: 32.625 }, bounds: boundsAround(0.368, 32.625) },
  { value: "Kyanja", label: "Kyanja", country: "UG", center: { lat: 0.385, lng: 32.615 }, bounds: boundsAround(0.385, 32.615) },
  { value: "Munyonyo", label: "Munyonyo", country: "UG", center: { lat: 0.268, lng: 32.615 }, bounds: boundsAround(0.268, 32.615) },
  { value: "Bunga", label: "Bunga", country: "UG", center: { lat: 0.278, lng: 32.618 }, bounds: boundsAround(0.278, 32.618) },
  { value: "Kansanga", label: "Kansanga", country: "UG", center: { lat: 0.288, lng: 32.6 }, bounds: boundsAround(0.288, 32.6) },
  { value: "Kampala Central Division", label: "Central Kampala", country: "UG", center: { lat: 0.315, lng: 32.582 }, bounds: boundsAround(0.315, 32.582) },
];

function cityPreset(
  label: string,
  country: string,
  lat: number,
  lng: number,
): SearchAreaPreset {
  return {
    value: label,
    label,
    country,
    center: { lat, lng },
    bounds: boundsAround(lat, lng, CITY_DELTA),
  };
}

/**
 * Major-city quick-jumps per market, keyed by ISO country. Lets viewers explore
 * the map in their own region instead of seeing another country's place names.
 * These are navigation jumps (not supply), actual listings live in
 * SUPPLY_MARKET_CODES. Extend as the product enters more markets.
 */
export const WORLD_CITY_PRESETS: Record<string, SearchAreaPreset[]> = {
  GB: [
    cityPreset("London", "GB", 51.5074, -0.1278),
    cityPreset("Manchester", "GB", 53.4808, -2.2426),
    cityPreset("Birmingham", "GB", 52.4862, -1.8904),
    cityPreset("Leeds", "GB", 53.8008, -1.5491),
    cityPreset("Glasgow", "GB", 55.8642, -4.2518),
    cityPreset("Bristol", "GB", 51.4545, -2.5879),
  ],
  US: [
    cityPreset("New York", "US", 40.7128, -74.006),
    cityPreset("Los Angeles", "US", 34.0522, -118.2437),
    cityPreset("Chicago", "US", 41.8781, -87.6298),
    cityPreset("Houston", "US", 29.7604, -95.3698),
    cityPreset("Atlanta", "US", 33.749, -84.388),
    cityPreset("Boston", "US", 42.3601, -71.0589),
  ],
  CA: [
    cityPreset("Toronto", "CA", 43.6532, -79.3832),
    cityPreset("Vancouver", "CA", 49.2827, -123.1207),
    cityPreset("Montreal", "CA", 45.5019, -73.5674),
    cityPreset("Calgary", "CA", 51.0447, -114.0719),
    cityPreset("Ottawa", "CA", 45.4215, -75.6972),
  ],
  IE: [
    cityPreset("Dublin", "IE", 53.3498, -6.2603),
    cityPreset("Cork", "IE", 51.8985, -8.4756),
    cityPreset("Galway", "IE", 53.2707, -9.0568),
  ],
  DE: [
    cityPreset("Berlin", "DE", 52.52, 13.405),
    cityPreset("Munich", "DE", 48.1351, 11.582),
    cityPreset("Frankfurt", "DE", 50.1109, 8.6821),
    cityPreset("Hamburg", "DE", 53.5511, 9.9937),
  ],
  NL: [
    cityPreset("Amsterdam", "NL", 52.3676, 4.9041),
    cityPreset("Rotterdam", "NL", 51.9244, 4.4777),
    cityPreset("The Hague", "NL", 52.0705, 4.3007),
  ],
  FR: [
    cityPreset("Paris", "FR", 48.8566, 2.3522),
    cityPreset("Lyon", "FR", 45.764, 4.8357),
    cityPreset("Marseille", "FR", 43.2965, 5.3698),
  ],
  IT: [
    cityPreset("Rome", "IT", 41.9028, 12.4964),
    cityPreset("Milan", "IT", 45.4642, 9.19),
    cityPreset("Naples", "IT", 40.8518, 14.2681),
  ],
  ES: [
    cityPreset("Madrid", "ES", 40.4168, -3.7038),
    cityPreset("Barcelona", "ES", 41.3851, 2.1734),
    cityPreset("Valencia", "ES", 39.4699, -0.3763),
  ],
  BE: [
    cityPreset("Brussels", "BE", 50.8503, 4.3517),
    cityPreset("Antwerp", "BE", 51.2194, 4.4025),
  ],
  SE: [
    cityPreset("Stockholm", "SE", 59.3293, 18.0686),
    cityPreset("Gothenburg", "SE", 57.7089, 11.9746),
  ],
  NO: [
    cityPreset("Oslo", "NO", 59.9139, 10.7522),
    cityPreset("Bergen", "NO", 60.3913, 5.3221),
  ],
  DK: [
    cityPreset("Copenhagen", "DK", 55.6761, 12.5683),
    cityPreset("Aarhus", "DK", 56.1629, 10.2039),
  ],
  CH: [
    cityPreset("Zurich", "CH", 47.3769, 8.5417),
    cityPreset("Geneva", "CH", 46.2044, 6.1432),
  ],
  AE: [
    cityPreset("Dubai", "AE", 25.2048, 55.2708),
    cityPreset("Abu Dhabi", "AE", 24.4539, 54.3773),
    cityPreset("Sharjah", "AE", 25.3463, 55.4209),
  ],
  SA: [
    cityPreset("Riyadh", "SA", 24.7136, 46.6753),
    cityPreset("Jeddah", "SA", 21.4858, 39.1925),
  ],
  QA: [cityPreset("Doha", "QA", 25.2854, 51.531)],
  ZA: [
    cityPreset("Johannesburg", "ZA", -26.2041, 28.0473),
    cityPreset("Cape Town", "ZA", -33.9249, 18.4241),
    cityPreset("Durban", "ZA", -29.8587, 31.0218),
    cityPreset("Pretoria", "ZA", -25.7479, 28.2293),
  ],
  NG: [
    cityPreset("Lagos", "NG", 6.5244, 3.3792),
    cityPreset("Abuja", "NG", 9.0765, 7.3986),
    cityPreset("Port Harcourt", "NG", 4.8156, 7.0498),
  ],
  KE: [
    cityPreset("Nairobi", "KE", -1.2921, 36.8219),
    cityPreset("Mombasa", "KE", -4.0435, 39.6682),
  ],
  TZ: [
    cityPreset("Dar es Salaam", "TZ", -6.7924, 39.2083),
    cityPreset("Dodoma", "TZ", -6.163, 35.7516),
  ],
  RW: [cityPreset("Kigali", "RW", -1.9403, 30.0589)],
  GH: [
    cityPreset("Accra", "GH", 5.6037, -0.187),
    cityPreset("Kumasi", "GH", 6.6906, -1.6163),
  ],
  IN: [
    cityPreset("Mumbai", "IN", 19.076, 72.8777),
    cityPreset("Delhi", "IN", 28.7041, 77.1025),
    cityPreset("Bengaluru", "IN", 12.9716, 77.5946),
    cityPreset("Hyderabad", "IN", 17.385, 78.4867),
  ],
  SG: [cityPreset("Singapore", "SG", 1.3521, 103.8198)],
  AU: [
    cityPreset("Sydney", "AU", -33.8688, 151.2093),
    cityPreset("Melbourne", "AU", -37.8136, 144.9631),
    cityPreset("Brisbane", "AU", -27.4698, 153.0251),
    cityPreset("Perth", "AU", -31.9505, 115.8605),
  ],
  NZ: [
    cityPreset("Auckland", "NZ", -36.8485, 174.7633),
    cityPreset("Wellington", "NZ", -41.2865, 174.7762),
  ],
};

/** City quick-jumps for a viewer's region (empty when we have none curated). */
export function cityPresetsForCountry(
  countryCode: string | null | undefined,
): SearchAreaPreset[] {
  if (!countryCode) return [];
  return WORLD_CITY_PRESETS[countryCode.trim().toUpperCase()] ?? [];
}

/** Value that jumps to the primary supply hub (where inventory is). */
export const SUPPLY_HUB_VALUE = "kampala-central";

export const ALL_AREA_PRESETS: SearchAreaPreset[] = [
  ...UGANDA_CITY_PRESETS,
  ...AREA_PRESETS,
  ...Object.values(WORLD_CITY_PRESETS).flat(),
];

export type AreaSearchOption = {
  value: string;
  label: string;
  distanceKm?: number;
  section?: "nearby" | "cities" | "kampala" | "all" | "supply" | "recent" | "regions" | "areas";
};

function rankPresetEntries(
  presets: SearchAreaPreset[],
  userLocation: GeoPoint | null,
): Array<{ preset: SearchAreaPreset; distanceKm?: number }> {
  return presets
    .map((preset) => ({
      preset,
      distanceKm: userLocation
        ? distanceKm(userLocation, preset.center)
        : undefined,
    }))
    .sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return a.preset.label.localeCompare(b.preset.label);
    });
}

export function rankAreaOptions(
  userLocation: GeoPoint | null,
  inUganda: boolean,
  viewerCountryCode?: string,
  seededPresets?: SearchAreaPreset[],
): AreaSearchOption[] {
  const seeded = seededPresets?.length ? seededPresets : [];
  const useSeeded = seeded.length > 0;

  // Viewers outside supply markets get their own region's places to explore the
  // map, plus a single clear jump to where inventory actually is.
  if (viewerCountryCode && !isSupplyMarket(viewerCountryCode)) {
    const options: AreaSearchOption[] = [
      { value: "", label: "Browse map area", section: "all" },
    ];

    if (useSeeded) {
      for (const entry of rankPresetEntries(
        seeded.filter((p) => p.kind === "region"),
        userLocation,
      )) {
        options.push({
          value: entry.preset.value,
          label: entry.preset.label,
          distanceKm: entry.distanceKm,
          section: "regions",
        });
      }
      for (const entry of rankPresetEntries(
        seeded.filter((p) => p.kind === "city"),
        userLocation,
      )) {
        options.push({
          value: entry.preset.value,
          label: entry.preset.label,
          distanceKm: entry.distanceKm,
          section: "cities",
        });
      }
      for (const entry of rankPresetEntries(
        seeded.filter((p) => p.kind === "district"),
        userLocation,
      )) {
        options.push({
          value: entry.preset.value,
          label: entry.preset.label,
          distanceKm: entry.distanceKm,
          section: "areas",
        });
      }
    } else {
      const regionCities = [...cityPresetsForCountry(viewerCountryCode)]
        .map((preset) => ({
          preset,
          distanceKm: userLocation
            ? distanceKm(userLocation, preset.center)
            : undefined,
        }))
        .sort((a, b) => {
          if (a.distanceKm != null && b.distanceKm != null) {
            return a.distanceKm - b.distanceKm;
          }
          return a.preset.label.localeCompare(b.preset.label);
        });

      for (const entry of regionCities) {
        options.push({
          value: entry.preset.value,
          label: entry.preset.label,
          distanceKm: entry.distanceKm,
          section: "cities",
        });
      }
    }

    options.push({
      value: SUPPLY_HUB_VALUE,
      label: `Explore ${supplyMarketsLabel()} listings`,
      section: "supply",
    });

    return options;
  }

  if (useSeeded) {
    const options: AreaSearchOption[] = [
      { value: "", label: "Browse map area", section: "all" },
    ];

    for (const entry of rankPresetEntries(
      seeded.filter((p) => p.kind === "city"),
      userLocation,
    )) {
      options.push({
        value: entry.preset.value,
        label: entry.preset.label,
        section: "cities",
      });
    }

    const neighborhoods = rankPresetEntries(
      seeded.filter((p) => p.kind === "neighborhood" || p.kind === "district"),
      userLocation,
    );

    for (const entry of neighborhoods) {
      const nearby =
        inUganda &&
        userLocation &&
        entry.distanceKm != null &&
        entry.distanceKm <= NEARBY_RADIUS_KM;

      options.push({
        value: entry.preset.value,
        label: entry.preset.label,
        distanceKm: entry.distanceKm,
        section: nearby ? "nearby" : "kampala",
      });
    }

    return options;
  }

  const rankedKampala = [...AREA_PRESETS]
    .map((preset) => ({
      preset,
      distanceKm: userLocation
        ? distanceKm(userLocation, preset.center)
        : undefined,
    }))
    .sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return a.preset.label.localeCompare(b.preset.label);
    });

  const rankedCities = [...UGANDA_CITY_PRESETS]
    .map((preset) => ({
      preset,
      distanceKm: userLocation
        ? distanceKm(userLocation, preset.center)
        : undefined,
    }))
    .sort((a, b) => a.preset.label.localeCompare(b.preset.label));

  const options: AreaSearchOption[] = [
    { value: "", label: "Browse map area", section: "all" },
  ];

  for (const entry of rankedCities) {
    options.push({
      value: entry.preset.value,
      label: entry.preset.label,
      section: "cities",
    });
  }

  for (const entry of rankedKampala) {
    const nearby =
      inUganda &&
      userLocation &&
      entry.distanceKm != null &&
      entry.distanceKm <= NEARBY_RADIUS_KM;

    options.push({
      value: entry.preset.value,
      label: entry.preset.label,
      distanceKm: entry.distanceKm,
      section: nearby ? "nearby" : "kampala",
    });
  }

  return options;
}

export function filterAreaOptions(
  options: AreaSearchOption[],
  query: string,
): AreaSearchOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;

  return options.filter((option) => {
    if (!option.value) {
      return (
        "browse map".includes(normalized) ||
        "map area".includes(normalized) ||
        normalized.length <= 2
      );
    }
    return (
      option.label.toLowerCase().includes(normalized) ||
      option.value.toLowerCase().includes(normalized)
    );
  });
}

export function resolveSearchArea(query: string): SearchAreaPreset | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  return (
    allResolvablePresets().find((preset) => {
      const value = preset.value.toLowerCase();
      const label = preset.label.toLowerCase();
      return (
        value === normalized ||
        label === normalized ||
        value.includes(normalized) ||
        label.includes(normalized) ||
        normalized.includes(label)
      );
    }) ?? null
  );
}

export function searchAreaLabel(query: string): string | null {
  if (!query.trim()) return null;
  return resolveSearchArea(query)?.label ?? query.trim();
}

export function getBoundsForSearch(query: string): Bounds {
  const preset = resolveSearchArea(query);
  if (preset) return preset.bounds;

  return KAMPALA_BOUNDS;
}

export function getMapFocusForSearch(
  query: string,
  userLocation?: GeoPoint | null,
): {
  bounds: Bounds;
  center: { lat: number; lng: number };
} | null {
  const preset = resolveSearchArea(query);
  if (preset) {
    return { bounds: preset.bounds, center: preset.center };
  }

  if (userLocation && isInUganda(userLocation.lat, userLocation.lng)) {
    return {
      bounds: boundsAround(
        userLocation.lat,
        userLocation.lng,
        EXPLORE_NEAR_ME_RADIUS_DEG,
      ),
      center: userLocation,
    };
  }

  return null;
}

export { formatDistanceKm };
