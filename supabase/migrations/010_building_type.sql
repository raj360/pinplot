-- Property type for explore filters and landlord listings.

CREATE TYPE building_type AS ENUM (
  'apartment',
  'studio',
  'bungalow',
  'house',
  'airbnb'
);

ALTER TABLE buildings
  ADD COLUMN building_type building_type NOT NULL DEFAULT 'apartment';

-- Original Kampala seed
UPDATE buildings SET building_type = 'apartment'
WHERE name IN ('Sunset Apartments', 'Green View Flats', 'City Gate Residences');

-- Dev seed — varied types for filter QA
UPDATE buildings SET building_type = 'studio' WHERE name = '[DEV] Wandegeya Studios';
UPDATE buildings SET building_type = 'bungalow' WHERE name IN (
  '[DEV] Bukoto Grove',
  '[DEV] Munyonyo Shores'
);
UPDATE buildings SET building_type = 'house' WHERE name IN (
  '[DEV] Makindye Bay',
  '[DEV] Kasubi Gardens',
  '[DEV] Kyanja Meadows'
);
