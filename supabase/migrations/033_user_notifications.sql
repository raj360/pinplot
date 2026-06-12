-- Sprint N-09: in-app notification inbox (server-side read/dismiss)

CREATE TABLE user_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  cta_url      TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',
  dedupe_key   TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type, dedupe_key)
);

CREATE INDEX user_notifications_user_created_idx
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX user_notifications_user_active_idx
  ON user_notifications (user_id, created_at DESC)
  WHERE dismissed_at IS NULL;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
