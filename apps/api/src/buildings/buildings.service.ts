import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  BuildingBoundsQueryDto,
  CreateBuildingDto,
  CreateUnitDto,
} from "./dto/building.dto";

type BuildingRow = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  country_code: string;
  approximate_lat: number;
  approximate_lng: number;
  total_units: number;
  is_verified: boolean;
  is_featured: boolean;
  available_unit_count: string;
  rent_from: string | null;
};

@Injectable()
export class BuildingsService {
  constructor(private readonly db: DatabaseService) {}

  async findInBounds(query: BuildingBoundsQueryDto) {
    const params: unknown[] = [
      query.south,
      query.west,
      query.north,
      query.east,
    ];
    let sql = `
      SELECT
        b.id,
        b.name,
        b.city,
        b.district,
        b.country_code,
        b.approximate_lat,
        b.approximate_lng,
        b.total_units,
        b.is_verified,
        b.is_featured,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
        MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from
      FROM buildings b
      LEFT JOIN units u ON u.building_id = b.id
      WHERE b.is_verified = TRUE
        AND b.approximate_lat BETWEEN $1 AND $3
        AND b.approximate_lng BETWEEN $2 AND $4
    `;

    if (query.city) {
      params.push(`%${query.city}%`);
      sql += ` AND b.city ILIKE $${params.length}`;
    }

    sql += `
      GROUP BY b.id
      HAVING COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') > 0
    `;

    if (query.minRent != null) {
      params.push(query.minRent);
      sql += ` AND MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') >= $${params.length}`;
    }

    if (query.maxRent != null) {
      params.push(query.maxRent);
      sql += ` AND MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') <= $${params.length}`;
    }

    if (query.bedrooms != null) {
      params.push(query.bedrooms);
      sql += ` AND EXISTS (
        SELECT 1 FROM units ux
        WHERE ux.building_id = b.id
          AND ux.status = 'AVAILABLE'
          AND ux.bedrooms >= $${params.length}
      )`;
    }

    sql += ` ORDER BY b.is_featured DESC, b.created_at DESC LIMIT 200`;

    const { rows } = await this.db.query<BuildingRow>(sql, params);

    return rows.map((row: BuildingRow) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      district: row.district,
      countryCode: row.country_code,
      approximateLat: row.approximate_lat,
      approximateLng: row.approximate_lng,
      totalUnits: row.total_units,
      isVerified: row.is_verified,
      isFeatured: row.is_featured,
      availableUnitCount: Number(row.available_unit_count),
      rentFrom: row.rent_from ? Number(row.rent_from) : null,
    }));
  }

  async findById(id: string, includeExact = false) {
    const { rows } = await this.db.query(
      `SELECT
        b.*,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
        MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from
      FROM buildings b
      LEFT JOIN units u ON u.building_id = b.id
      WHERE b.id = $1 AND b.is_verified = TRUE
      GROUP BY b.id`,
      [id],
    );

    if (!rows[0]) throw new NotFoundException("Building not found");

    const building = rows[0] as Record<string, unknown>;

    const { rows: units } = await this.db.query(
      `SELECT id, unit_number, bedrooms, bathrooms, rent_amount, currency, status
       FROM units WHERE building_id = $1 ORDER BY unit_number`,
      [id],
    );

    return {
      id: building.id,
      name: building.name,
      description: building.description,
      city: building.city,
      district: building.district,
      countryCode: building.country_code,
      approximateLat: building.approximate_lat,
      approximateLng: building.approximate_lng,
      exactAddress: includeExact ? building.exact_address : undefined,
      exactLat: includeExact ? building.exact_lat : undefined,
      exactLng: includeExact ? building.exact_lng : undefined,
      totalUnits: building.total_units,
      isVerified: building.is_verified,
      isFeatured: building.is_featured,
      availableUnitCount: Number(building.available_unit_count),
      rentFrom: building.rent_from ? Number(building.rent_from) : null,
      units: units.map((u: Record<string, unknown>) => ({
        id: u.id,
        unitNumber: u.unit_number,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        rentAmount: u.rent_amount,
        currency: u.currency,
        status: u.status,
      })),
    };
  }

  async create(landlordId: string, dto: CreateBuildingDto) {
    const { rows } = await this.db.query(
      `INSERT INTO buildings (
        landlord_id, name, description, city, district, country_code,
        approximate_lat, approximate_lng, exact_address, exact_lat, exact_lng, total_units, is_verified
      ) VALUES ($1,$2,$3,$4,$5,'UG',$6,$7,$8,$9,$10,$11,FALSE)
      RETURNING *`,
      [
        landlordId,
        dto.name,
        dto.description ?? null,
        dto.city,
        dto.district ?? null,
        dto.approximateLat,
        dto.approximateLng,
        dto.exactAddress ?? null,
        dto.exactLat ?? dto.approximateLat,
        dto.exactLng ?? dto.approximateLng,
        dto.totalUnits,
      ],
    );
    return rows[0];
  }

  async addUnit(buildingId: string, landlordId: string, dto: CreateUnitDto) {
    await this.assertLandlord(buildingId, landlordId);
    const { rows } = await this.db.query(
      `INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, status)
       VALUES ($1,$2,$3,$4,$5,'UNAVAILABLE') RETURNING *`,
      [buildingId, dto.unitNumber, dto.bedrooms, dto.bathrooms, dto.rentAmount],
    );
    return rows[0];
  }

  private async assertLandlord(buildingId: string, landlordId: string) {
    const { rows } = await this.db.query(
      "SELECT id FROM buildings WHERE id = $1 AND landlord_id = $2",
      [buildingId, landlordId],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");
  }
}
