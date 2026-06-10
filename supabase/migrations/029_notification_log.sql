-- Sprint 5H: idempotent cron notification sends

CREATE TABLE notification_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL DEFAULT 'email',
  template    TEXT NOT NULL,
  dedupe_key  TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, template, dedupe_key)
);

CREATE INDEX notification_log_sent_at_idx ON notification_log (sent_at DESC);
CREATE INDEX notification_log_template_idx ON notification_log (template);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
