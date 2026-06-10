# PlotPin — Notifications

**Goal:** Keep landlords **engaged** without listing fees — every meaningful event → timely notify.

**Infrastructure:** Postmark (email) in `.env` — `POSTMARK_FROM_EMAIL` (transactional), `POSTMARK_REPLY_TO_EMAIL` (Zoho support inbox); SMS (Africa's Talking / Twilio) Phase 6.  
**Code entry points:**  
- `apps/api/src/buildings/landlord-notifications.service.ts`  
- `apps/api/src/notifications/tenant-notifications.service.ts`  
**Cron (Sprint 5H):** **Railway** hourly → `POST /api/v1/cron/hourly` with `CRON_SECRET` — [OPS-CRON.md](./OPS-CRON.md). GitHub workflow is manual-only.

---

## 1. Principles

1. **Landlord-first priority** — unlock events are P0  
2. **Actionable** — every notification has one clear CTA link  
3. **Multi-channel** — email default; SMS for unlock + urgent; in-app later  
4. **No spam** — digest optional; max 1 SMS/day/landlord except unlock  

---

## 2. Event matrix

### Landlord

| Event | Priority | Email | SMS | In-app | CTA |
|-------|----------|-------|-----|--------|-----|
| Building submitted | P2 | ✓ | — | — | Dashboard pending |
| **Listing approved** | P0 | ✓ | ✓ | ✓ | Mark units available |
| **Listing rejected** | P0 | ✓ | ✓ | ✓ | Fix + resubmit |
| Resubmitted for review | P3 | ✓ | — | — | — |
| **Tenant unlock (paid)** | P0 | ✓ | ✓ | ✓ | View building / contact |
| Unlock expiring (12h left) | P1 | ✓ | ✓ | ✓ | Respond or mark rented |
| Unit lock ended (72h) | P1 | ✓ | — | ✓ | Update unit status |
| Stale AVAILABLE (30d) | P2 | ✓ | — | ✓ | Still available? |
| Featured expiring (7d) | P2 | ✓ | — | ✓ | Renew (when paid featured live) |
| Weekly digest | P3 | ✓ | — | — | Stats summary |
| **Report on listing** | P0 | ✓ (admin) | — | — | Admin review queue |
| Duplicate pin flagged | P1 | ✓ (admin) | — | — | Admin review |

### Tenant

| Event | Priority | Email | SMS | CTA |
|-------|----------|-------|-----|-----|
| Unlock confirmed + receipt | P0 | ✓ | optional | My unlocks |
| Exclusive ending (24h) | P1 | ✓ | — | Contact landlord |
| Welcome credit granted | P2 | ✓ | — | Explore |
| Report received | P2 | ✓ | — | — |

---

## 3. Email templates (minimum set)

| Template ID | Trigger |
|-------------|---------|
| `landlord_listing_approved` | Admin verify |
| `landlord_listing_rejected` | Admin reject |
| `landlord_unlock_received` | Payment + unlock created |
| `landlord_unlock_expiring` | Cron 12h before end |
| `landlord_stale_listing` | Cron 30d AVAILABLE |
| `tenant_unlock_receipt` | Unlock success |
| `tenant_unlock_expiring` | Cron 24h before end |
| `tenant_unlock_expired` | Cron day-of expiry |
| `landlord_unlock_expired` | Cron day-of expiry |
| `landlord_unit_lock_ended` | Cron when `locked_until` passes (long-term) |
| `landlord_featured_expiring` | Cron 7d before `featured_until` |

---

## 4. Implementation phases

### Phase 1 (Sprint 5A + 5B) — transactional email ✅

- [x] N-01 Postmark client + env validation  
- [x] N-02 `notifyListingApproved`  
- [x] N-03 `notifyListingRejected`  
- [x] N-04 `notifyUnlockReceived` — unlocks service after payment  
- [x] N-05 Tenant unlock receipt email  

### Phase 2 (Sprint 5H) — scheduled reminders

**Prerequisite:** `notification_log` table for idempotency (one send per unlock per template).

| ID | Task | Trigger | Recipient |
|----|------|---------|-----------|
| N-06a | Unlock expiring | Hourly cron; 12h before `expires_at` | Landlord |
| N-06b | Unlock expiring | Hourly cron; 24h before `expires_at` | Tenant |
| N-06c | Unlock expired | Hourly cron; `expires_at` in last hour | Tenant + landlord |
| N-12 | Unit lock ended | Hourly cron; `locked_until` in last hour | Landlord (long-term) |
| N-13 | Featured expiring | Daily cron; 7d before `featured_until` | Landlord |
| N-07 | Stale AVAILABLE | Weekly cron; unit AVAILABLE 30d+ | Landlord |

**Copy notes (stay class from 5G):**

- **Short-stay (AirBnB):** tenant expiring = “Contact window ends in 24h”; no “unit lock” language  
- **Long-term:** tenant = “Exclusive window ends”; landlord lock-ended = “Unit is visible on the map again — update status if rented”

**Implementation checklist:**

- [ ] N-06 Migration `029_notification_log`  
- [ ] N-06 Cron module + `CRON_SECRET` guard  
- [ ] N-06a–c Email templates + query jobs  
- [ ] N-12 `landlord_unit_lock_ended` template  
- [ ] N-13 `landlord_featured_expiring` template  
- [ ] N-07 Stale listing cron (P1, can slip to 5H.1)  
- [ ] GH Action `notifications-cron.yml` (hourly + daily jobs)

### Phase 3 (Sprint 5C / 5H.1) — SMS

- [ ] N-08 SMS for unlock received (landlord) — Africa's Talking  
- [ ] N-08b SMS for unlock expiring (landlord, urgent only)

### Phase 4 (Phase 6) — in-app + digest

- [ ] N-09 In-app notification center  
- [ ] N-10 Weekly landlord digest (views + unlocks summary — depends on 5H analytics)

---

## 5. API / data

### `notification_log` (Sprint 5H)

```sql
CREATE TABLE notification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL DEFAULT 'email',  -- email | sms
  template     TEXT NOT NULL,
  dedupe_key   TEXT NOT NULL,                  -- e.g. unlock:{id}:expiring_12h
  payload      JSONB NOT NULL DEFAULT '{}',
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, template, dedupe_key)
);
```

Enables safe hourly cron retries without duplicate emails.

---

*Build order: [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) · Sprint tasks: [SPRINT_TASK.md](../SPRINT_TASK.md) §5H*
