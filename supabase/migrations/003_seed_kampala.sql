-- Seed Kampala buildings for dev/demo (no landlord — admin-managed)

INSERT INTO buildings (
  name, description, city, district, country_code,
  approximate_lat, approximate_lng,
  exact_address, exact_lat, exact_lng,
  total_units, is_verified, is_featured
) VALUES
(
  'Sunset Apartments',
  'Modern flats near Namuwongo with 24/7 security and parking.',
  'Kampala', 'Namuwongo', 'UG',
  0.3085, 32.5892,
  'Plot 12, Namuwongo Road, Kampala', 0.3085, 32.5892,
  12, TRUE, TRUE
),
(
  'Green View Flats',
  'Quiet residential block close to Ntinda shopping centre.',
  'Kampala', 'Ntinda', 'UG',
  0.3521, 32.6134,
  'Block B, Ntinda Complex, Kampala', 0.3521, 32.6134,
  8, TRUE, FALSE
),
(
  'City Gate Residences',
  'Premium units in Nakasero with generator backup.',
  'Kampala', 'Nakasero', 'UG',
  0.3276, 32.5821,
  'City Gate Tower, Nakasero, Kampala', 0.3276, 32.5821,
  16, TRUE, TRUE
);

-- Units for Sunset Apartments (12 units)
INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, status)
SELECT b.id, n.num, n.beds, n.baths, n.rent, n.st::unit_status
FROM buildings b
CROSS JOIN (VALUES
  ('1A', 1, 1, 450000, 'UNAVAILABLE'),
  ('1B', 1, 1, 450000, 'UNAVAILABLE'),
  ('2A', 2, 1, 600000, 'AVAILABLE'),
  ('2B', 2, 1, 600000, 'UNAVAILABLE'),
  ('3A', 2, 2, 750000, 'AVAILABLE'),
  ('3B', 2, 2, 750000, 'UNAVAILABLE'),
  ('4A', 3, 2, 900000, 'UNAVAILABLE'),
  ('4B', 3, 2, 900000, 'UNAVAILABLE'),
  ('5A', 1, 1, 500000, 'UNAVAILABLE'),
  ('5B', 1, 1, 500000, 'UNAVAILABLE'),
  ('6A', 2, 1, 650000, 'UNAVAILABLE'),
  ('6B', 2, 1, 650000, 'UNAVAILABLE')
) AS n(num, beds, baths, rent, st)
WHERE b.name = 'Sunset Apartments';

-- Units for Green View Flats
INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, status)
SELECT b.id, n.num, n.beds, n.baths, n.rent, n.st::unit_status
FROM buildings b
CROSS JOIN (VALUES
  ('G1', 1, 1, 550000, 'AVAILABLE'),
  ('G2', 2, 1, 700000, 'UNAVAILABLE'),
  ('G3', 2, 2, 850000, 'UNAVAILABLE'),
  ('G4', 1, 1, 500000, 'UNAVAILABLE')
) AS n(num, beds, baths, rent, st)
WHERE b.name = 'Green View Flats';

-- Units for City Gate Residences
INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, status)
SELECT b.id, n.num, n.beds, n.baths, n.rent, n.st::unit_status
FROM buildings b
CROSS JOIN (VALUES
  ('101', 2, 2, 1200000, 'AVAILABLE'),
  ('102', 2, 2, 1200000, 'AVAILABLE'),
  ('201', 3, 2, 1500000, 'AVAILABLE'),
  ('202', 3, 2, 1500000, 'UNAVAILABLE')
) AS n(num, beds, baths, rent, st)
WHERE b.name = 'City Gate Residences';
