-- Backfill countries.map_center / map_bounds from geo_places for diaspora browse.
-- Preserves manually configured supply markets (only rows with NULL map_center_lat).
-- Safe to re-run; skipped countries have no geo_places rows (e.g. KP, ER).

WITH best AS (
  SELECT DISTINCT ON (country_code)
    country_code,
    center_lat,
    center_lng,
    bounds_north,
    bounds_south,
    bounds_east,
    bounds_west
  FROM geo_places
  ORDER BY
    country_code,
    CASE kind
      WHEN 'city' THEN 1
      WHEN 'district' THEN 2
      WHEN 'region' THEN 3
      ELSE 4
    END,
    population DESC NULLS LAST,
    sort_order DESC
)
UPDATE countries c
SET
  map_center_lat = best.center_lat,
  map_center_lng = best.center_lng,
  map_bounds_north = best.bounds_north,
  map_bounds_south = best.bounds_south,
  map_bounds_east = best.bounds_east,
  map_bounds_west = best.bounds_west
FROM best
WHERE c.code = best.country_code
  AND c.is_active = TRUE
  AND c.map_center_lat IS NULL;
