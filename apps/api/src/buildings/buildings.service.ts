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
  LandlordUpdateBuildingDto,
  RegisterImageDto,
  UpdateUnitDto,
  VerifyBuildingDto,
} from "./dto/building.dto";
import type { BuildingSummary, UnitStatus } from "@plotpin/shared-types";
import {
  DUPLICATE_PIN_RADIUS_METERS,
  MAX_BUILDING_PHOTOS,
  MAX_UNVERIFIED_BUILDINGS_PER_LANDLORD,
  type AdminVerificationChecklist,
} from "@plotpin/shared-types";
import {
  EXPLORE_BOUNDS_SQL,
  EXPLORE_FEATURED_ACTIVE_SQL,
  EXPLORE_FEATURED_ORDER_SQL,
} from "./explore-query";
import { ExploreSearchCacheService } from "./explore-search-cache.service";
import { LandlordNotificationsService } from "./landlord-notifications.service";
import { PricingService } from "../pricing/pricing.service";
import { SupabaseAdminService } from "../auth/supabase-admin.service";
import {
  BUILDING_IMAGES_BUCKET,
  collectStoragePaths,
} from "../common/storage.util";

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
  featured_until: Date | null;
  available_unit_count: string;
  rent_from: string | null;
  currency: string;
  cover_image_thumb_path?: string | null;
  my_unlock_count?: string;
};

