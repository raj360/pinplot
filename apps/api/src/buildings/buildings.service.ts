import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  jitterPublicMapCoords,
  publicMapCoords,
} from "../common/location-jitter";
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
  building_type: string;
  approximate_lat: number;
  approximate_lng: number;
  exact_lat: number | null;
  exact_lng: number | null;
  total_units: number;
  is_verified: boolean;
  is_featured: boolean;
  available_unit_count: string;
  rent_from: string | null;
  my_unlock_count?: string;
};

@Injectable()
export class BuildingsService {
  constructor(private readonly db: DatabaseService) {}

  async findInBounds(query: BuildingBoundsQueryDto, tenantId?: string) {
    const available = await this.queryAvailableInBounds(query);
    const withUnlocks = tenantId
      ? await this.attachMyUnlockCounts(available, tenantId)
      : available;

    if (!tenantId) {
      return withUnlocks.map((row) => this.toSummary(row));
    }

    const unlockedOnly = await this.queryUnlockedOnlyInBounds(query, tenantId);
    const seen = new Set(withUnlocks.map((row) => row.id));
    const merged = [
      ...withUnlocks,
      ...unlockedOnly.filter((row) => !seen.has(row.id)),
    ];

    return merged.map((row) => this.toSummary(row));
  }

  private async queryAvailableInBounds(query: BuildingBoundsQueryDto) {
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
        b.building_type,
        b.approximate_lat,
        b.approximate_lng,
        b.exact_lat,
        b.exact_lng,
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

    if (query.countryCode) {
      params.push(query.countryCode.toUpperCase());
      sql += ` AND b.country_code = $${params.length}`;
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

    if (query.bathrooms != null) {
      params.push(query.bathrooms);
      sql += ` AND EXISTS (
        SELECT 1 FROM units ux
        WHERE ux.building_id = b.id
          AND ux.status = 'AVAILABLE'
          AND ux.bathrooms >= $${params.length}
      )`;
    }

    if (query.buildingType) {
      params.push(query.buildingType);
      sql += ` AND b.building_type = $${params.length}::building_type`;
    }

    sql += ` ORDER BY b.is_featured DESC, b.created_at DESC LIMIT 200`;

    const { rows } = await this.db.query<BuildingRow>(sql, params);
    return rows;
  }

  private async queryUnlockedOnlyInBounds(
    query: BuildingBoundsQueryDto,
    tenantId: string,
  ) {
    const params: unknown[] = [
      query.south,
      query.west,
      query.north,
      query.east,
      tenantId,
    ];
    let sql = `
      SELECT
        b.id,
        b.name,
        b.city,
        b.district,
        b.country_code,
        b.building_type,
        b.approximate_lat,
        b.approximate_lng,
        b.exact_lat,
        b.exact_lng,
        b.total_units,
        b.is_verified,
        b.is_featured,
        0 AS available_unit_count,
        NULL AS rent_from,
        COUNT(DISTINCT uu.id) AS my_unlock_count
      FROM buildings b
      JOIN units u ON u.building_id = b.id
      JOIN unit_unlocks uu ON uu.unit_id = u.id
      WHERE b.is_verified = TRUE
        AND b.approximate_lat BETWEEN $1 AND $3
        AND b.approximate_lng BETWEEN $2 AND $4
        AND uu.tenant_id = $5
        AND uu.is_winner = TRUE
        AND (uu.expires_at IS NULL OR uu.expires_at > NOW())
    `;

    if (query.city) {
      params.push(`%${query.city}%`);
      sql += ` AND (b.city ILIKE $${params.length} OR b.district ILIKE $${params.length})`;
    }

    if (query.countryCode) {
      params.push(query.countryCode.toUpperCase());
      sql += ` AND b.country_code = $${params.length}`;
    }

    if (query.buildingType) {
      params.push(query.buildingType);
      sql += ` AND b.building_type = $${params.length}::building_type`;
    }

    sql += `
      GROUP BY b.id
      HAVING COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') = 0
      ORDER BY b.is_featured DESC, b.created_at DESC
      LIMIT 200
    `;

    const { rows } = await this.db.query<BuildingRow>(sql, params);
    return rows;
  }

  private async attachMyUnlockCounts(rows: BuildingRow[], tenantId: string) {
    if (rows.length === 0) return rows;

    const ids = rows.map((row) => row.id);
    const { rows: unlockRows } = await this.db.query<{
      building_id: string;
      count: string;
    }>(
      `SELECT u.building_id, COUNT(DISTINCT uu.id) AS count
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       WHERE u.building_id = ANY($1)
         AND uu.tenant_id = $2
         AND uu.is_winner = TRUE
         AND (uu.expires_at IS NULL OR uu.expires_at > NOW())
       GROUP BY u.building_id`,
      [ids, tenantId],
    );

    const counts = new Map(
      unlockRows.map((row) => [row.building_id, row.count]),
    );

    return rows.map((row) => ({
      ...row,
      my_unlock_count: counts.get(row.id) ?? row.my_unlock_count,
    }));
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
              b.approximate_lat, b.approximate_lng, b.cover_image_path, b.video_url,
              p.first_name, p.last_name, p.phone,
              u.email AS landlord_email
       FROM buildings b
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users u ON u.id = b.landlord_id
       WHERE b.is_verified = FALSE
       ORDER BY b.created_at ASC`,
    );
    return rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      district: row.district,
      created_at: row.created_at,
      approximate_lat: row.approximate_lat,
      approximate_lng: row.approximate_lng,
      cover_image_path: row.cover_image_path,
      video_url: row.video_url,
      landlord_id: row.landlord_id,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      email: row.landlord_email,
    }));
  }

  async findById(id: string, includeExact = false, tenantId?: string) {
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
    const buildingId = building.id as string;
    const coords = includeExact
      ? {
          lat: building.approximate_lat as number,
          lng: building.approximate_lng as number,
        }
      : publicMapCoords(
          buildingId,
          building.approximate_lat as number,
          building.approximate_lng as number,
          building.exact_lat as number | null,
          building.exact_lng as number | null,
        );

    const hasPremiumMedia = Boolean(
      building.cover_image_path || building.video_url,
    );
    const mediaAccess = tenantId
      ? await this.tenantCanViewPremiumMedia(buildingId, tenantId)
      : false;
    const imageUrls = mediaAccess
      ? await this.fetchBuildingImageUrls(
          buildingId,
          building.cover_image_path as string | null,
        )
      : undefined;

    return {
      id: building.id,
      name: building.name,
      description: building.description,
      city: building.city,
      district: building.district,
      countryCode: building.country_code,
      approximateLat: coords.lat,
      approximateLng: coords.lng,
      exactAddress: includeExact ? building.exact_address : undefined,
      exactLat: includeExact ? building.exact_lat : undefined,
      exactLng: includeExact ? building.exact_lng : undefined,
      totalUnits: building.total_units,
      isVerified: building.is_verified,
      isFeatured: building.is_featured,
      hasPremiumMedia,
      coverImageUrl: mediaAccess
        ? (building.cover_image_path as string | null) ?? undefined
        : undefined,
      imageUrls,
      videoUrl:
        mediaAccess && building.video_url
          ? (building.video_url as string)
          : undefined,
      availableUnitCount: Number(building.available_unit_count),
      rentFrom: building.rent_from ? Number(building.rent_from) : null,
      units,
    };
  }

  private async tenantCanViewPremiumMedia(buildingId: string, tenantId: string) {
    const { rows: unlockRows } = await this.db.query(
      `SELECT 1
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       WHERE u.building_id = $1
         AND uu.tenant_id = $2
         AND uu.is_winner = TRUE
         AND (uu.expires_at IS NULL OR uu.expires_at > NOW())
       LIMIT 1`,
      [buildingId, tenantId],
    );
    if (unlockRows[0]) return true;

    const { rows: landlordRows } = await this.db.query(
      "SELECT 1 FROM buildings WHERE id = $1 AND landlord_id = $2 LIMIT 1",
      [buildingId, tenantId],
    );
    return Boolean(landlordRows[0]);
  }

  async fetchBuildingImageUrls(
    buildingId: string,
    coverPath?: string | null,
  ): Promise<string[]> {
    const { rows } = await this.db.query<{ storage_path: string }>(
      `SELECT storage_path
       FROM unit_images
       WHERE building_id = $1
       ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [buildingId],
    );
    const fromTable = rows.map((row) => row.storage_path).filter(Boolean);
    const merged = [...fromTable];
    if (coverPath && !merged.includes(coverPath)) {
      merged.unshift(coverPath);
    }
    if (merged.length > 0) return merged;
    return coverPath ? [coverPath] : [];
  }

