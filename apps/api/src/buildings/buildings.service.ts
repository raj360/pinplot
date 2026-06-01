import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import {
  jitterPublicMapCoords,
  publicMapCoords,
} from "../common/location-jitter";
import {
  AdminUpdateBuildingDto,
  BuildingBoundsQueryDto,
  CreateBuildingDto,
  CreateUnitDto,
  RegisterImageDto,
  UpdateUnitDto,
} from "./dto/building.dto";
import type { BuildingSummary, BuildingType, UnitStatus } from "@plotpin/shared-types";
import { PaymentPurpose } from "@plotpin/shared-types";
import { EXPLORE_BOUNDS_SQL } from "./explore-query";
import { ExploreSearchCacheService } from "./explore-search-cache.service";
import { PricingService } from "../pricing/pricing.service";

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
  constructor(
    private readonly db: DatabaseService,
    private readonly exploreCache: ExploreSearchCacheService,
    private readonly pricing: PricingService,
  ) {}

  async findInBounds(query: BuildingBoundsQueryDto, tenantId?: string) {
    if (!tenantId) {
      const cached = this.exploreCache.get<BuildingSummary[]>(query);
      if (cached) return cached;
    }

    const available = await this.queryAvailableInBounds(query);
    const withUnlocks = tenantId
      ? await this.attachMyUnlockCounts(available, tenantId)
      : available;

    let result;
    if (!tenantId) {
      result = withUnlocks.map((row) => this.toSummary(row));
    } else {
      const unlockedOnly = await this.queryUnlockedOnlyInBounds(query, tenantId);
      const seen = new Set(withUnlocks.map((row) => row.id));
      const merged = [
        ...withUnlocks,
        ...unlockedOnly.filter((row) => !seen.has(row.id)),
      ];
      result = merged.map((row) => this.toSummary(row));
    }

    if (!tenantId) {
      this.exploreCache.set(query, result);
    }

    return result;
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
        ${EXPLORE_BOUNDS_SQL}
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
        ${EXPLORE_BOUNDS_SQL}
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

  async findMineById(buildingId: string, landlordId: string) {
    await this.assertLandlord(buildingId, landlordId);

    const { rows } = await this.db.query(
      `SELECT b.*,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count
       FROM buildings b
       LEFT JOIN units u ON u.building_id = b.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [buildingId],
    );

    if (!rows[0]) throw new NotFoundException("Building not found");

    const building = rows[0] as Record<string, unknown>;
    const units = await this.fetchUnits(buildingId);

    return {
      id: building.id,
      name: building.name,
      description: building.description,
      city: building.city,
      district: building.district,
      countryCode: building.country_code,
      buildingType: building.building_type,
      totalUnits: building.total_units,
      isVerified: building.is_verified,
      availableUnitCount: Number(building.available_unit_count ?? 0),
      units,
    };
  }

  async updateUnitStatus(
    buildingId: string,
    unitId: string,
    landlordId: string,
    status: UnitStatus,
  ) {
    await this.assertLandlord(buildingId, landlordId);

    const { rows: buildingRows } = await this.db.query<{
      is_verified: boolean;
      building_type: string;
      country_code: string;
    }>(
      "SELECT is_verified, building_type, country_code FROM buildings WHERE id = $1",
      [buildingId],
    );
    const building = buildingRows[0];
    if (!building) throw new NotFoundException("Building not found");

    const { rows: unitRows } = await this.db.query<{
      id: string;
      status: string;
      bedrooms: number;
    }>(
      "SELECT id, status, bedrooms FROM units WHERE id = $1 AND building_id = $2",
      [unitId, buildingId],
    );
    const unit = unitRows[0];
    if (!unit) throw new NotFoundException("Unit not found");

    if (unit.status === "LOCKED") {
      throw new ConflictException(
        "This unit is locked by an active tenant unlock and cannot be changed.",
      );
    }

    if (status === "AVAILABLE" && !building.is_verified) {
      throw new BadRequestException(
        "Building must be verified before units can go live on the map.",
      );
    }

    const { rows: updatedRows } = await this.db.query(
      `UPDATE units SET status = $3, updated_at = NOW()
       WHERE id = $1 AND building_id = $2
       RETURNING id, unit_number, bedrooms, bathrooms, rent_amount, currency, status`,
      [unitId, buildingId, status],
    );

    this.exploreCache.clear();

    const updated = updatedRows[0] as Record<string, unknown>;
    const unitPayload = {
      id: updated.id,
      unitNumber: updated.unit_number,
      bedrooms: updated.bedrooms,
      bathrooms: updated.bathrooms,
      rentAmount: updated.rent_amount,
      currency: updated.currency,
      status: updated.status,
    };

    if (status === "AVAILABLE") {
      const listingQuote = await this.pricing.quote({
        buildingType: building.building_type as BuildingType,
        bedrooms: unit.bedrooms,
        purpose: PaymentPurpose.LISTING,
        countryCode: building.country_code,
      });
      return { unit: unitPayload, listingQuote };
    }

    return { unit: unitPayload };
  }

  async findPendingVerification() {
    const { rows } = await this.db.query(
      `SELECT b.id, b.name, b.city, b.district, b.created_at, b.landlord_id,
              b.approximate_lat, b.approximate_lng,
              b.exact_lat, b.exact_lng,
              b.total_units,
              b.cover_image_path, b.video_url,
              p.first_name, p.last_name, p.phone,
              u.email AS landlord_email,
              (SELECT COUNT(*)::int FROM units u2 WHERE u2.building_id = b.id) AS unit_count
       FROM buildings b
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users u ON u.id = b.landlord_id
       WHERE b.is_verified = FALSE
       ORDER BY b.created_at ASC`,
    );
    return rows.map((row: Record<string, unknown>) => {
      const exactLat = row.exact_lat as number | null;
      const exactLng = row.exact_lng as number | null;
      const pinLat = exactLat ?? (row.approximate_lat as number);
      const pinLng = exactLng ?? (row.approximate_lng as number);

      return {
        id: row.id,
        name: row.name,
        city: row.city,
        district: row.district,
        created_at: row.created_at,
        approximate_lat: row.approximate_lat,
        approximate_lng: row.approximate_lng,
        pin_lat: pinLat,
        pin_lng: pinLng,
        total_units: row.total_units,
        unit_count: row.unit_count,
        cover_image_path: row.cover_image_path,
        video_url: row.video_url,
        landlord_id: row.landlord_id,
        first_name: row.first_name,
        last_name: row.last_name,
        phone: row.phone,
        email: row.landlord_email,
      };
    });
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
          lat: (building.exact_lat ?? building.approximate_lat) as number,
          lng: (building.exact_lng ?? building.approximate_lng) as number,
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
    this.exploreCache.clear();
    return rows[0];
  }

  async findPendingById(buildingId: string) {
    await this.assertPendingBuilding(buildingId);

    const { rows } = await this.db.query(
      `SELECT b.*,
              p.first_name, p.last_name, p.phone,
              u.email AS landlord_email
       FROM buildings b
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users u ON u.id = b.landlord_id
       WHERE b.id = $1`,
      [buildingId],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");

    const row = rows[0] as Record<string, unknown>;
    const exactLat = row.exact_lat as number | null;
    const exactLng = row.exact_lng as number | null;
    const units = await this.fetchUnits(buildingId);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      city: row.city,
      district: row.district,
      buildingType: row.building_type,
      exactAddress: row.exact_address,
      coverImagePath: row.cover_image_path,
      videoUrl: row.video_url,
      totalUnits: row.total_units,
      pinLat: exactLat ?? (row.approximate_lat as number),
      pinLng: exactLng ?? (row.approximate_lng as number),
      isVerified: row.is_verified,
      units,
      landlord: {
        id: row.landlord_id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.landlord_email,
      },
    };
  }

  async adminUpdatePendingBuilding(
    buildingId: string,
    adminId: string,
    dto: AdminUpdateBuildingDto,
  ) {
    await this.assertPendingBuilding(buildingId);

    if (
      (dto.exactLat != null && dto.exactLng == null) ||
      (dto.exactLat == null && dto.exactLng != null)
    ) {
      throw new BadRequestException("exactLat and exactLng must be sent together.");
    }

    const sets: string[] = [];
    const params: unknown[] = [buildingId];
    let paramIndex = 2;

    const push = (column: string, value: unknown) => {
      sets.push(`${column} = $${paramIndex}`);
      params.push(value);
      paramIndex += 1;
    };

    if (dto.name !== undefined) push("name", dto.name);
    if (dto.description !== undefined) push("description", dto.description);
    if (dto.city !== undefined) push("city", dto.city);
    if (dto.district !== undefined) push("district", dto.district);
    if (dto.exactAddress !== undefined) push("exact_address", dto.exactAddress);
    if (dto.coverImagePath !== undefined) {
      push("cover_image_path", dto.coverImagePath || null);
    }
    if (dto.videoUrl !== undefined) push("video_url", dto.videoUrl || null);
    if (dto.totalUnits !== undefined) push("total_units", dto.totalUnits);
    if (dto.buildingType !== undefined) push("building_type", dto.buildingType);

    if (dto.exactLat != null && dto.exactLng != null) {
      push("exact_lat", dto.exactLat);
      push("exact_lng", dto.exactLng);
      const jittered = jitterPublicMapCoords(
        buildingId,
        dto.exactLat,
        dto.exactLng,
      );
      push("approximate_lat", jittered.lat);
      push("approximate_lng", jittered.lng);
    }

    push("managed_by_admin_id", adminId);

    if (sets.length === 1) {
      return this.findPendingById(buildingId);
    }

    sets.push("updated_at = NOW()");
    await this.db.query(
      `UPDATE buildings SET ${sets.join(", ")} WHERE id = $1`,
      params,
    );

    return this.findPendingById(buildingId);
  }

  async adminAddUnit(buildingId: string, adminId: string, dto: CreateUnitDto) {
    await this.assertPendingBuilding(buildingId);

    try {
      const row = await this.insertUnit(buildingId, dto);
      await this.syncPendingTotalUnits(buildingId, adminId);
      return {
        id: row.id,
        unitNumber: row.unit_number,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        rentAmount: row.rent_amount,
        currency: row.currency,
        status: row.status,
      };
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new ConflictException(
          `Unit number "${dto.unitNumber}" already exists for this building.`,
        );
      }
      throw err;
    }
  }

  async adminUpdateUnit(
    buildingId: string,
    unitId: string,
    adminId: string,
    dto: UpdateUnitDto,
  ) {
    await this.assertPendingBuilding(buildingId);

    const { rows: unitRows } = await this.db.query<{ status: string }>(
      "SELECT status FROM units WHERE id = $1 AND building_id = $2",
      [unitId, buildingId],
    );
    if (!unitRows[0]) throw new NotFoundException("Unit not found");
    if (unitRows[0].status !== "UNAVAILABLE") {
      throw new BadRequestException(
        "Only pending units can be edited before the building goes live.",
      );
    }

    const sets: string[] = [];
    const params: unknown[] = [unitId, buildingId];
    let paramIndex = 3;

    const push = (column: string, value: unknown) => {
      sets.push(`${column} = $${paramIndex}`);
      params.push(value);
      paramIndex += 1;
    };

    if (dto.unitNumber !== undefined) push("unit_number", dto.unitNumber);
    if (dto.bedrooms !== undefined) push("bedrooms", dto.bedrooms);
    if (dto.bathrooms !== undefined) push("bathrooms", dto.bathrooms);
    if (dto.rentAmount !== undefined) push("rent_amount", dto.rentAmount);

    if (sets.length === 0) {
      const units = await this.fetchUnits(buildingId);
      return units.find((u) => u.id === unitId);
    }

    sets.push("updated_at = NOW()");

    try {
      const { rows } = await this.db.query(
        `UPDATE units SET ${sets.join(", ")}
         WHERE id = $1 AND building_id = $2
         RETURNING id, unit_number, bedrooms, bathrooms, rent_amount, currency, status`,
        params,
      );
      await this.db.query(
        "UPDATE buildings SET managed_by_admin_id = $2, updated_at = NOW() WHERE id = $1",
        [buildingId, adminId],
      );
      const updated = rows[0] as Record<string, unknown>;
      return {
        id: updated.id,
        unitNumber: updated.unit_number,
        bedrooms: updated.bedrooms,
        bathrooms: updated.bathrooms,
        rentAmount: updated.rent_amount,
        currency: updated.currency,
        status: updated.status,
      };
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new ConflictException("That unit number is already in use.");
      }
      throw err;
    }
  }

  async adminDeleteUnit(buildingId: string, unitId: string, adminId: string) {
    await this.assertPendingBuilding(buildingId);

    const { rows: unitRows } = await this.db.query<{ status: string }>(
      "SELECT status FROM units WHERE id = $1 AND building_id = $2",
      [unitId, buildingId],
    );
    if (!unitRows[0]) throw new NotFoundException("Unit not found");
    if (unitRows[0].status !== "UNAVAILABLE") {
      throw new BadRequestException(
        "Only pending units can be removed before the building goes live.",
      );
    }

    const { rows: countRows } = await this.db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM units WHERE building_id = $1",
      [buildingId],
    );
    if (Number(countRows[0]?.count ?? 0) <= 1) {
      throw new BadRequestException("A building must have at least one unit.");
    }

    await this.db.query(
      "DELETE FROM units WHERE id = $1 AND building_id = $2",
      [unitId, buildingId],
    );
    await this.syncPendingTotalUnits(buildingId, adminId);
    return { deleted: true };
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

  private async assertPendingBuilding(buildingId: string) {
    const { rows } = await this.db.query<{ is_verified: boolean }>(
      "SELECT is_verified FROM buildings WHERE id = $1",
      [buildingId],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");
    if (rows[0].is_verified) {
      throw new BadRequestException(
        "This building is already live. Pending edits are only allowed before approval.",
      );
    }
  }

  private async syncPendingTotalUnits(buildingId: string, adminId: string) {
    await this.db.query(
      `UPDATE buildings b
       SET total_units = GREATEST(
             b.total_units,
             (SELECT COUNT(*)::int FROM units u WHERE u.building_id = b.id)
           ),
           managed_by_admin_id = $2,
           updated_at = NOW()
       WHERE b.id = $1`,
      [buildingId, adminId],
    );
  }
}
