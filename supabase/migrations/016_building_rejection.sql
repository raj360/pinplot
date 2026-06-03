-- Admin reject flow: reason stored on building; rejected listings leave pending queue.

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

COMMENT ON COLUMN buildings.rejected_at IS 'Set when admin rejects a pending listing; cleared on resubmit or approve.';
COMMENT ON COLUMN buildings.rejection_reason IS 'Admin-facing reason shown to landlord.';
COMMENT ON COLUMN buildings.verified_at IS 'Timestamp when admin approved the listing.';

CREATE INDEX IF NOT EXISTS buildings_pending_review_idx
  ON buildings (created_at ASC)
  WHERE is_verified = FALSE AND rejected_at IS NULL;
