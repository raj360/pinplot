-- Optional second phone + verification timestamps (SMS verification in a later sprint).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_secondary TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_secondary_verified_at TIMESTAMPTZ;
