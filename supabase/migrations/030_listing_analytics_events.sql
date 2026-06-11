-- Sprint 5H: listing impression / detail view / unlock funnel events

CREATE TABLE listing_analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL CHECK (event_type IN ('IMPRESSION', 'DETAIL_VIEW', 'UNLOCK_CLICK')),
  building_id  UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id      UUID REFERENCES units(id) ON DELETE SET NULL,
  viewer_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id   TEXT,
  source       TEXT,
  country_code CHAR(2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX listing_analytics_events_building_created_idx
  ON listing_analytics_events (building_id, created_at DESC);

CREATE INDEX listing_analytics_events_type_created_idx
  ON listing_analytics_events (event_type, created_at DESC);

ALTER TABLE listing_analytics_events ENABLE ROW LEVEL SECURITY;
