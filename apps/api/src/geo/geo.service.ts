import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type GeoPlaceKind = "region" | "district" | "city" | "neighborhood";

export type GeoPlaceRow = {
  id: string;
  country_code: string;
  kind: GeoPlaceKind;
  name: string;
  slug: string;
  center_lat: number;
  center_lng: number;
  bounds_north: number;
  bounds_south: number;
  bounds_east: number;
  bounds_west: number;
  population: number | null;
  sort_order: number;
};

export type GeoPlaceEntry = {
  id: string;
  countryCode: string;
  kind: GeoPlaceKind;
  name: string;
  slug: string;
  center: { lat: number; lng: number };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  population: number | null;
};

function mapRow(row: GeoPlaceRow): GeoPlaceEntry {
  return {
    id: row.id,
    countryCode: row.country_code,
    kind: row.kind,
    name: row.name,
    slug: row.slug,
    center: { lat: row.center_lat, lng: row.center_lng },
    bounds: {
      north: row.bounds_north,
      south: row.bounds_south,
      east: row.bounds_east,
      west: row.bounds_west,
    },
    population: row.population,
  };
}

@Injectable()
export class GeoService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; rows: GeoPlaceEntry[] }
  >();
  private readonly cacheTtlMs = 60 * 60 * 1000;

  constructor(private readonly db: DatabaseService) {}

  private readCache(key: string): GeoPlaceEntry[] | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.rows;
  }

  private writeCache(key: string, rows: GeoPlaceEntry[]) {
    this.cache.set(key, { rows, expiresAt: Date.now() + this.cacheTtlMs });
  }

  async listPlaces(options: {
    countryCode: string;
    kind?: GeoPlaceKind;
    limit?: number;
  }): Promise<GeoPlaceEntry[]> {
    const country = options.countryCode.trim().toUpperCase();
    const limit = Math.min(Math.max(options.limit ?? 120, 1), 200);
    const cacheKey = `${country}:${options.kind ?? "*"}:${limit}`;
    const cached = this.readCache(cacheKey);
    if (cached) return cached;

    const { rows: countryRows } = await this.db.query(
      `SELECT 1 FROM countries WHERE code = $1 AND is_active = TRUE`,
      [country],
    );
    if (!countryRows[0]) {
      throw new NotFoundException(`Country ${country} is not in the catalog`);
    }

    const params: unknown[] = [country, limit];
    let kindFilter = "";
    if (options.kind) {
      params.splice(1, 0, options.kind);
      kindFilter = ` AND kind = $2`;
    }

    const limitParam = `$${params.length}`;

    const { rows } = await this.db.query<GeoPlaceRow>(
      `SELECT id, country_code, kind, name, slug,
              center_lat, center_lng,
              bounds_north, bounds_south, bounds_east, bounds_west,
              population, sort_order
       FROM geo_places
       WHERE country_code = $1${kindFilter}
       ORDER BY
         CASE kind
           WHEN 'neighborhood' THEN 1
           WHEN 'district' THEN 2
           WHEN 'city' THEN 3
           WHEN 'region' THEN 4
           ELSE 5
         END,
         sort_order DESC,
         population DESC NULLS LAST,
         name ASC
       LIMIT ${limitParam}`,
      params,
    );

    const mapped = rows.map(mapRow);
    this.writeCache(cacheKey, mapped);
    return mapped;
  }
}
