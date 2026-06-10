import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type SavedBuildingSummary = {
  id: string;
  name: string;
  city: string;
  district: string | null;
  countryCode: string;
  buildingType: string;
  availableUnitCount: number;
  rentFrom: number | null;
  currency: string;
  rentPeriod?: string | null;
  coverThumbUrl?: string;
  isFeatured: boolean;
  savedAt: string;
};

@Injectable()
export class SavedBuildingsService {
  constructor(private readonly db: DatabaseService) {}

  async listMine(tenantId: string): Promise<SavedBuildingSummary[]> {
    const { rows } = await this.db.query(
      `SELECT b.id, b.name, b.city, b.district, b.country_code, b.building_type,
              b.is_featured, b.featured_until, sb.created_at AS saved_at,
              co.currency,
              COUNT(u.id) FILTER (WHERE u.status = 'AVAILABLE') AS available_unit_count,
              MIN(u.rent_amount) FILTER (WHERE u.status = 'AVAILABLE') AS rent_from,
              (SELECT u_rp.rent_period::text
               FROM units u_rp
               WHERE u_rp.building_id = b.id AND u_rp.status = 'AVAILABLE'
               ORDER BY u_rp.rent_amount ASC
               LIMIT 1) AS rent_period,
              b.cover_image_thumb_path
       FROM saved_buildings sb
       JOIN buildings b ON b.id = sb.building_id
       JOIN countries co ON co.code = b.country_code
       LEFT JOIN units u ON u.building_id = b.id
       WHERE sb.tenant_id = $1
         AND b.is_verified = TRUE
       GROUP BY b.id, co.currency, sb.created_at, b.cover_image_thumb_path
       ORDER BY sb.created_at DESC`,
      [tenantId],
    );

    return rows.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      city: row.city as string,
      district: (row.district as string | null) ?? null,
      countryCode: row.country_code as string,
      buildingType: row.building_type as string,
      availableUnitCount: Number(row.available_unit_count ?? 0),
      rentFrom: row.rent_from != null ? Number(row.rent_from) : null,
      currency: row.currency as string,
      rentPeriod: (row.rent_period as string | null) ?? null,
      coverThumbUrl: (row.cover_image_thumb_path as string | null) ?? undefined,
      isFeatured: Boolean(row.is_featured) && this.isFeaturedActive(row),
      savedAt: (row.saved_at as Date).toISOString(),
    }));
  }

  async listSavedIds(tenantId: string): Promise<string[]> {
    const { rows } = await this.db.query<{ building_id: string }>(
      `SELECT sb.building_id
       FROM saved_buildings sb
       JOIN buildings b ON b.id = sb.building_id
       WHERE sb.tenant_id = $1 AND b.is_verified = TRUE`,
      [tenantId],
    );
    return rows.map((row) => row.building_id);
  }

  async save(tenantId: string, buildingId: string) {
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM buildings WHERE id = $1 AND is_verified = TRUE`,
      [buildingId],
    );
    if (!rows[0]) {
      throw new NotFoundException("Building not found");
    }

    await this.db.query(
      `INSERT INTO saved_buildings (tenant_id, building_id)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id, building_id) DO NOTHING`,
      [tenantId, buildingId],
    );

    return { saved: true, buildingId };
  }

  async unsave(tenantId: string, buildingId: string) {
    const { rowCount } = await this.db.query(
      `DELETE FROM saved_buildings
       WHERE tenant_id = $1 AND building_id = $2`,
      [tenantId, buildingId],
    );
    if (!rowCount) {
      throw new NotFoundException("Saved building not found");
    }
    return { saved: false, buildingId };
  }

  private isFeaturedActive(row: Record<string, unknown>) {
    if (!row.is_featured) return false;
    const until = row.featured_until as Date | null;
    if (!until) return true;
    return new Date(until) > new Date();
  }
}
