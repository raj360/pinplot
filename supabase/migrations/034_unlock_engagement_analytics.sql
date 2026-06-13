-- Post-unlock engagement events (call, WhatsApp, copy, directions)

ALTER TABLE listing_analytics_events
  DROP CONSTRAINT IF EXISTS listing_analytics_events_event_type_check;

ALTER TABLE listing_analytics_events
  ADD CONSTRAINT listing_analytics_events_event_type_check
  CHECK (event_type IN (
    'IMPRESSION',
    'DETAIL_VIEW',
    'UNLOCK_CLICK',
    'CONTACT_CALL',
    'CONTACT_WHATSAPP',
    'CONTACT_COPY',
    'DIRECTIONS'
  ));

ALTER TABLE listing_analytics_events
  ADD COLUMN IF NOT EXISTS unlock_id UUID REFERENCES unit_unlocks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS listing_analytics_events_unlock_created_idx
  ON listing_analytics_events (unlock_id, created_at DESC)
  WHERE unlock_id IS NOT NULL;
