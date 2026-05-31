-- Sprint 4: tiered pricing by building type + bedrooms (quote API; payment in Sprint 5).

CREATE TABLE pricing_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    CHAR(2) NOT NULL REFERENCES countries(code),
  building_type   building_type,
  bedrooms_min    INTEGER NOT NULL DEFAULT 0,
  bedrooms_max    INTEGER,
  unlock_fee_ugx  INTEGER NOT NULL,
  listing_fee_ugx INTEGER NOT NULL,
  label           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_rules_bedroom_range CHECK (
    bedrooms_max IS NULL OR bedrooms_max >= bedrooms_min
  ),
  CONSTRAINT pricing_rules_fees_positive CHECK (
    unlock_fee_ugx > 0 AND listing_fee_ugx > 0
  )
);

CREATE INDEX pricing_rules_lookup_idx
  ON pricing_rules (country_code, is_active, building_type, bedrooms_min);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
-- No policies — API uses service role / direct Postgres only.

-- Uganda tiers (most specific match wins in quote service).
INSERT INTO pricing_rules (
  country_code, building_type, bedrooms_min, bedrooms_max,
  unlock_fee_ugx, listing_fee_ugx, label, sort_order
) VALUES
  ('UG', 'studio', 0, 0, 15000, 25000, 'Studio', 10),
  ('UG', 'airbnb', 0, 1, 18000, 28000, 'Short-stay · 0–1 bed', 20),
  ('UG', 'apartment', 0, 2, 20000, 30000, 'Apartment · up to 2 bed', 30),
  ('UG', 'bungalow', 1, 3, 22000, 32000, 'Bungalow · 1–3 bed', 40),
  ('UG', 'house', 2, NULL, 25000, 35000, 'House · 2+ bed', 50),
  ('UG', NULL, 0, NULL, 20000, 30000, 'Default', 100);
