-- Sprint 5B (S4-20): diaspora / international unlock tiers (UGX canonical; LS converts at checkout)

INSERT INTO pricing_rules (
  country_code, building_type, bedrooms_min, bedrooms_max,
  unlock_fee_ugx, listing_fee_ugx, label, sort_order
) VALUES
  ('GB', NULL, 0, NULL, 22000, 30000, 'UK · default', 100),
  ('US', NULL, 0, NULL, 22000, 30000, 'US · default', 100),
  ('KE', NULL, 0, NULL, 20000, 30000, 'Kenya · default', 100),
  ('TZ', NULL, 0, NULL, 20000, 30000, 'Tanzania · default', 100),
  ('RW', NULL, 0, NULL, 20000, 30000, 'Rwanda · default', 100),
  ('NG', NULL, 0, NULL, 20000, 30000, 'Nigeria · default', 100),
  ('ZA', NULL, 0, NULL, 22000, 30000, 'South Africa · default', 100),
  ('AE', NULL, 0, NULL, 24000, 30000, 'UAE · default', 100),
  ('CA', NULL, 0, NULL, 22000, 30000, 'Canada · default', 100),
  ('DE', NULL, 0, NULL, 22000, 30000, 'Germany · default', 100);
