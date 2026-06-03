-- Daily-style FX cache for display footnotes (S4-15). Canonical amounts stay in listing currency.

CREATE TABLE IF NOT EXISTS fx_rates (
  base_currency   CHAR(3) NOT NULL,
  quote_currency  CHAR(3) NOT NULL,
  rate            NUMERIC(18, 10) NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (base_currency, quote_currency),
  CHECK (rate > 0)
);

COMMENT ON TABLE fx_rates IS 'Display-only conversion rates. amount_in_quote = amount_in_base * rate.';

-- Seed approximate rates (refresh manually or via job later; Stripe/ECB in Sprint 5+).
INSERT INTO fx_rates (base_currency, quote_currency, rate) VALUES
  ('UGX', 'UGX', 1),
  ('UGX', 'USD', 0.0002600000),
  ('UGX', 'GBP', 0.0002050000),
  ('UGX', 'KES', 0.0340000000),
  ('UGX', 'TZS', 0.6760000000),
  ('UGX', 'RWF', 0.3780000000),
  ('UGX', 'NGN', 0.4320000000),
  ('UGX', 'ZAR', 0.0048100000),
  ('UGX', 'AED', 0.0009550000),
  ('UGX', 'CAD', 0.0001900000),
  ('UGX', 'EUR', 0.0002410000),
  ('USD', 'UGX', 3846.1538461538),
  ('GBP', 'UGX', 4878.0487804878),
  ('KES', 'UGX', 29.4117647059),
  ('TZS', 'UGX', 1.4792899408),
  ('RWF', 'UGX', 2.6455026455),
  ('NGN', 'UGX', 2.3148148148),
  ('ZAR', 'UGX', 207.9002079002),
  ('AED', 'UGX', 1047.1204188482),
  ('CAD', 'UGX', 5263.1578947368),
  ('EUR', 'UGX', 4149.3775933609)
ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = NOW();

ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY fx_rates_public_read ON fx_rates
  FOR SELECT USING (TRUE);
