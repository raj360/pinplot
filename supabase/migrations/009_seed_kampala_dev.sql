-- DEV ONLY: extra Kampala listings for filter/map QA (~17 buildings).
-- Remove this migration's data before production (DELETE WHERE name LIKE '[DEV]%').
-- Applied once via `yarn db:migrate`.

INSERT INTO buildings (
  name, description, city, district, country_code,
  approximate_lat, approximate_lng,
  exact_address, exact_lat, exact_lng,
  total_units, is_verified, is_featured
) VALUES
  ('[DEV] Kololo Courts', 'Dev seed — premium Kololo flats.', 'Kampala', 'Kololo', 'UG', 0.3310, 32.5950, 'Kololo Hill Road', 0.3310, 32.5950, 4, TRUE, FALSE),
  ('[DEV] Bugolobi Flats', 'Dev seed — near industrial area.', 'Kampala', 'Bugolobi', 'UG', 0.3150, 32.6100, 'Bugolobi Road', 0.3150, 32.6100, 3, TRUE, FALSE),
  ('[DEV] Muyenga Heights', 'Dev seed — hill views.', 'Kampala', 'Muyenga', 'UG', 0.2950, 32.6050, 'Muyenga Road', 0.2950, 32.6050, 4, TRUE, FALSE),
  ('[DEV] Bukoto Grove', 'Dev seed — quiet Bukoto block.', 'Kampala', 'Bukoto', 'UG', 0.3580, 32.5980, 'Bukoto Street', 0.3580, 32.5980, 3, TRUE, FALSE),
  ('[DEV] Naguru Summit', 'Dev seed — Naguru ridge.', 'Kampala', 'Naguru', 'UG', 0.3380, 32.6080, 'Naguru Drive', 0.3380, 32.6080, 2, TRUE, FALSE),
  ('[DEV] Kabalagala Plaza', 'Dev seed — Kabalagala centre.', 'Kampala', 'Kabalagala', 'UG', 0.2850, 32.5850, 'Kabalagala Road', 0.2850, 32.5850, 4, TRUE, FALSE),
  ('[DEV] Makindye Bay', 'Dev seed — lakeside Makindye.', 'Kampala', 'Makindye', 'UG', 0.2780, 32.5750, 'Makindye Road', 0.2780, 32.5750, 3, TRUE, FALSE),
  ('[DEV] Wandegeya Studios', 'Dev seed — student-friendly.', 'Kampala', 'Wandegeya', 'UG', 0.3450, 32.5680, 'Wandegeya Market', 0.3450, 32.5680, 2, TRUE, FALSE),
  ('[DEV] Lubaga View', 'Dev seed — Lubaga hill.', 'Kampala', 'Lubaga', 'UG', 0.3020, 32.5520, 'Lubaga Road', 0.3020, 32.5520, 3, TRUE, FALSE),
  ('[DEV] Kasubi Gardens', 'Dev seed — Kasubi family units.', 'Kampala', 'Kasubi', 'UG', 0.3180, 32.5380, 'Kasubi Lane', 0.3180, 32.5380, 4, TRUE, FALSE),
  ('[DEV] Nateete Towers', 'Dev seed — Nateete high-rise.', 'Kampala', 'Nateete', 'UG', 0.3050, 32.5280, 'Nateete Road', 0.3050, 32.5280, 3, TRUE, FALSE),
  ('[DEV] Naalya Nest', 'Dev seed — Naalya estates.', 'Kampala', 'Naalya', 'UG', 0.3680, 32.6250, 'Naalya Road', 0.3680, 32.6250, 2, TRUE, FALSE),
  ('[DEV] Kyanja Meadows', 'Dev seed — spacious Kyanja homes.', 'Kampala', 'Kyanja', 'UG', 0.3850, 32.6150, 'Kyanja Close', 0.3850, 32.6150, 3, TRUE, FALSE),
  ('[DEV] Munyonyo Shores', 'Dev seed — Munyonyo waterfront.', 'Kampala', 'Munyonyo', 'UG', 0.2680, 32.6150, 'Munyonyo Road', 0.2680, 32.6150, 4, TRUE, FALSE),
  ('[DEV] Bunga Terrace', 'Dev seed — Bunga terraced flats.', 'Kampala', 'Bunga', 'UG', 0.2780, 32.6180, 'Bunga Hill', 0.2780, 32.6180, 3, TRUE, FALSE),
  ('[DEV] Kansanga Place', 'Dev seed — Kansanga walkable.', 'Kampala', 'Kansanga', 'UG', 0.2880, 32.6000, 'Kansanga Road', 0.2880, 32.6000, 2, TRUE, FALSE),
  ('[DEV] Speke Apartments', 'Dev seed — central Kampala.', 'Kampala', 'Kampala Central Division', 'UG', 0.3150, 32.5820, 'Speke Road', 0.3150, 32.5820, 4, TRUE, FALSE);

