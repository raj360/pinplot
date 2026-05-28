import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  BuildingBoundsQueryDto,
  CreateBuildingDto,
  CreateUnitDto,
  RegisterImageDto,
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
      sql += ` AND (b.city ILIKE $${params.length} OR b.district ILIKE $${params.length})`;
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
    return rows.map((row) => this.toSummary(row));
  }

  async findByLandlord(landlordId: string) {
    const { rows } = await this.db.query(
      `SELECT b.*,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count
       FROM buildings b
       LEFT JOIN units u ON u.building_id = b.id
       WHERE b.landlord_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [landlordId],
    );
    return rows.map((b: Record<string, unknown>) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      district: b.district,
      isVerified: b.is_verified,
      totalUnits: b.total_units,
      availableUnitCount: Number(b.available_unit_count ?? 0),
      createdAt: b.created_at,
    }));
  }

  async findPendingVerification() {
    const { rows } = await this.db.query(
      `SELECT b.id, b.name, b.city, b.district, b.created_at, b.landlord_id,
              p.first_name, p.last_name, p.phone
       FROM buildings b
       LEFT JOIN profiles p ON p.id = b.landlord_id
       WHERE b.is_verified = FALSE
       ORDER BY b.created_at ASC`,
    );
    return rows;
  }

  async findById(id: string, includeExact = false) {
    const { rows } = await this.db.query(
      `SELECT
        b.*,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
        MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from
      FROM buildings b
      LEFT JOIN units u ON u.building_id = b.id
      WHERE b.id = $1 AND ($2::boolean OR b.is_verified = TRUE)
      GROUP BY b.id`,
      [id, includeExact],
    );

    if (!rows[0]) throw new NotFoundException("Building not found");

    const building = rows[0] as Record<string, unknown>;
    const units = await this.fetchUnits(id);

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
      coverImageUrl: building.cover_image_path,
      availableUnitCount: Number(building.available_unit_count),
      rentFrom: building.rent_from ? Number(building.rent_from) : null,
      units,
    };
  }

  async create(landlordId: string, dto: CreateBuildingDto) {
    await this.db.query("BEGIN");
    try {
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
      const building = rows[0] as { id: string };

      if (dto.units?.length) {
        for (const unit of dto.units) {
          await this.insertUnit(building.id, unit);
        }
      }

      await this.db.query("COMMIT");
      return this.findById(building.id, true);
    } catch (err) {
      await this.db.query("ROLLBACK");
      throw err;
    }
  }

  async addUnit(buildingId: string, landlordId: string, dto: CreateUnitDto) {
    await this.assertLandlord(buildingId, landlordId);
    const row = await this.insertUnit(buildingId, dto);
    return row;
  }

  async setVerified(buildingId: string, verified: boolean) {
    const { rows } = await this.db.query(
      `UPDATE buildings SET is_verified = $2, updated_at = NOW()
       WHERE id = $1 RETURNING id, name, is_verified`,
      [buildingId, verified],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");
    return rows[0];
  }

  async registerImage(
    buildingId: string,
    landlordId: string,
    dto: RegisterImageDto,
  ) {
    await this.assertLandlord(buildingId, landlordId);

    if (dto.isPrimary) {
      await this.db.query(
        "UPDATE unit_images SET is_primary = FALSE WHERE building_id = $1",
        [buildingId],
      );
      await this.db.query(
        "UPDATE buildings SET cover_image_path = $2, updated_at = NOW() WHERE id = $1",
        [buildingId, dto.storagePath],
      );
    }

    const { rows } = await this.db.query(
      `INSERT INTO unit_images (building_id, storage_path, is_primary, sort_order)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM unit_images WHERE building_id = $1))
       RETURNING *`,
      [buildingId, dto.storagePath, dto.isPrimary ?? false],
    );
    return rows[0];
  }

  private async insertUnit(buildingId: string, dto: CreateUnitDto) {
    const { rows } = await this.db.query(
      `INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, status)
       VALUES ($1,$2,$3,$4,$5,'UNAVAILABLE') RETURNING *`,
      [buildingId, dto.unitNumber, dto.bedrooms, dto.bathrooms, dto.rentAmount],
    );
    return rows[0];
  }

  private async fetchUnits(buildingId: string) {
    const { rows } = await this.db.query(
      `SELECT id, unit_number, bedrooms, bathrooms, rent_amount, currency, status
       FROM units WHERE building_id = $1 ORDER BY unit_number`,
      [buildingId],
    );
    return rows.map((u: Record<string, unknown>) => ({
      id: u.id,
      unitNumber: u.unit_number,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      rentAmount: u.rent_amount,
      currency: u.currency,
      status: u.status,
    }));
  }

  private toSummary(row: BuildingRow) {
    return {
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
    };
  }

  private async assertLandlord(buildingId: string, landlordId: string) {
    const { rows } = await this.db.query(
      "SELECT id FROM buildings WHERE id = $1 AND landlord_id = $2",
      [buildingId, landlordId],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");
  }
}
