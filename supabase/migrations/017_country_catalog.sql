-- Country catalog: map defaults + display locale for diaspora bootstrap (S4-14).

ALTER TABLE countries
  ADD COLUMN IF NOT EXISTS display_locale TEXT NOT NULL DEFAULT 'en-UG',
  ADD COLUMN IF NOT EXISTS map_center_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS map_center_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS map_bounds_north DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS map_bounds_south DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS map_bounds_east DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS map_bounds_west DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS default_map_zoom SMALLINT NOT NULL DEFAULT 12;

UPDATE countries
SET
  display_locale = 'en-UG',
  map_center_lat = 0.3476,
  map_center_lng = 32.5825,
  map_bounds_north = 0.40,
  map_bounds_south = 0.28,
  map_bounds_east = 32.72,
  map_bounds_west = 32.52,
  default_map_zoom = 13
WHERE code = 'UG';

INSERT INTO countries (
  code, name, currency, tenant_unlock_fee, landlord_listing_fee,
  display_locale, map_center_lat, map_center_lng,
  map_bounds_north, map_bounds_south, map_bounds_east, map_bounds_west,
  default_map_zoom, is_active
) VALUES
  (
    'GB', 'United Kingdom', 'GBP', 20000, 30000,
    'en-GB', 51.5074, -0.1278,
    51.61, 51.40, 0.04, -0.31,
    12, TRUE
  ),
  (
    'US', 'United States', 'USD', 20000, 30000,
    'en-US', 40.7128, -74.0060,
    40.82, 40.64, -73.89, -74.12,
    12, TRUE
  ),
  (
    'KE', 'Kenya', 'KES', 20000, 30000,
    'en-KE', -1.2921, 36.8219,
    -1.19, -1.44, 37.01, 36.73,
    13, TRUE
  ),
  (
    'TZ', 'Tanzania', 'TZS', 20000, 30000,
    'en-TZ', -6.7924, 39.2083,
    -6.65, -6.95, 39.35, 39.05,
    12, TRUE
  ),
  (
    'RW', 'Rwanda', 'RWF', 20000, 30000,
    'en-RW', -1.9403, 29.8739,
    -1.85, -2.05, 30.05, 29.70,
    13, TRUE
  ),
  (
    'NG', 'Nigeria', 'NGN', 20000, 30000,
    'en-NG', 6.5244, 3.3792,
    6.65, 6.40, 3.55, 3.20,
    12, TRUE
  ),
  (
    'ZA', 'South Africa', 'ZAR', 20000, 30000,
    'en-ZA', -26.2041, 28.0473,
    -25.95, -26.45, 28.25, 27.85,
    12, TRUE
  ),
  (
    'AE', 'United Arab Emirates', 'AED', 20000, 30000,
    'en-AE', 25.2048, 55.2708,
    25.35, 25.05, 55.45, 55.05,
    12, TRUE
  ),
  (
    'CA', 'Canada', 'CAD', 20000, 30000,
    'en-CA', 43.6532, -79.3832,
    43.78, 43.58, -79.25, -79.55,
    12, TRUE
  ),
  (
    'DE', 'Germany', 'EUR', 20000, 30000,
    'de-DE', 52.5200, 13.4050,
    52.62, 52.42, 13.55, 13.22,
    12, TRUE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  currency = EXCLUDED.currency,
  display_locale = EXCLUDED.display_locale,
  map_center_lat = EXCLUDED.map_center_lat,
  map_center_lng = EXCLUDED.map_center_lng,
  map_bounds_north = EXCLUDED.map_bounds_north,
  map_bounds_south = EXCLUDED.map_bounds_south,
  map_bounds_east = EXCLUDED.map_bounds_east,
  map_bounds_west = EXCLUDED.map_bounds_west,
  default_map_zoom = EXCLUDED.default_map_zoom,
  is_active = EXCLUDED.is_active;