-- Units — varied beds/baths/rent for filter testing
INSERT INTO units (building_id, unit_number, bedrooms, bathrooms, rent_amount, status)
SELECT b.id, u.num, u.beds, u.baths, u.rent, u.st::unit_status
FROM buildings b
JOIN (VALUES
  ('[DEV] Kololo Courts', 'K1', 2, 2, 2500000, 'AVAILABLE'),
  ('[DEV] Kololo Courts', 'K2', 3, 2, 3200000, 'AVAILABLE'),
  ('[DEV] Kololo Courts', 'K3', 2, 2, 2800000, 'UNAVAILABLE'),
  ('[DEV] Bugolobi Flats', 'B1', 1, 1, 400000, 'AVAILABLE'),
  ('[DEV] Bugolobi Flats', 'B2', 1, 1, 420000, 'UNAVAILABLE'),
  ('[DEV] Bugolobi Flats', 'B3', 2, 1, 650000, 'AVAILABLE'),
  ('[DEV] Muyenga Heights', 'M1', 3, 2, 1800000, 'AVAILABLE'),
  ('[DEV] Muyenga Heights', 'M2', 2, 2, 1400000, 'AVAILABLE'),
  ('[DEV] Muyenga Heights', 'M3', 1, 1, 750000, 'UNAVAILABLE'),
  ('[DEV] Bukoto Grove', 'BG1', 2, 1, 900000, 'AVAILABLE'),
  ('[DEV] Bukoto Grove', 'BG2', 1, 1, 550000, 'AVAILABLE'),
  ('[DEV] Naguru Summit', 'N1', 1, 1, 550000, 'AVAILABLE'),
  ('[DEV] Naguru Summit', 'N2', 2, 1, 850000, 'UNAVAILABLE'),
  ('[DEV] Kabalagala Plaza', 'KP1', 2, 2, 750000, 'AVAILABLE'),
  ('[DEV] Kabalagala Plaza', 'KP2', 1, 1, 480000, 'AVAILABLE'),
  ('[DEV] Makindye Bay', 'MK1', 1, 1, 350000, 'AVAILABLE'),
  ('[DEV] Makindye Bay', 'MK2', 2, 1, 520000, 'UNAVAILABLE'),
  ('[DEV] Wandegeya Studios', 'W1', 1, 1, 450000, 'AVAILABLE'),
  ('[DEV] Wandegeya Studios', 'W2', 1, 1, 380000, 'AVAILABLE'),
  ('[DEV] Lubaga View', 'L1', 2, 1, 650000, 'AVAILABLE'),
  ('[DEV] Lubaga View', 'L2', 3, 2, 1100000, 'UNAVAILABLE'),
  ('[DEV] Kasubi Gardens', 'KS1', 3, 2, 1200000, 'AVAILABLE'),
  ('[DEV] Kasubi Gardens', 'KS2', 2, 2, 950000, 'AVAILABLE'),
  ('[DEV] Nateete Towers', 'NT1', 2, 2, 800000, 'AVAILABLE'),
  ('[DEV] Nateete Towers', 'NT2', 1, 1, 520000, 'UNAVAILABLE'),
  ('[DEV] Naalya Nest', 'NY1', 1, 1, 500000, 'AVAILABLE'),
  ('[DEV] Naalya Nest', 'NY2', 2, 1, 720000, 'AVAILABLE'),
  ('[DEV] Kyanja Meadows', 'KY1', 4, 3, 3500000, 'AVAILABLE'),
  ('[DEV] Kyanja Meadows', 'KY2', 3, 2, 2200000, 'AVAILABLE'),
  ('[DEV] Munyonyo Shores', 'MU1', 2, 2, 1500000, 'AVAILABLE'),
  ('[DEV] Munyonyo Shores', 'MU2', 3, 2, 2100000, 'UNAVAILABLE'),
  ('[DEV] Bunga Terrace', 'BT1', 2, 1, 950000, 'AVAILABLE'),
  ('[DEV] Bunga Terrace', 'BT2', 1, 1, 600000, 'AVAILABLE'),
  ('[DEV] Kansanga Place', 'KA1', 1, 1, 420000, 'AVAILABLE'),
  ('[DEV] Kansanga Place', 'KA2', 2, 1, 680000, 'UNAVAILABLE'),
  ('[DEV] Speke Apartments', 'S1', 2, 1, 500000, 'AVAILABLE'),
  ('[DEV] Speke Apartments', 'S2', 2, 1, 550000, 'AVAILABLE'),
  ('[DEV] Speke Apartments', 'S3', 1, 1, 380000, 'UNAVAILABLE')
) AS u(building_name, num, beds, baths, rent, st)
  ON b.name = u.building_name;
