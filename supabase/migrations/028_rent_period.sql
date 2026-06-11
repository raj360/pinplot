-- Stay class: monthly vs nightly rent + unlock policy (Sprint 5G / R-01).

CREATE TYPE rent_period AS ENUM ('month', 'day');

ALTER TABLE units
  ADD COLUMN IF NOT EXISTS rent_period rent_period NOT NULL DEFAULT 'month';

-- Short-stay inventory defaults to nightly rent.
UPDATE units u
SET rent_period = 'day'
FROM buildings b
WHERE b.id = u.building_id
  AND b.building_type = 'airbnb';

COMMENT ON COLUMN units.rent_period IS
  'month = long-term lease display + 72h exclusive unlock; day = nightly + 24h contact access without unit lock.';
