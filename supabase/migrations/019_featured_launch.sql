-- Featured launch program (S4-18): grant metadata + audit log.

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_granted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_source TEXT;

ALTER TABLE buildings
  ADD CONSTRAINT buildings_featured_source_check
  CHECK (
    featured_source IS NULL
    OR featured_source IN (
      'LAUNCH_GRANT',
      'ADMIN_GRANT',
      'PAID',
      'COUPON',
      'CREDIT'
    )
  );

CREATE TABLE IF NOT EXISTS featured_grants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id   UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  admin_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source        TEXT NOT NULL,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS featured_grants_building_idx
  ON featured_grants (building_id, granted_at DESC);

COMMENT ON TABLE featured_grants IS 'Audit trail for admin/launch featured grants (S4-18).';