@Injectable()
export class BuildingsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly exploreCache: ExploreSearchCacheService,
    private readonly pricing: PricingService,
    private readonly supabaseAdmin: SupabaseAdminService,
    private readonly landlordNotifications: LandlordNotificationsService,
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

  async findFeatured(
    limit = 12,
    options: {
      countryCode?: string;
      localOnly?: boolean;
      excludeCountryCode?: string;
    } = {},
  ) {
    const capped = Math.min(Math.max(limit, 1), 24);
    const region = options.countryCode?.trim().toUpperCase() || null;
    const exclude =
      options.excludeCountryCode?.trim().toUpperCase() || null;
    const params: unknown[] = [capped];
    const filters: string[] = [
      "b.is_verified = TRUE",
      EXPLORE_FEATURED_ACTIVE_SQL,
    ];
    let regionOrder = "";

    if (options.localOnly && region) {
      params.push(region);
      filters.push(`b.country_code = $${params.length}`);
    } else if (region) {
      params.push(region);
      regionOrder = `(b.country_code = $${params.length}) DESC, `;
    }

    if (exclude) {
      params.push(exclude);
      filters.push(`b.country_code <> $${params.length}`);
    }

    const { rows } = await this.db.query<BuildingRow>(
      `SELECT
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
        b.featured_until,
        b.cover_image_thumb_path,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
        MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from,
        co.currency AS currency
      FROM buildings b
      JOIN countries co ON co.code = b.country_code
      LEFT JOIN units u ON u.building_id = b.id
      WHERE ${filters.join("\n        AND ")}
      GROUP BY b.id, co.currency, b.is_featured, b.featured_until
      HAVING COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') > 0
      ORDER BY ${regionOrder}b.featured_until DESC NULLS LAST, b.featured_granted_at DESC NULLS LAST, b.created_at DESC
      LIMIT $1`,
      params,
    );
    return rows.map((row) => this.toSummary(row));
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
        b.featured_until,
        b.cover_image_thumb_path,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
        MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from,
        co.currency AS currency
      FROM buildings b
      JOIN countries co ON co.code = b.country_code
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
      GROUP BY b.id, co.currency, b.is_featured, b.featured_until
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

    sql += ` ORDER BY ${EXPLORE_FEATURED_ORDER_SQL} LIMIT 200`;

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
        b.cover_image_thumb_path,
        0 AS available_unit_count,
        NULL AS rent_from,
        co.currency AS currency,
        COUNT(DISTINCT uu.id) AS my_unlock_count
      FROM buildings b
      JOIN countries co ON co.code = b.country_code
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
      GROUP BY b.id, co.currency
      HAVING COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') = 0
      ORDER BY ${EXPLORE_FEATURED_ORDER_SQL}
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
      rejectedAt: b.rejected_at ?? null,
      rejectionReason: b.rejection_reason ?? null,
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
      rejectedAt: building.rejected_at ?? null,
      rejectionReason: building.rejection_reason ?? null,
      availableUnitCount: Number(building.available_unit_count ?? 0),
      units,
    };
  }

  async updateMineBuilding(
    buildingId: string,
    landlordId: string,
    dto: LandlordUpdateBuildingDto,
  ) {
    await this.assertLandlord(buildingId, landlordId);

    const { rows: buildingRows } = await this.db.query<{
      is_verified: boolean;
      rejected_at: string | null;
      country_code: string;
    }>(
      `SELECT is_verified, rejected_at, country_code FROM buildings WHERE id = $1`,
      [buildingId],
    );
    const building = buildingRows[0];
    if (!building) throw new NotFoundException("Building not found");

    const editable =
      !building.is_verified || building.rejected_at != null;
    if (!editable) {
      throw new BadRequestException(
        "Listing details can only be edited while pending review or after rejection.",
      );
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
    if (dto.buildingType !== undefined) {
      push("building_type", dto.buildingType);
    }

    let nextCurrency: string | null = null;
    if (dto.countryCode !== undefined) {
      const countryCode = await this.resolveCountryCode(dto.countryCode);
      if (countryCode !== building.country_code) {
        push("country_code", countryCode);
        nextCurrency = await this.currencyForCountry(countryCode);
      }
    }

    if (sets.length === 0) {
      return this.findMineById(buildingId, landlordId);
    }

    sets.push("updated_at = NOW()");
    await this.db.query(
      `UPDATE buildings SET ${sets.join(", ")} WHERE id = $1`,
      params,
    );

    if (nextCurrency) {
      await this.db.query(
        `UPDATE units
         SET currency = $2, updated_at = NOW()
         WHERE building_id = $1 AND status <> 'LOCKED'`,
        [buildingId, nextCurrency],
      );
    }

    this.exploreCache.clear();
    return this.findMineById(buildingId, landlordId);
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
         AND b.rejected_at IS NULL
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
        co.currency AS currency,
        COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
        MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from
      FROM buildings b
      JOIN countries co ON co.code = b.country_code
      LEFT JOIN units u ON u.building_id = b.id
      WHERE b.id = $1 AND ($2::boolean OR b.is_verified = TRUE)
      GROUP BY b.id, co.currency`,
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
      coverThumbUrl:
        (building.cover_image_thumb_path as string | null) ??
        (building.cover_image_path as string | null) ??
        undefined,
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
      currency: building.currency as string,
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
    if (!dto.acceptTerms) {
      throw new BadRequestException(
        "You must accept the Terms of Service and Privacy Policy.",
      );
    }
    if (!dto.ownershipAttestation) {
      throw new BadRequestException(
        "Confirm that you have authority to list this property.",
      );
    }

    const { rows: suspended } = await this.db.query(
      `SELECT suspended_at FROM profiles WHERE id = $1`,
      [landlordId],
    );
    if (suspended[0]?.suspended_at) {
      throw new BadRequestException(
        "This account cannot submit new listings. Contact support.",
      );
    }

    const { rows: capRows } = await this.db.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count
       FROM buildings
       WHERE landlord_id = $1
         AND is_verified = FALSE
         AND rejected_at IS NULL`,
      [landlordId],
    );
    if (
      (capRows[0]?.count ?? 0) >= MAX_UNVERIFIED_BUILDINGS_PER_LANDLORD
    ) {
      throw new BadRequestException(
        `You can have at most ${MAX_UNVERIFIED_BUILDINGS_PER_LANDLORD} listings awaiting verification. Wait for admin review or remove a draft.`,
      );
    }

    await this.db.query(
      `UPDATE profiles
       SET landlord_terms_accepted_at = COALESCE(landlord_terms_accepted_at, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [landlordId],
    );

    const countryCode = await this.resolveCountryCode(dto.countryCode);
    const currency = await this.currencyForCountry(countryCode);

    await this.db.query("BEGIN");
    try {
      const { rows } = await this.db.query(
        `INSERT INTO buildings (
          landlord_id, name, description, city, district, country_code,
          approximate_lat, approximate_lng, exact_address, exact_lat, exact_lng,
          total_units, video_url, building_type, is_verified, ownership_attested_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,FALSE,NOW())
        RETURNING *`,
        [
          landlordId,
          dto.name,
          dto.description ?? null,
          dto.city,
          dto.district ?? null,
          countryCode,
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
          await this.insertUnit(building.id, unit, currency);
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
    const currency = await this.currencyForBuilding(buildingId);
    const row = await this.insertUnit(buildingId, dto, currency);
    return row;
  }

  async setVerified(buildingId: string, dto: VerifyBuildingDto, adminId: string) {
    if (!dto.verified) {
      const { rows } = await this.db.query(
        `UPDATE buildings
         SET is_verified = FALSE,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, name, is_verified`,
        [buildingId],
      );
      if (!rows[0]) throw new NotFoundException("Building not found");
      this.exploreCache.clear();
      return rows[0];
    }

    await this.assertPendingBuilding(buildingId);

    const checklist = dto.checklist;
    if (!checklist || !this.checklistComplete(checklist)) {
      throw new BadRequestException(
        "Complete the verification checklist before approving.",
      );
    }

    const { rows: buildingRows } = await this.db.query<{
      id: string;
      name: string;
      landlord_id: string | null;
      ownership_attested_at: Date | null;
      landlord_phone: string | null;
      landlord_suspended_at: Date | null;
      landlord_email: string | null;
    }>(
      `SELECT b.id, b.name, b.landlord_id, b.ownership_attested_at,
              p.phone AS landlord_phone, p.suspended_at AS landlord_suspended_at,
              u.email AS landlord_email
       FROM buildings b
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users u ON u.id = b.landlord_id
       WHERE b.id = $1`,
      [buildingId],
    );
    const building = buildingRows[0];
    if (!building) throw new NotFoundException("Building not found");

    if (!building.landlord_phone?.trim()) {
      throw new BadRequestException(
        "Landlord must add a phone number on their profile before approval.",
      );
    }
    if (!building.ownership_attested_at) {
      throw new BadRequestException(
        "Ownership attestation is missing on this listing.",
      );
    }
    if (building.landlord_suspended_at) {
      throw new BadRequestException("Landlord account is suspended.");
    }

    const duplicateWarnings = await this.findDuplicatePinWarnings(buildingId);
    if (duplicateWarnings.length > 0 && !dto.acknowledgeDuplicatePin) {
      throw new BadRequestException(
        "Another verified listing exists within 50m. Acknowledge the duplicate pin warning to approve.",
      );
    }

    const { rows } = await this.db.query(
      `UPDATE buildings
       SET is_verified = TRUE,
           verified_at = NOW(),
           verified_by = $2,
           verification_checklist = $3::jsonb,
           rejected_at = NULL,
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, is_verified`,
      [buildingId, adminId, JSON.stringify(checklist)],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");

    const notification = await this.landlordNotifications.notifyListingApproved({
      landlordId: building.landlord_id ?? "",
      landlordEmail: building.landlord_email,
      buildingId: building.id,
      buildingName: building.name,
    });

    this.exploreCache.clear();
    return { ...rows[0], notification, duplicateWarnings };
  }

  private checklistComplete(checklist: AdminVerificationChecklist) {
    return (
      checklist.phoneMatchesListing &&
      checklist.photosAuthentic &&
      checklist.pinPlausible &&
      checklist.rentConsistent &&
      checklist.duplicatePinReviewed &&
      checklist.landlordNotSuspended &&
      checklist.ownershipAttestationRecorded
    );
  }

  async findDuplicatePinWarnings(buildingId: string) {
    const { rows } = await this.db.query<{
      id: string;
      name: string;
      landlord_id: string | null;
      distance_m: number;
    }>(
      `SELECT b2.id, b2.name, b2.landlord_id,
              ST_Distance(b1.location::geography, b2.location::geography) AS distance_m
       FROM buildings b1
       JOIN buildings b2
         ON b2.id <> b1.id
        AND b2.is_verified = TRUE
        AND b2.landlord_id IS DISTINCT FROM b1.landlord_id
        AND b1.location IS NOT NULL
        AND b2.location IS NOT NULL
        AND ST_DWithin(
          b1.location::geography,
          b2.location::geography,
          $2
        )
       WHERE b1.id = $1
       ORDER BY distance_m ASC
       LIMIT 5`,
      [buildingId, DUPLICATE_PIN_RADIUS_METERS],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      landlordId: row.landlord_id,
      distanceM: Math.round(row.distance_m),
    }));
  }

  async rejectBuilding(buildingId: string, adminId: string, reason: string) {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException("Rejection reason is required.");
    }

    const { rows } = await this.db.query<{
      id: string;
      name: string;
      landlord_id: string | null;
      landlord_email: string | null;
    }>(
      `UPDATE buildings b
       SET rejected_at = NOW(),
           rejection_reason = $2,
           managed_by_admin_id = $3,
           updated_at = NOW()
       WHERE b.id = $1
         AND b.is_verified = FALSE
         AND b.rejected_at IS NULL
       RETURNING b.id,
                 b.name,
                 b.landlord_id,
                 (SELECT u.email FROM auth.users u WHERE u.id = b.landlord_id) AS landlord_email`,
      [buildingId, trimmed, adminId],
    );

    if (!rows[0]) {
      const { rows: existing } = await this.db.query<{
        is_verified: boolean;
        rejected_at: Date | null;
      }>(
        "SELECT is_verified, rejected_at FROM buildings WHERE id = $1",
        [buildingId],
      );
      if (!existing[0]) throw new NotFoundException("Building not found");
      if (existing[0].is_verified) {
        throw new BadRequestException("Approved listings cannot be rejected.");
      }
      if (existing[0].rejected_at) {
        throw new BadRequestException("This listing was already rejected.");
      }
      throw new BadRequestException(
        "Could not reject this listing. It may be missing a landlord account.",
      );
    }

    const row = rows[0];
    const notification = await this.landlordNotifications.notifyListingRejected({
      landlordId: row.landlord_id ?? "",
      landlordEmail: row.landlord_email,
      buildingId: row.id,
      buildingName: row.name,
      reason: trimmed,
    });

    this.exploreCache.clear();

    return {
      id: row.id,
      name: row.name,
      rejectedAt: new Date().toISOString(),
      rejectionReason: trimmed,
      notification,
    };
  }

  async resubmitForReview(buildingId: string, landlordId: string) {
    const { rows } = await this.db.query(
      `UPDATE buildings
       SET rejected_at = NULL,
           rejection_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
         AND landlord_id = $2
         AND is_verified = FALSE
         AND rejected_at IS NOT NULL
       RETURNING id, name, is_verified, rejected_at, rejection_reason`,
      [buildingId, landlordId],
    );

    if (!rows[0]) {
      const { rows: existing } = await this.db.query<{
        is_verified: boolean;
        rejected_at: Date | null;
        landlord_id: string | null;
      }>(
        "SELECT is_verified, rejected_at, landlord_id FROM buildings WHERE id = $1",
        [buildingId],
      );
      if (!existing[0]) throw new NotFoundException("Building not found");
      if (existing[0].landlord_id !== landlordId) {
        throw new NotFoundException("Building not found");
      }
      if (existing[0].is_verified) {
        throw new BadRequestException("Approved listings are already live.");
      }
      if (!existing[0].rejected_at) {
        throw new BadRequestException(
          "Only rejected listings can be resubmitted for review.",
        );
      }
      throw new BadRequestException("Could not resubmit this listing.");
    }

    return {
      id: rows[0].id,
      name: rows[0].name,
      isVerified: rows[0].is_verified,
      rejectedAt: null,
      rejectionReason: null,
    };
  }

  async findPendingById(buildingId: string) {
    await this.assertPendingBuilding(buildingId);

    const { rows } = await this.db.query(
      `SELECT b.*,
              co.currency AS currency,
              p.first_name, p.last_name, p.phone, p.suspended_at,
              u.email AS landlord_email
       FROM buildings b
       JOIN countries co ON co.code = b.country_code
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

    const duplicatePinWarnings = await this.findDuplicatePinWarnings(buildingId);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      city: row.city,
      district: row.district,
      countryCode: row.country_code,
      currency: row.currency,
      buildingType: row.building_type,
      exactAddress: row.exact_address,
      coverImagePath: row.cover_image_path,
      videoUrl: row.video_url,
      totalUnits: row.total_units,
      pinLat: exactLat ?? (row.approximate_lat as number),
      pinLng: exactLng ?? (row.approximate_lng as number),
      isVerified: row.is_verified,
      ownershipAttestedAt: row.ownership_attested_at ?? null,
      duplicatePinWarnings,
      landlordPhoneRequired: !row.phone,
      units,
      landlord: {
        id: row.landlord_id,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        email: row.landlord_email,
        suspendedAt: row.suspended_at ?? null,
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
    return this.insertBuildingImage(buildingId, dto);
  }

  async listImages(buildingId: string, landlordId: string) {
    await this.assertLandlord(buildingId, landlordId);
    return this.fetchBuildingImages(buildingId);
  }

  async deleteImage(buildingId: string, landlordId: string, imageId: string) {
    await this.assertLandlord(buildingId, landlordId);
    return this.removeBuildingImage(buildingId, imageId);
  }

  async setPrimaryImage(
    buildingId: string,
    landlordId: string,
    imageId: string,
  ) {
    await this.assertLandlord(buildingId, landlordId);
    return this.promoteBuildingImage(buildingId, imageId);
  }

  async adminListImages(buildingId: string) {
    await this.assertPendingBuilding(buildingId);
    return this.fetchBuildingImages(buildingId);
  }

  async adminRegisterImage(buildingId: string, dto: RegisterImageDto) {
    await this.assertPendingBuilding(buildingId);
    return this.insertBuildingImage(buildingId, dto);
  }

  async adminDeleteImage(buildingId: string, imageId: string) {
    await this.assertPendingBuilding(buildingId);
    return this.removeBuildingImage(buildingId, imageId);
  }

  async adminSetPrimaryImage(buildingId: string, imageId: string) {
    await this.assertPendingBuilding(buildingId);
    return this.promoteBuildingImage(buildingId, imageId);
  }

  private async insertBuildingImage(
    buildingId: string,
    dto: RegisterImageDto,
  ) {
    const { rows: countRows } = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM unit_images WHERE building_id = $1`,
      [buildingId],
    );
    const imageCount = Number(countRows[0]?.count ?? 0);
    if (imageCount >= MAX_BUILDING_PHOTOS) {
      throw new BadRequestException(
        `A building can have at most ${MAX_BUILDING_PHOTOS} photos (including cover).`,
      );
    }

    const thumbPath = dto.thumbStoragePath ?? dto.storagePath;

    if (dto.isPrimary) {
      await this.db.query(
        "UPDATE unit_images SET is_primary = FALSE WHERE building_id = $1",
        [buildingId],
      );
      await this.db.query(
        `UPDATE buildings
         SET cover_image_path = $2,
             cover_image_thumb_path = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [buildingId, dto.storagePath, thumbPath],
      );
    }

    const { rows } = await this.db.query<{
      id: string;
      storage_path: string;
      thumb_storage_path: string | null;
      is_primary: boolean;
      sort_order: number;
      created_at: Date;
    }>(
      `INSERT INTO unit_images (building_id, storage_path, thumb_storage_path, is_primary, sort_order)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM unit_images WHERE building_id = $1))
       RETURNING id, storage_path, thumb_storage_path, is_primary, sort_order, created_at`,
      [buildingId, dto.storagePath, thumbPath, dto.isPrimary ?? false],
    );
    return this.mapImageRow(rows[0]);
  }

  private async fetchBuildingImages(buildingId: string) {
    const { rows } = await this.db.query<{
      id: string;
      storage_path: string;
      thumb_storage_path: string | null;
      is_primary: boolean;
      sort_order: number;
      created_at: Date;
    }>(
      `SELECT id, storage_path, thumb_storage_path, is_primary, sort_order, created_at
       FROM unit_images
       WHERE building_id = $1
       ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [buildingId],
    );
    return rows.map((row) => this.mapImageRow(row));
  }

  private mapImageRow(row: {
    id: string;
    storage_path: string;
    thumb_storage_path?: string | null;
    is_primary: boolean;
    sort_order: number;
    created_at: Date;
  }) {
    return {
      id: row.id,
      storagePath: row.storage_path,
      thumbStoragePath: row.thumb_storage_path ?? row.storage_path,
      isPrimary: row.is_primary,
      sortOrder: row.sort_order,
      createdAt: row.created_at.toISOString(),
    };
  }

  private async removeImageStorage(
    storagePath: string | null | undefined,
    thumbStoragePath?: string | null,
  ) {
    const paths = collectStoragePaths(storagePath, thumbStoragePath);
    await this.supabaseAdmin.removeStorageObjects(
      BUILDING_IMAGES_BUCKET,
      paths,
    );
  }

  private async removeBuildingImage(buildingId: string, imageId: string) {
    const { rows } = await this.db.query<{
      id: string;
      is_primary: boolean;
      storage_path: string;
      thumb_storage_path: string | null;
    }>(
      `SELECT id, is_primary, storage_path, thumb_storage_path
       FROM unit_images
       WHERE id = $1 AND building_id = $2`,
      [imageId, buildingId],
    );
    if (!rows[0]) throw new NotFoundException("Image not found");

    const wasPrimary = rows[0].is_primary;
    const { storage_path, thumb_storage_path } = rows[0];

    await this.db.query(
      "DELETE FROM unit_images WHERE id = $1 AND building_id = $2",
      [imageId, buildingId],
    );

    await this.removeImageStorage(storage_path, thumb_storage_path);

    if (wasPrimary) {
      const { rows: nextRows } = await this.db.query<{
        id: string;
        storage_path: string;
        thumb_storage_path: string | null;
      }>(
        `SELECT id, storage_path, thumb_storage_path
         FROM unit_images
         WHERE building_id = $1
         ORDER BY sort_order ASC, created_at ASC
         LIMIT 1`,
        [buildingId],
      );
      if (nextRows[0]) {
        await this.promoteBuildingImage(buildingId, nextRows[0].id);
      } else {
        await this.db.query(
          `UPDATE buildings
           SET cover_image_path = NULL,
               cover_image_thumb_path = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [buildingId],
        );
      }
    }

    return { deleted: true };
  }

  private async promoteBuildingImage(buildingId: string, imageId: string) {
    const { rows } = await this.db.query<{
      storage_path: string;
      thumb_storage_path: string | null;
    }>(
      `SELECT storage_path, thumb_storage_path
       FROM unit_images
       WHERE id = $1 AND building_id = $2`,
      [imageId, buildingId],
    );
    if (!rows[0]) throw new NotFoundException("Image not found");

    const thumbPath = rows[0].thumb_storage_path ?? rows[0].storage_path;

    await this.db.query(
      "UPDATE unit_images SET is_primary = FALSE WHERE building_id = $1",
      [buildingId],
    );
    await this.db.query(
      "UPDATE unit_images SET is_primary = TRUE WHERE id = $1",
      [imageId],
    );
    await this.db.query(
      `UPDATE buildings
       SET cover_image_path = $2,
           cover_image_thumb_path = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [buildingId, rows[0].storage_path, thumbPath],
    );

    const images = await this.fetchBuildingImages(buildingId);
    return images.find((image) => image.id === imageId) ?? images[0];
  }

  private async insertUnit(
    buildingId: string,
    dto: CreateUnitDto,
    currency = "UGX",
  ) {
    const { rows } = await this.db.query(
      `INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, currency, status)
       VALUES ($1,$2,$3,$4,$5,$6,'UNAVAILABLE') RETURNING *`,
      [
        buildingId,
        dto.unitNumber,
        dto.bedrooms,
        dto.bathrooms,
        dto.rentAmount,
        currency,
      ],
    );
    return rows[0];
  }

  /** Validate an inbound country code against the active catalog; default UG. */
  private async resolveCountryCode(code?: string): Promise<string> {
    const upper = (code ?? "UG").toUpperCase();
    const { rows } = await this.db.query(
      `SELECT 1 FROM countries WHERE code = $1 AND is_active = TRUE`,
      [upper],
    );
    return rows[0] ? upper : "UG";
  }

  private async currencyForCountry(code: string): Promise<string> {
    const { rows } = await this.db.query<{ currency: string }>(
      `SELECT currency FROM countries WHERE code = $1`,
      [code],
    );
    return rows[0]?.currency ?? "UGX";
  }

  private async currencyForBuilding(buildingId: string): Promise<string> {
    const { rows } = await this.db.query<{ currency: string }>(
      `SELECT co.currency
       FROM buildings b
       JOIN countries co ON co.code = b.country_code
       WHERE b.id = $1`,
      [buildingId],
    );
    return rows[0]?.currency ?? "UGX";
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
      isFeatured: this.isFeaturedActive(row),
      availableUnitCount: Number(row.available_unit_count),
      rentFrom: row.rent_from ? Number(row.rent_from) : null,
      currency: row.currency,
      coverThumbUrl: row.cover_image_thumb_path ?? undefined,
      myUnlockCount: row.my_unlock_count
        ? Number(row.my_unlock_count)
        : undefined,
    };
  }

  private static readonly LAUNCH_FEATURED_MAX = 20;
  private static readonly LAUNCH_FEATURED_DAYS = 90;

  async getLaunchFeaturedStats() {
    const { rows } = await this.db.query<{ active: string }>(
      `SELECT COUNT(*)::text AS active
       FROM buildings b
       WHERE b.featured_source = 'LAUNCH_GRANT'
         AND ${EXPLORE_FEATURED_ACTIVE_SQL}`,
    );
    const activeLaunchGrants = Number(rows[0]?.active ?? 0);
    const maxSlots = BuildingsService.LAUNCH_FEATURED_MAX;
    return {
      maxSlots,
      activeLaunchGrants,
      remainingSlots: Math.max(0, maxSlots - activeLaunchGrants),
    };
  }

  async runLaunchFeaturedGrant(
    adminId: string,
    limit = BuildingsService.LAUNCH_FEATURED_MAX,
    durationDays = BuildingsService.LAUNCH_FEATURED_DAYS,
  ) {
    const stats = await this.getLaunchFeaturedStats();
    if (stats.remainingSlots <= 0) {
      return {
        ...stats,
        granted: [] as Array<{
          id: string;
          name: string;
          featuredUntil: string;
        }>,
        message: "All launch featured slots are in use.",
      };
    }

    const grantCount = Math.min(limit, stats.remainingSlots);
    const { rows } = await this.db.query<{ id: string; name: string }>(
      `SELECT b.id, b.name
       FROM buildings b
       WHERE b.is_verified = TRUE
         AND b.rejected_at IS NULL
         AND NOT (${EXPLORE_FEATURED_ACTIVE_SQL})
       ORDER BY b.created_at ASC
       LIMIT $1`,
      [grantCount],
    );

    const granted = [];
    for (const row of rows) {
      const result = await this.setBuildingFeatured(row.id, adminId, {
        featured: true,
        durationDays,
        source: "LAUNCH_GRANT",
      });
      granted.push(result);
    }

    return {
      ...(await this.getLaunchFeaturedStats()),
      granted,
    };
  }

  async setBuildingFeatured(
    buildingId: string,
    adminId: string,
    options: {
      featured: boolean;
      durationDays?: number;
      source?: "LAUNCH_GRANT" | "ADMIN_GRANT";
    },
  ) {
    if (!options.featured) {
      const { rows } = await this.db.query<{ id: string; name: string }>(
        `UPDATE buildings
         SET is_featured = FALSE,
             featured_until = NULL,
             featured_granted_at = NULL,
             featured_source = NULL,
             updated_at = NOW()
         WHERE id = $1 AND is_verified = TRUE
         RETURNING id, name`,
        [buildingId],
      );
      if (!rows[0]) throw new NotFoundException("Verified building not found");
      this.exploreCache.clear();
      return { id: rows[0].id, name: rows[0].name, isFeatured: false };
    }

    if (options.source === "LAUNCH_GRANT") {
      const stats = await this.getLaunchFeaturedStats();
      if (stats.remainingSlots <= 0) {
        throw new BadRequestException(
          "All launch featured slots are in use. Revoke one or wait for expiry.",
        );
      }
    }

    const durationDays =
      options.durationDays ?? BuildingsService.LAUNCH_FEATURED_DAYS;
    const source = options.source ?? "ADMIN_GRANT";

    const { rows } = await this.db.query<{
      id: string;
      name: string;
      featured_until: Date;
    }>(
      `UPDATE buildings
       SET is_featured = TRUE,
           featured_granted_at = NOW(),
           featured_until = NOW() + ($2 * INTERVAL '1 day'),
           featured_source = $3,
           updated_at = NOW()
       WHERE id = $1
         AND is_verified = TRUE
         AND rejected_at IS NULL
       RETURNING id, name, featured_until`,
      [buildingId, durationDays, source],
    );
    if (!rows[0]) throw new NotFoundException("Verified building not found");

    await this.db.query(
      `INSERT INTO featured_grants (building_id, admin_id, source, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [buildingId, adminId, source, rows[0].featured_until],
    );

    this.exploreCache.clear();
    return {
      id: rows[0].id,
      name: rows[0].name,
      isFeatured: true,
      featuredUntil: rows[0].featured_until.toISOString(),
      source,
    };
  }

  private isFeaturedActive(row: {
    is_featured: boolean;
    featured_until?: Date | null;
  }) {
    if (!row.is_featured) return false;
    if (!row.featured_until) return true;
    return row.featured_until.getTime() > Date.now();
  }

  private async assertLandlord(buildingId: string, landlordId: string) {
    const { rows } = await this.db.query(
      "SELECT id FROM buildings WHERE id = $1 AND landlord_id = $2",
      [buildingId, landlordId],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");
  }

  private async assertPendingBuilding(buildingId: string) {
    const { rows } = await this.db.query<{
      is_verified: boolean;
      rejected_at: Date | null;
    }>("SELECT is_verified, rejected_at FROM buildings WHERE id = $1", [
      buildingId,
    ]);
    if (!rows[0]) throw new NotFoundException("Building not found");
    if (rows[0].is_verified) {
      throw new BadRequestException(
        "This building is already live. Pending edits are only allowed before approval.",
      );
    }
    if (rows[0].rejected_at) {
      throw new BadRequestException(
        "This listing was rejected. The landlord must resubmit before admin review.",
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
