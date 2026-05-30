-- Explore map search performance: partial indexes aligned with GET /buildings queries.

-- Verified buildings in viewport (PostGIS ST_Intersects / && on location).
CREATE INDEX IF NOT EXISTS buildings_verified_location_idx
  ON buildings USING GIST (location)
  WHERE is_verified = TRUE AND location IS NOT NULL;

-- Filter by property type on verified listings.
CREATE INDEX IF NOT EXISTS buildings_verified_type_idx
  ON buildings (building_type)
  WHERE is_verified = TRUE;

-- Country filter on verified listings.
CREATE INDEX IF NOT EXISTS buildings_verified_country_idx
  ON buildings (country_code)
  WHERE is_verified = TRUE;

-- Area text search (city / district ILIKE with country scope).
CREATE INDEX IF NOT EXISTS buildings_verified_country_city_idx
  ON buildings (country_code, city, district)
  WHERE is_verified = TRUE;

-- Available-unit filters (EXISTS / aggregates on AVAILABLE rows).
CREATE INDEX IF NOT EXISTS units_available_building_idx
  ON units (building_id)
  WHERE status = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS units_available_filter_idx
  ON units (building_id, bedrooms, bathrooms, rent_amount)
  WHERE status = 'AVAILABLE';

-- Tenant unlock overlay on map (attachMyUnlockCounts + unlocked-only buildings).
CREATE INDEX IF NOT EXISTS unit_unlocks_tenant_winner_idx
  ON unit_unlocks (tenant_id, unit_id)
  WHERE is_winner = TRUE;
