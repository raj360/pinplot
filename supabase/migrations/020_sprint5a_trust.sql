-- Sprint 5A: trust, terms acceptance, listing reports, profile suspension

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS landlord_terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tenant_unlock_terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS ownership_attested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_checklist JSONB,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE TYPE listing_report_status AS ENUM ('OPEN', 'REVIEWED', 'DISMISSED');

CREATE TABLE listing_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  reporter_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  details         TEXT,
  status          listing_report_status NOT NULL DEFAULT 'OPEN',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes     TEXT
);

CREATE INDEX listing_reports_open_idx
  ON listing_reports (status, created_at DESC)
  WHERE status = 'OPEN';

CREATE INDEX listing_reports_building_idx ON listing_reports (building_id);

CREATE INDEX listing_reports_reporter_idx ON listing_reports (reporter_id);
