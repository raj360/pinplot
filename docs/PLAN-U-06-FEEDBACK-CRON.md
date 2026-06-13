# U-06 — Post-unlock feedback prompt (plan)

**Status:** Pending · **Effort:** Small (~1 day) · **Depends on:** Migration `034` (unlock engagement analytics) ✅

---

## Goal

Ask tenants for lightweight feedback **only when they showed real intent** after a paid unlock — not on every unlock, and not for users who never engaged.

---

## Trigger rules (all must pass)

| Rule | Source |
|------|--------|
| Unlock is **active** (`expires_at > now()`) or expired within last 7 days | `unlocks` |
| Unlock age ≥ **24 hours** since `created_at` | `unlocks` |
| At least one **intent event** on that unlock | `listing_analytics_events` where `unlock_id` matches and `event_type` ∈ `CONTACT_CALL`, `CONTACT_WHATSAPP`, `CONTACT_COPY`, `DIRECTIONS` |
| No feedback prompt already sent for this unlock | New column or `notifications` dedupe key |
| User has not dismissed prompt in last 30 days (optional cap) | `notifications` / user preference |

**Do not prompt** if the tenant only opened the hub but never tapped Call, WhatsApp, Copy, or Directions.

---

## Delivery

1. **Hourly cron** (same Railway job as other scheduled work — see [OPS-CRON.md](./OPS-CRON.md))
2. New handler in `ScheduledNotificationsService`: `runUnlockFeedbackPrompts()`
3. Create **in-app notification** (type e.g. `UNLOCK_FEEDBACK_REQUEST`)
4. Optional Phase 2: Postmark email with link to `/tenant/unlocks?unlock={id}&feedback=1`

---

## Implementation sketch

### Schema (migration `035` — optional)

```sql
ALTER TABLE unlocks
  ADD COLUMN IF NOT EXISTS feedback_prompt_sent_at timestamptz;
```

Or dedupe via `notifications.metadata->>'unlockId'` without a new column.

### Cron query (pseudocode)

```sql
SELECT u.id, u.user_id, u.building_id, b.name
FROM unlocks u
JOIN buildings b ON b.id = u.building_id
WHERE u.created_at <= now() - interval '24 hours'
  AND u.expires_at > now() - interval '7 days'
  AND u.feedback_prompt_sent_at IS NULL
  AND EXISTS (
    SELECT 1 FROM listing_analytics_events e
    WHERE e.unlock_id = u.id
      AND e.event_type IN ('CONTACT_CALL','CONTACT_WHATSAPP','CONTACT_COPY','DIRECTIONS')
  );
```

### Notification payload

- **Title:** “How did it go with {building name}?”
- **Body:** “You contacted this landlord via PlotPin. A quick rating helps other tenants.”
- **URL:** `/tenant/unlocks?tab=active&unlock={unlockId}&feedback=1`
- **Actions (UI):** 👍 Reached landlord · 👎 No response · Skip

### Feedback capture

- Minimal: store in `listing_analytics_events` as `UNLOCK_FEEDBACK_POSITIVE` / `UNLOCK_FEEDBACK_NEGATIVE` with `unlock_id`
- Or small `unlock_feedback` table if product wants free-text later

---

## Build order

1. Migration + dedupe column (if needed)
2. Cron handler + unit test on query
3. In-app notification type + bell rendering
4. Optional modal on unlock hub when `?feedback=1`
5. Wire Railway cron env / document in OPS-CRON

---

## Exit criteria

- [ ] Cron runs hourly; no duplicate prompts per unlock
- [ ] Only unlocks with ≥1 intent event and ≥24h age are targeted
- [ ] Admin can see feedback counts in analytics overview (stretch)

---

## Out of scope (U-06)

- NPS surveys · SMS feedback · landlord-side feedback · public reviews
