-- PlotPin initial schema (Supabase / PostGIS)
-- Run via Supabase CLI or apply to local PostGIS docker compose

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ─── Countries & pricing ───────────────────────────────────────────────────

CREATE TABLE countries (
  code            CHAR(2) PRIMARY KEY,
  name            TEXT NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'UGX',
  tenant_unlock_fee   INTEGER NOT NULL DEFAULT 20000,
  landlord_listing_fee INTEGER NOT NULL DEFAULT 30000,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO countries (code, name, currency, tenant_unlock_fee, landlord_listing_fee)
VALUES ('UG', 'Uganda', 'UGX', 20000, 30000)
ON CONFLICT (code) DO NOTHING;

-- ─── Profiles (extends Supabase auth.users) ────────────────────────────────

CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'ADMIN', 'LANDLORD', 'TENANT');

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'TENANT',
  first_name      TEXT,
  last_name       TEXT,
  phone           TEXT,
  country_code    CHAR(2) NOT NULL DEFAULT 'UG' REFERENCES countries(code),
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Buildings & units ─────────────────────────────────────────────────────

CREATE TABLE buildings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  managed_by_admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  city                TEXT NOT NULL,
  district            TEXT,
  country_code        CHAR(2) NOT NULL DEFAULT 'UG' REFERENCES countries(code),
  approximate_lat     DOUBLE PRECISION NOT NULL,
  approximate_lng     DOUBLE PRECISION NOT NULL,
  exact_address       TEXT,
  exact_lat           DOUBLE PRECISION,
  exact_lng           DOUBLE PRECISION,
  location            GEOGRAPHY(POINT, 4326),
  total_units         INTEGER NOT NULL DEFAULT 1,
  cover_image_path    TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX buildings_location_idx ON buildings USING GIST (location);
CREATE INDEX buildings_country_city_idx ON buildings (country_code, city);

CREATE TYPE unit_status AS ENUM ('UNAVAILABLE', 'AVAILABLE', 'LOCKED', 'RENTED');

CREATE TABLE units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id         UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  unit_number         TEXT NOT NULL,
  bedrooms            INTEGER NOT NULL DEFAULT 1,
  bathrooms           INTEGER NOT NULL DEFAULT 1,
  rent_amount         INTEGER NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'UGX',
  status              unit_status NOT NULL DEFAULT 'UNAVAILABLE',
  locked_by_tenant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  locked_until        TIMESTAMPTZ,
  floor_plan_path     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (building_id, unit_number)
);

CREATE INDEX units_building_status_idx ON units (building_id, status);

CREATE TABLE unit_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  unit_id     UUID REFERENCES units(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (building_id IS NOT NULL OR unit_id IS NOT NULL)
);

-- ─── Payments & unlocks ──────────────────────────────────────────────────────

CREATE TYPE payment_provider AS ENUM ('STRIPE', 'FLUTTERWAVE');
CREATE TYPE payment_purpose AS ENUM ('LISTING', 'UNLOCK');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider        payment_provider NOT NULL,
  purpose         payment_purpose NOT NULL,
  amount          INTEGER NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'UGX',
  status          payment_status NOT NULL DEFAULT 'PENDING',
  external_ref    TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE listing_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id  UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  old_status  unit_status NOT NULL,
  new_status  unit_status NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unit_unlocks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                 UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  tenant_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id              UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  is_winner               BOOLEAN NOT NULL DEFAULT FALSE,
  revealed_contact_phone  TEXT,
  revealed_exact_address  TEXT,
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (unit_id, tenant_id)
);

-- ─── Saved buildings ─────────────────────────────────────────────────────────

CREATE TABLE saved_buildings (
  tenant_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, building_id)
);

-- ─── Updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Sync geography from lat/lng ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_building_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approximate_lat IS NOT NULL AND NEW.approximate_lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(
      ST_MakePoint(NEW.approximate_lng, NEW.approximate_lat),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buildings_sync_location BEFORE INSERT OR UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION sync_building_location();
