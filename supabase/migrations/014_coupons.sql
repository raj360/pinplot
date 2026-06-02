-- Sprint 4: admin coupon codes → wallet credits (S4-04).

CREATE TABLE coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT NOT NULL,
  credit_type         wallet_credit_type NOT NULL DEFAULT 'COUPON',
  purpose             payment_purpose NOT NULL DEFAULT 'UNLOCK',
  quantity            INTEGER NOT NULL DEFAULT 1,
  amount_ugx          INTEGER NOT NULL,
  max_redemptions     INTEGER,
  redemption_count    INTEGER NOT NULL DEFAULT 0,
  max_per_user        INTEGER NOT NULL DEFAULT 1,
  expires_at          TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  label               TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_quantity_positive CHECK (quantity > 0),
  CONSTRAINT coupons_amount_positive CHECK (amount_ugx > 0),
  CONSTRAINT coupons_max_redemptions_positive CHECK (
    max_redemptions IS NULL OR max_redemptions > 0
  ),
  CONSTRAINT coupons_max_per_user_positive CHECK (max_per_user > 0)
);

CREATE UNIQUE INDEX coupons_code_idx ON coupons (UPPER(code));

CREATE TABLE coupon_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ledger_id   UUID NOT NULL REFERENCES wallet_ledger(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)
);

CREATE INDEX coupon_redemptions_user_idx ON coupon_redemptions (user_id);

CREATE TRIGGER coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
