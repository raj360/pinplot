import type { BuildingBoundsQueryDto } from "./dto/building.dto";

/** PostGIS viewport filter — uses buildings.location GIST index ($1=south $2=west $3=north $4=east). */
export const EXPLORE_BOUNDS_SQL = `
  AND b.location IS NOT NULL
  AND ST_Intersects(
    b.location,
    ST_MakeEnvelope($2, $1, $4, $3, 4326)::geography
  )`;

const BOUNDS_PRECISION = 5;

function roundCoord(value: number): number {
  const factor = 10 ** BOUNDS_PRECISION;
  return Math.round(value * factor) / factor;
}

/** Stable cache key for anonymous explore searches (rounded bounds + filters). */
export function exploreSearchCacheKey(query: BuildingBoundsQueryDto): string {
  return JSON.stringify({
    n: roundCoord(query.north),
    s: roundCoord(query.south),
    e: roundCoord(query.east),
    w: roundCoord(query.west),
    city: query.city?.trim().toLowerCase() ?? "",
    countryCode: query.countryCode?.trim().toUpperCase() ?? "",
    minRent: query.minRent ?? null,
    maxRent: query.maxRent ?? null,
    bedrooms: query.bedrooms ?? null,
    bathrooms: query.bathrooms ?? null,
    buildingType: query.buildingType ?? "",
  });
}
