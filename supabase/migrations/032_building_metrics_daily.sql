-- Sprint 5H.1 — daily listing metrics rollup (feeds landlord/admin dashboards at scale)

CREATE TABLE building_metrics_daily (
  building_id    UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  metric_date    DATE NOT NULL,
  impressions    INTEGER NOT NULL DEFAULT 0,
  detail_views   INTEGER NOT NULL DEFAULT 0,
  unlock_clicks  INTEGER NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (building_id, metric_date)
);

CREATE INDEX building_metrics_daily_date_idx
  ON building_metrics_daily (metric_date DESC);

ALTER TABLE building_metrics_daily ENABLE ROW LEVEL SECURITY;
