export type AddressHints = {
  city: string;
  /** Finest area name — neighborhood / sublocality (e.g. Kamwokya). */
  district: string;
  /** Street-level hint for placeholder only — never auto-saved as exact address. */
  addressHint: string;
  /** Full hierarchy for display, e.g. "Kamwokya · Kawempe Division · Kampala". */
  areaLabel: string;
  /** Ordered zones from finest to coarsest (excluding city). */
  zones: string[];
  street?: string;
  landmark?: string;
  /** ISO 3166-1 alpha-2 country of the pin (e.g. "UG", "NG"), if resolved. */
  countryCode?: string;
};

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
) {
  return components.find((c) => c.types.includes(type))?.long_name;
}

function getComponentShort(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
) {
  return components.find((c) => c.types.includes(type))?.short_name;
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isLikelyZoneName(part: string): boolean {
  const lower = part.toLowerCase();
  if (lower === "uganda" || lower.includes("central region")) return false;
  if (/unnamed|^\d|^[a-z0-9]{4,}\+/i.test(part)) return false;
  if (/\b(road|street|avenue|lane|close|drive|way|plot)\b/i.test(part)) {
    return false;
  }
  return part.trim().length >= 3;
}

/** Finest area label for district field — excludes city and country. */
export function resolveDistrictFromParts(
  city: string,
  zones: string[],
  areaLabel: string,
): string {
  if (zones[0]) return zones[0];

  const cityLower = city.trim().toLowerCase();
  const fromLabel = areaLabel
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean)
    .find((part) => part.toLowerCase() !== cityLower);

  return fromLabel ?? "";
}

/** City for listing — prefer locality, fall back to coarsest area label part. */
export function resolveCityFromHints(hints: AddressHints): string {
  if (hints.city.trim()) return hints.city.trim();

  const parts = hints.areaLabel
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts[parts.length - 1] ?? "";
}

/** District / area for listing — never leave stale value when geocode has no division. */
export function resolveDistrictFromHints(hints: AddressHints): string {
  return resolveDistrictFromParts(hints.city, hints.zones, hints.areaLabel);
}

function supplementZones(
  formattedAddress: string,
  city: string,
  zones: string[],
): string[] {
  const known = new Set([
    city.toLowerCase(),
    ...zones.map((z) => z.toLowerCase()),
    "uganda",
  ]);

  const extras = formattedAddress
    .split(",")
    .map((part) => part.trim())
    .filter(
      (part) =>
        isLikelyZoneName(part) && !known.has(part.toLowerCase()),
    );

  return uniqueNames([...zones, ...extras]);
}

/** Parse Google Geocoder result into PlotPin address fields. */
export function parseGeocoderResult(
  result: google.maps.GeocoderResult,
): AddressHints {
  const components = result.address_components;
  const get = (type: string) => getComponent(components, type);

  const city =
    get("locality") ||
    get("administrative_area_level_2") ||
    get("administrative_area_level_1") ||
    "";

  /** Kampala-style hierarchy: neighborhood → sublocality levels → division. */
  const zoneTypes = [
    "neighborhood",
    "sublocality_level_2",
    "sublocality_level_1",
    "sublocality",
    "administrative_area_level_4",
    "administrative_area_level_3",
  ] as const;

  let zones = uniqueNames(
    zoneTypes
      .map((type) => get(type))
      .filter((name): name is string => Boolean(name))
      .filter((name) => name.toLowerCase() !== city.toLowerCase()),
  );

  zones = supplementZones(result.formatted_address, city, zones);

  const street = get("route");
  const streetNumber = get("street_number");
  const landmark =
    get("establishment") ||
    get("point_of_interest") ||
    get("premise") ||
    undefined;

  const streetLine =
    streetNumber && street
      ? `${streetNumber} ${street}`
      : street || undefined;

  const addressHint = uniqueNames(
    [streetLine, landmark].filter((part): part is string => Boolean(part)),
  ).join(", ");

  const areaLabel = uniqueNames([...zones, city]).join(" · ");

  const district = resolveDistrictFromParts(city, zones, areaLabel);

  const countryShort = getComponentShort(components, "country");
  const countryCode = countryShort
    ? countryShort.trim().toUpperCase()
    : undefined;

  return {
    city,
    district,
    addressHint,
    areaLabel,
    zones,
    street: street || undefined,
    landmark,
    countryCode,
  };
}

export function isYouTubeUrl(url: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url.trim());
}

export function normalizeYouTubeUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!isYouTubeUrl(trimmed)) {
    throw new Error("Please paste a YouTube link only (youtube.com or youtu.be).");
  }
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}
