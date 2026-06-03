import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type CountryRow = {
  code: string;
  name: string;
  currency: string;
  display_locale: string;
  map_center_lat: number | null;
  map_center_lng: number | null;
  map_bounds_north: number | null;
  map_bounds_south: number | null;
  map_bounds_east: number | null;
  map_bounds_west: number | null;
  default_map_zoom: number;
};

export type CountryCatalogEntry = {
  code: string;
  name: string;
  currency: string;
  displayLocale: string;
  mapCenter: { lat: number; lng: number } | null;
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  defaultMapZoom: number;
};

function mapCountry(row: CountryRow): CountryCatalogEntry {
  const hasBounds =
    row.map_bounds_north != null &&
    row.map_bounds_south != null &&
    row.map_bounds_east != null &&
    row.map_bounds_west != null;

  return {
    code: row.code,
    name: row.name,
    currency: row.currency,
    displayLocale: row.display_locale,
    mapCenter:
      row.map_center_lat != null && row.map_center_lng != null
        ? { lat: row.map_center_lat, lng: row.map_center_lng }
        : null,
    mapBounds: hasBounds
      ? {
          north: row.map_bounds_north as number,
          south: row.map_bounds_south as number,
          east: row.map_bounds_east as number,
          west: row.map_bounds_west as number,
        }
      : null,
    defaultMapZoom: row.default_map_zoom,
  };
}

@Injectable()
export class CountriesService {
  constructor(private readonly db: DatabaseService) {}

  async listActive(): Promise<CountryCatalogEntry[]> {
    const { rows } = await this.db.query<CountryRow>(
      `SELECT code, name, currency, display_locale,
              map_center_lat, map_center_lng,
              map_bounds_north, map_bounds_south, map_bounds_east, map_bounds_west,
              default_map_zoom
       FROM countries
       WHERE is_active = TRUE
       ORDER BY code ASC`,
    );
    return rows.map(mapCountry);
  }

  async findByCode(code: string): Promise<CountryCatalogEntry | null> {
    const { rows } = await this.db.query<CountryRow>(
      `SELECT code, name, currency, display_locale,
              map_center_lat, map_center_lng,
              map_bounds_north, map_bounds_south, map_bounds_east, map_bounds_west,
              default_map_zoom
       FROM countries
       WHERE code = $1 AND is_active = TRUE`,
      [code.toUpperCase()],
    );
    return rows[0] ? mapCountry(rows[0]) : null;
  }
}
