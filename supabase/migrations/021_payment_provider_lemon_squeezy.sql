-- Sprint 5B: Lemon Squeezy payment provider + idempotent external refs

ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'LEMON_SQUEEZY';

CREATE UNIQUE INDEX IF NOT EXISTS payments_external_ref_unique
  ON payments (external_ref)
  WHERE external_ref IS NOT NULL;
