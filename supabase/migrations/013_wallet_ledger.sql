-- Sprint 4: promotional wallet credits (non-withdrawable platform credit).

CREATE TYPE wallet_credit_type AS ENUM (
  'WELCOME_BONUS',
  'COUPON',
  'ADMIN_GRANT',
  'FEATURED_GRANT'
);

-- Extend payment purposes for featured boosts (S5-08).
ALTER TYPE payment_purpose ADD VALUE IF NOT EXISTS 'FEATURED';

CREATE TABLE wallet_ledger (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type         wallet_credit_type NOT NULL,
  purpose             payment_purpose NOT NULL,
  amount_ugx          INTEGER NOT NULL,
  remaining_ugx       INTEGER NOT NULL,
  quantity            INTEGER NOT NULL DEFAULT 1,
  remaining_quantity  INTEGER NOT NULL DEFAULT 1,
  expires_at          TIMESTAMPTZ,
  reference_id        TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallet_ledger_amounts_positive CHECK (
    amount_ugx > 0
    AND remaining_ugx >= 0
    AND remaining_ugx <= amount_ugx
    AND quantity > 0
    AND remaining_quantity >= 0
    AND remaining_quantity <= quantity
  )
);

CREATE INDEX wallet_ledger_user_active_idx
  ON wallet_ledger (user_id, purpose, created_at)
  WHERE remaining_quantity > 0;

-- One welcome bonus per user (PRD §5.1).
CREATE UNIQUE INDEX wallet_ledger_welcome_bonus_once_idx
  ON wallet_ledger (user_id)
  WHERE credit_type = 'WELCOME_BONUS';

CREATE TRIGGER wallet_ledger_updated_at
  BEFORE UPDATE ON wallet_ledger
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
-- No policies — Nest API uses direct Postgres (service role).
