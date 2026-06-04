# PlotPin — Notifications

**Goal:** Keep landlords **engaged** without listing fees — every meaningful event → timely notify.

**Infrastructure:** Postmark (email) in `.env`; SMS (Africa's Talking / Twilio) Phase 6.  
**Code entry point:** `apps/api/src/buildings/landlord-notifications.service.ts` (stub today).

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

---

## 4. Implementation phases

### Phase 1 (Sprint 5A) — wire Postmark

- [ ] N-01 Postmark client + env validation  
- [ ] N-02 `notifyListingApproved`  
- [ ] N-03 `notifyListingRejected` (extend stub)  
- [ ] N-04 `notifyUnlockReceived` — call from unlocks service after payment  
- [ ] N-05 Tenant unlock receipt email  

### Phase 2 (Sprint 5B+)

- [ ] N-06 Cron: unlock expiring reminders  
- [ ] N-07 Cron: stale AVAILABLE  
- [ ] N-08 SMS for unlock (Flutterwave era or Twilio)  

### Phase 3 (Phase 6)

- [ ] N-09 In-app notification center  
- [ ] N-10 Weekly landlord digest  

---

## 5. API / data (future)

Optional table `notification_log` (id, user_id, channel, template, payload, sent_at) for audit and idempotency.

---

*Build order: [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)*
