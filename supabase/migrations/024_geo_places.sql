-- Search-area catalog: regions, districts, cities, and manual neighborhoods.
-- Seeded from GeoNames bulk dumps + manual overrides (scripts/seed-geo-places.mjs).
-- Served via GET /api/v1/geo/places — zero Google API cost at runtime.

CREATE TYPE geo_place_kind AS ENUM ('region', 'district', 'city', 'neighborhood');

CREATE TABLE geo_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code CHAR(2) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  kind geo_place_kind NOT NULL,
  parent_id UUID REFERENCES geo_places(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  bounds_north DOUBLE PRECISION NOT NULL,
  bounds_south DOUBLE PRECISION NOT NULL,
  bounds_east DOUBLE PRECISION NOT NULL,
  bounds_west DOUBLE PRECISION NOT NULL,
  population INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'geonames',
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country_code, slug)
);

CREATE INDEX geo_places_country_kind_idx
  ON geo_places (country_code, kind);

CREATE INDEX geo_places_country_sort_idx
  ON geo_places (country_code, sort_order DESC, population DESC NULLS LAST);

CREATE INDEX geo_places_parent_idx ON geo_places (parent_id);

COMMENT ON TABLE geo_places IS
  'Cached admin divisions and cities for the explore Where picker. Seeded offline; no live geocoder calls.';
