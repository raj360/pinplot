# PlotPin — Implementation plan (Sprint 5+)

**Order:** **Guard product (trust, legal, access)** → **Flutterwave + Lemon Squeezy unlock** → **featured later** · **Stripe deferred** (US LLC)

Aligns with [BUSINESS-MODEL.md](./BUSINESS-MODEL.md), [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md), [TRUST-ANTI-SCAM.md](./TRUST-ANTI-SCAM.md), [NOTIFICATIONS.md](./NOTIFICATIONS.md).

---

## Overview

```
Sprint 5A — Trust, access & engagement     ← complete
Sprint 5B — Unlock payments (Flutterwave + Lemon Squeezy)
Sprint 5D–5I — Global discovery, explore, dashboards, lifecycle, unlock hub
Sprint 5C — MoMo / USSD polish + SMS (optional merge with 5B)
Phase 6+ — US LLC + Stripe (when traction)
Phase 6   — Paid featured (~3 mo), badge, growth
```

---

## Sprint 5A — Trust, access & engagement (P0)

**Goal:** Safe to onboard real landlords and tenants before taking money.

| ID | Task | Doc ref | Depends |
|----|------|---------|---------|
| **T-01** | Require `profiles.phone` before admin approve | TRUST §B | — |
| **T-02** | Ownership attestation on landlord submit (checkbox + DB column) | TRUST §B | — |
| **T-03** | Terms + Privacy pages (`/terms`, `/privacy`) from outlines | legal/* | — |
| **T-04** | Accept terms on landlord submit + tenant unlock (timestamp) | legal/TERMS | T-03 |
| **T-05** | Admin approve checklist UI (structured fields + presets) | TRUST §4 | — |
| **T-06** | Report listing API + admin queue (tenant, post-unlock) | TRUST T-05 | — |
| **T-07** | Duplicate pin detection (admin warning on approve) | TRUST T-06 | — |
| **T-08** | New landlord building cap (e.g. 3 unverified) | TRUST T-07 | — |
| **T-09** | Remove / replace listing fee UI — “Listing is free” copy | BUSINESS §8 | — |
| **N-01** | Postmark integration + env | NOTIFICATIONS | — |
| **N-02** | Email: listing approved | NOTIFICATIONS | N-01, T-01 |
| **N-03** | Email: listing rejected | NOTIFICATIONS | N-01 |
| **N-04** | Email: unlock received (landlord) — can stub until 5B payment | NOTIFICATIONS | N-01 |

**5A exit criteria**

- [ ] No approve without landlord phone  
- [ ] Terms linked in footer + required on submit/unlock  
- [ ] Admin uses checklist; reject presets live  
- [ ] Report flow exists  
- [ ] Landlord gets email on approve/reject  
- [ ] No misleading listing fee messaging  

**Suggested day order**

```
Day 1–2: T-03, T-04, T-09 (legal pages + terms gates + free listing UX)
Day 2–3: T-01, T-02, T-05 (phone gate, attestation, admin checklist)
Day 3–4: T-06, T-07, T-08 (report, duplicate, cap)
Day 4–5: N-01 → N-03 (Postmark approve/reject)
```

---

## Sprint 5B — Unlock payments (P0)

**Goal:** Monetize tenants only; free listing unchanged. **No US LLC required.**

See [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md).

| ID | Task | Notes |
|----|------|-------|
| **P-00** | Migration: add `LEMON_SQUEEZY` to `payment_provider` | Keep `STRIPE` for future |
| **S4-20** | Multi-country `pricing_rules` seed | Unlock quotes for LS + FW |
| **S5-01a** | `POST /unlocks/checkout` + provider routing | UG → FW; intl → LS |
| **S5-01b** | Lemon Squeezy checkout + webhook | Diaspora / international cards |
| **S5-01c** | Flutterwave checkout + webhook | UG MoMo + local |
| **S5-02** | Shared `settleUnlock()` — idempotent by provider payment id | One code path |
| **S5-03** | Enforce unlock payment — remove `ALLOW_DEV_UNLOCK` prod/staging | |
| **S5-07** | Wallet + payment reconciliation | Credits before hosted checkout |
| **N-04** | Landlord email on unlock | |
| **N-05** | Tenant unlock receipt email | |

**5B exit criteria**

- [ ] International unlock via **Lemon Squeezy**  
- [ ] Uganda unlock via **Flutterwave**  
- [ ] Welcome credit + coupon apply before checkout  
- [ ] Webhooks idempotent; unlock + LOCKED unit consistent  
- [ ] Landlord + tenant notified on unlock  

**Deferred**

- ~~US LLC / Stripe~~ · ~~Landlord listing fee~~  

---

## Sprint 5C — Uganda rails polish (P1)

| ID | Task |
|----|------|
| S5-04 | MoMo UX polish if not done in 5B |
| S5-05 | USSD (TBD provider) |
| N-08 | SMS unlock alert to landlord (Africa's Talking) |

---

## Sprint 5H — Unlock lifecycle, analytics & notifications (P0–P1)

**Goal:** Tenant unlock history, listing view metrics, cron reminder emails, dormant schema cleanup.

See [SPRINT_TASK.md](../SPRINT_TASK.md) §5H for full task table.

| Track | Focus | Priority |
|-------|-------|----------|
| A | Expired unlock history (API + tenant UI) | P0 |
| B | Cron notifications N-06, N-07, N-12, N-13 | P0 |
| C | Listing analytics (impressions, detail views, conversion) | P1 |
| D | Drop `listing_events`; decide `saved_buildings` MVP | P2 |

**5H exit criteria**

- [x] Tenants see active + past unlocks; past rows hide contact  
- [x] Hourly cron sends expiring/expired unlock emails (idempotent)  
- [x] Landlords see view counts + unlock conversion on dashboard  
- [x] Admin can compare featured vs non-featured view performance  
- [x] `listing_events` removed or documented as deprecated  

---

## Sprint 5I — Tenant unlock hub (P0–P1)

**Goal:** Post-payment unlock experience that drives contact and supports feedback targeting.

See [SPRINT_TASK.md](../SPRINT_TASK.md) §5I for full task table.

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Contact-first hub, open contact, copy, progress bar | Done |
| 2 | Multi-unlock picker, deep links, mobile bell | Done |
| 3 | Building detail cache/skeleton, mobile bar, share/calendar | Done |
| 4 | Enriched unlock API (rent, beds, location, amount paid) | Done |
| 5 | Feedback cron (engagement events + 24h delay) | Pending |

**5I exit criteria**

- [x] Tenants see contact immediately after unlock (no extra “Show contact” step on hub)  
- [x] Call / WhatsApp / directions / copy tracked with `unlock_id`  
- [x] Building detail does not flash locked UI when user already unlocked  
- [x] Unlock cards show listing rent/location and actual paid amount  
- [ ] Feedback prompt sent only to users with engagement intent events  

---

## Phase 6 — Monetization & growth (~month 3+)

| ID | Task | Notes |
|----|------|-------|
| S5-08 | Paid featured checkout | After unlock volume proof |
| T-14 | Optional verify badge (one-time fee) | New `PaymentPurpose` or SKU |
| S4-19 | Landlord country on create | International supply |
| S6-* | UTM, Open Graph, PWA | ROADMAP Phase 6 |
| **P-LLC** | US LLC + Stripe migration | PAYMENTS-STRATEGY §8 |
| N-07–N-10 | Stale listing, digest, in-app | NOTIFICATIONS Phase 2–4 — **N-06–N-13 in Sprint 5H** |
| A-01 | Listing analytics + landlord metrics | SPRINT_TASK 5H Track C |

---

## Schema migrations (anticipated)

| Migration | Purpose |
|-----------|---------|
| `020_trust_attestation.sql` | `buildings.ownership_attested_at`, `ownership_attestation_ip` |
| `021_profile_terms.sql` | `profiles.terms_accepted_at`, `privacy_accepted_at` |
| `022_listing_reports.sql` | `listing_reports` table |
| `023_profile_suspension.sql` | `profiles.suspended_at`, `suspension_reason` |
| `028_rent_period.sql` | `units.rent_period` enum |
| `029_notification_log.sql` | Cron email idempotency (5H) |
| `030_listing_analytics_events.sql` | Impression / detail_view / unlock_click (5H) |
| `031_drop_listing_events.sql` | Remove dormant audit table (5H) |
| `033_user_notifications.sql` | In-app notification inbox (N-09) |
| `034_unlock_engagement_analytics.sql` | Post-unlock engagement events + `unlock_id` (5I) |

---

## Files to touch (5A preview)

| Area | Files |
|------|-------|
| Legal pages | `apps/web/src/app/terms/page.tsx`, `privacy/page.tsx` |
| Landlord submit | `apps/web/src/app/landlord/new/page.tsx` |
| Admin approve | `AdminEditBuildingClient.tsx`, buildings service |
| Notifications | `landlord-notifications.service.ts`, new `postmark.service.ts` |
| Manage building | Remove listing fee banner; free listing copy |
| Footer | `AppHeader` / layout footer links |

---

## Doc maintenance

When shipping a task, update:

- [ ] Checkbox in this file  
- [ ] [SPRINT_TASK.md](../SPRINT_TASK.md)  
- [ ] [ROADMAP.md](../ROADMAP.md) if phase changes  

---

*Last updated: 2026-06-13 — Sprint 5I unlock hub; migration 034*
