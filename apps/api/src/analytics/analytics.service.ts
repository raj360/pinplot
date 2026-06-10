import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import type { ListingAnalyticsEventDto } from "./dto/track-events.dto";

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  async trackEvents(
    events: ListingAnalyticsEventDto[],
    options: {
      viewerId?: string | null;
      sessionId?: string | null;
      countryCode?: string | null;
    },
  ): Promise<number> {
    if (events.length === 0) return 0;

    let inserted = 0;
    for (const event of events) {
      const { rowCount } = await this.db.query(
        `INSERT INTO listing_analytics_events (
           event_type, building_id, unit_id, viewer_id, session_id, source, country_code
         )
         SELECT $1, $2, $3, $4, $5, $6, $7
         WHERE EXISTS (SELECT 1 FROM buildings b WHERE b.id = $2 AND b.is_verified = TRUE)`,
        [
          event.eventType,
          event.buildingId,
          event.unitId ?? null,
          options.viewerId ?? null,
          options.sessionId ?? null,
          event.source ?? null,
          options.countryCode?.toUpperCase() ?? null,
        ],
      );
      inserted += rowCount ?? 0;
    }
    return inserted;
  }

  async getBuildingMetrics(buildingId: string, days = 30) {
    const capped = Math.min(Math.max(days, 1), 90);
    const { rows } = await this.db.query<{
      event_type: string;
      count: string;
    }>(
      `SELECT event_type, COUNT(*)::text AS count
       FROM listing_analytics_events
       WHERE building_id = $1
         AND created_at >= NOW() - ($2::text || ' days')::interval
       GROUP BY event_type`,
      [buildingId, String(capped)],
    );

    const counts = Object.fromEntries(
      rows.map((row) => [row.event_type, Number(row.count)]),
    );
    const impressions = counts.IMPRESSION ?? 0;
    const detailViews = counts.DETAIL_VIEW ?? 0;
    const unlockClicks = counts.UNLOCK_CLICK ?? 0;

    const { rows: unlockRows } = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       WHERE u.building_id = $1
         AND uu.is_winner = TRUE
         AND uu.created_at >= NOW() - ($2::text || ' days')::interval`,
      [buildingId, String(capped)],
    );
    const unlocks = Number(unlockRows[0]?.count ?? 0);

    return {
      days: capped,
      impressions,
      detailViews,
      unlockClicks,
      unlocks,
      detailViewRate:
        impressions > 0 ? Math.round((detailViews / impressions) * 1000) / 10 : 0,
      unlockClickRate:
        detailViews > 0 ? Math.round((unlockClicks / detailViews) * 1000) / 10 : 0,
      unlockConversionRate:
        detailViews > 0 ? Math.round((unlocks / detailViews) * 1000) / 10 : 0,
    };
  }

  async getAdminOverview(days = 30) {
    const capped = Math.min(Math.max(days, 1), 90);
    const { rows: topBuildings } = await this.db.query<{
      building_id: string;
      building_name: string;
      is_featured: boolean;
      impressions: string;
      detail_views: string;
      unlock_clicks: string;
    }>(
      `SELECT b.id AS building_id,
              b.name AS building_name,
              b.is_featured,
              COUNT(*) FILTER (WHERE e.event_type = 'IMPRESSION')::text AS impressions,
              COUNT(*) FILTER (WHERE e.event_type = 'DETAIL_VIEW')::text AS detail_views,
              COUNT(*) FILTER (WHERE e.event_type = 'UNLOCK_CLICK')::text AS unlock_clicks
       FROM listing_analytics_events e
       JOIN buildings b ON b.id = e.building_id
       WHERE e.created_at >= NOW() - ($1::text || ' days')::interval
       GROUP BY b.id, b.name, b.is_featured
       ORDER BY COUNT(*) FILTER (WHERE e.event_type = 'DETAIL_VIEW') DESC
       LIMIT 10`,
      [String(capped)],
    );

    const { rows: featuredCompare } = await this.db.query<{
      is_featured: boolean;
      impressions: string;
      detail_views: string;
    }>(
      `SELECT b.is_featured,
              COUNT(*) FILTER (WHERE e.event_type = 'IMPRESSION')::text AS impressions,
              COUNT(*) FILTER (WHERE e.event_type = 'DETAIL_VIEW')::text AS detail_views
       FROM listing_analytics_events e
       JOIN buildings b ON b.id = e.building_id
       WHERE e.created_at >= NOW() - ($1::text || ' days')::interval
       GROUP BY b.is_featured`,
      [String(capped)],
    );

    return {
      days: capped,
      topBuildings: topBuildings.map((row) => ({
        buildingId: row.building_id,
        buildingName: row.building_name,
        isFeatured: row.is_featured,
        impressions: Number(row.impressions),
        detailViews: Number(row.detail_views),
        unlockClicks: Number(row.unlock_clicks),
        detailViewRate:
          Number(row.impressions) > 0
            ? Math.round(
                (Number(row.detail_views) / Number(row.impressions)) * 1000,
              ) / 10
            : 0,
      })),
      featuredComparison: featuredCompare.map((row) => ({
        isFeatured: row.is_featured,
        impressions: Number(row.impressions),
        detailViews: Number(row.detail_views),
        detailViewRate:
          Number(row.impressions) > 0
            ? Math.round(
                (Number(row.detail_views) / Number(row.impressions)) * 1000,
              ) / 10
            : 0,
      })),
    };
  }
}
