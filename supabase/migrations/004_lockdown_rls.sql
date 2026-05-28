-- Lock down sensitive tables from Supabase Data API (anon/authenticated).
-- NestJS uses direct Postgres connection; app reads/writes via API only.

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE _plotpin_migrations ENABLE ROW LEVEL SECURITY;

-- Public reference data
CREATE POLICY countries_public_read ON countries
  FOR SELECT USING (is_active = TRUE);

-- buildings: remove anon direct SELECT (exact_address leak); browse via NestJS API or buildings_browse view
DROP POLICY IF EXISTS buildings_public_read ON buildings;
CREATE OR REPLACE VIEW buildings_browse AS
SELECT
  id,
  name,
  description,
  city,
  district,
  country_code,
  approximate_lat,
  approximate_lng,
  total_units,
  cover_image_path,
  is_verified,
  is_featured,
  created_at
FROM buildings
WHERE is_verified = TRUE;

GRANT SELECT ON buildings_browse TO anon, authenticated;

-- Sensitive tables: no policies = deny via PostgREST for anon/authenticated
