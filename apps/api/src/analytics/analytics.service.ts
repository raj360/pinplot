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
           event_type, building_id, unit_id, unlock_id, viewer_id, session_id, source, country_code
         )
         SELECT $1, $2, $3, $4, $5, $6, $7, $8
         WHERE EXISTS (SELECT 1 FROM buildings b WHERE b.id = $2 AND b.is_verified = TRUE)`,
        [
          event.eventType,
          event.buildingId,
          event.unitId ?? null,
          event.unlockId ?? null,
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

  async refreshDailyRollups(lookbackDays = 3): Promise<number> {
    const capped = Math.min(Math.max(lookbackDays, 1), 14);
    const { rowCount } = await this.db.query(
      `INSERT INTO building_metrics_daily (
         building_id, metric_date, impressions, detail_views, unlock_clicks, updated_at
       )
       SELECT building_id,
              (created_at AT TIME ZONE 'UTC')::date AS metric_date,
              COUNT(*) FILTER (WHERE event_type = 'IMPRESSION')::int,
              COUNT(*) FILTER (WHERE event_type = 'DETAIL_VIEW')::int,
              COUNT(*) FILTER (WHERE event_type = 'UNLOCK_CLICK')::int,
              NOW()
       FROM listing_analytics_events
       WHERE created_at >= (CURRENT_DATE - $1::int)
       GROUP BY building_id, (created_at AT TIME ZONE 'UTC')::date
       ON CONFLICT (building_id, metric_date) DO UPDATE SET
         impressions = EXCLUDED.impressions,
         detail_views = EXCLUDED.detail_views,
         unlock_clicks = EXCLUDED.unlock_clicks,
         updated_at = NOW()`,
      [capped],
    );
    return rowCount ?? 0;
  }

  private async sumRollupMetrics(buildingId: string, days: number) {
    const { rows } = await this.db.query<{
      impressions: string;
      detail_views: string;
      unlock_clicks: string;
    }>(
      `SELECT COALESCE(SUM(impressions), 0)::text AS impressions,
              COALESCE(SUM(detail_views), 0)::text AS detail_views,
              COALESCE(SUM(unlock_clicks), 0)::text AS unlock_clicks
       FROM building_metrics_daily
       WHERE building_id = $1
         AND metric_date >= (CURRENT_DATE - ($2::text || ' days')::interval)::date`,
      [buildingId, String(days)],
    );
    return {
      impressions: Number(rows[0]?.impressions ?? 0),
      detailViews: Number(rows[0]?.detail_views ?? 0),
      unlockClicks: Number(rows[0]?.unlock_clicks ?? 0),
    };
  }

  async getBuildingMetrics(buildingId: string, days = 30) {
    const capped = Math.min(Math.max(days, 1), 90);
    let { impressions, detailViews, unlockClicks } =
      await this.sumRollupMetrics(buildingId, capped);

    if (impressions + detailViews + unlockClicks === 0) {
      const live = await this.metricsFromRawEvents(buildingId, capped);
      impressions = live.impressions;
      detailViews = live.detailViews;
      unlockClicks = live.unlockClicks;
    }

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

  private async metricsFromRawEvents(buildingId: string, days: number) {
    const { rows } = await this.db.query<{
      event_type: string;
      count: string;
    }>(
      `SELECT event_type, COUNT(*)::text AS count
       FROM listing_analytics_events
       WHERE building_id = $1
         AND created_at >= NOW() - ($2::text || ' days')::interval
       GROUP BY event_type`,
      [buildingId, String(days)],
    );
    const counts = Object.fromEntries(
      rows.map((row) => [row.event_type, Number(row.count)]),
    );
    return {
      impressions: counts.IMPRESSION ?? 0,
      detailViews: counts.DETAIL_VIEW ?? 0,
      unlockClicks: counts.UNLOCK_CLICK ?? 0,
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
              COALESCE(SUM(m.impressions), 0)::text AS impressions,
              COALESCE(SUM(m.detail_views), 0)::text AS detail_views,
              COALESCE(SUM(m.unlock_clicks), 0)::text AS unlock_clicks
       FROM building_metrics_daily m
       JOIN buildings b ON b.id = m.building_id
       WHERE m.metric_date >= (CURRENT_DATE - ($1::text || ' days')::interval)::date
       GROUP BY b.id, b.name, b.is_featured
       ORDER BY COALESCE(SUM(m.detail_views), 0) DESC
       LIMIT 10`,
      [String(capped)],
    );

    let featuredCompare = await this.featuredComparisonFromRollup(capped);
    if (featuredCompare.length === 0) {
      featuredCompare = await this.featuredComparisonFromEvents(capped);
    }

    let top = topBuildings;
    if (top.length === 0) {
      top = await this.topBuildingsFromEvents(capped);
    }

    return {
      days: capped,
      topBuildings: top.map((row) => ({
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

  private async topBuildingsFromEvents(days: number) {
    const { rows } = await this.db.query<{
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
      [String(days)],
    );
    return rows;
  }

  private async featuredComparisonFromRollup(days: number) {
    const { rows } = await this.db.query<{
      is_featured: boolean;
      impressions: string;
      detail_views: string;
    }>(
      `SELECT b.is_featured,
              COALESCE(SUM(m.impressions), 0)::text AS impressions,
              COALESCE(SUM(m.detail_views), 0)::text AS detail_views
       FROM building_metrics_daily m
       JOIN buildings b ON b.id = m.building_id
       WHERE m.metric_date >= (CURRENT_DATE - ($1::text || ' days')::interval)::date
       GROUP BY b.is_featured`,
      [String(days)],
    );
    return rows;
  }

  private async featuredComparisonFromEvents(days: number) {
    const { rows } = await this.db.query<{
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
      [String(days)],
    );
    return rows;
  }
}