  async create(landlordId: string, dto: CreateBuildingDto) {
    await this.db.query("BEGIN");
    try {
      const { rows } = await this.db.query(
        `INSERT INTO buildings (
          landlord_id, name, description, city, district, country_code,
          approximate_lat, approximate_lng, exact_address, exact_lat, exact_lng,
          total_units, video_url, building_type, is_verified
        ) VALUES ($1,$2,$3,$4,$5,'UG',$6,$7,$8,$9,$10,$11,$12,$13,FALSE)
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
          dto.videoUrl ?? null,
          dto.buildingType ?? "apartment",
        ],
      );
      const building = rows[0] as { id: string };

      if (dto.units?.length) {
        for (const unit of dto.units) {
          await this.insertUnit(building.id, unit);
        }
      }

      await this.db.query("COMMIT");
      const jittered = jitterPublicMapCoords(
        building.id,
        dto.approximateLat,
        dto.approximateLng,
      );
      await this.db.query(
        `UPDATE buildings
         SET approximate_lat = $2, approximate_lng = $3,
             exact_lat = COALESCE(exact_lat, $4),
             exact_lng = COALESCE(exact_lng, $5)
         WHERE id = $1`,
        [
          building.id,
          jittered.lat,
          jittered.lng,
          dto.exactLat ?? dto.approximateLat,
          dto.exactLng ?? dto.approximateLng,
        ],
      );
      return this.findById(building.id, true, landlordId);
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
    const coords = publicMapCoords(
      row.id,
      row.approximate_lat,
      row.approximate_lng,
      row.exact_lat,
      row.exact_lng,
    );
    return {
      id: row.id,
      name: row.name,
      city: row.city,
      district: row.district,
      countryCode: row.country_code,
      buildingType: row.building_type,
      approximateLat: coords.lat,
      approximateLng: coords.lng,
      totalUnits: row.total_units,
      isVerified: row.is_verified,
      isFeatured: row.is_featured,
      availableUnitCount: Number(row.available_unit_count),
      rentFrom: row.rent_from ? Number(row.rent_from) : null,
      myUnlockCount: row.my_unlock_count
        ? Number(row.my_unlock_count)
        : undefined,
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
