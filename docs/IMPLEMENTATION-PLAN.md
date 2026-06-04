# PlotPin — Implementation plan (Sprint 5+)

**Order:** **Guard product (trust, legal, access)** → **Stripe unlock** → **local rails & featured later**

Aligns with [BUSINESS-MODEL.md](./BUSINESS-MODEL.md), [TRUST-ANTI-SCAM.md](./TRUST-ANTI-SCAM.md), [NOTIFICATIONS.md](./NOTIFICATIONS.md).

---

## Overview

```
Sprint 5A — Trust, access & engagement     ← START HERE
Sprint 5B — Stripe unlock payments
Sprint 5C — Uganda MoMo (Flutterwave)
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

## Sprint 5B — Stripe unlock payments (P0)

**Goal:** Monetize tenants only; free listing unchanged.

| ID | Task | Notes |
|----|------|-------|
| **S4-20** | Multi-country `pricing_rules` seed (UG + US/GB/corridors) | Unlock quotes only |
| **S5-01** | Stripe Checkout — **`PaymentPurpose.UNLOCK` only** | No listing checkout |
| **S5-02** | Webhooks — idempotent unlock settlement | |
| **S5-03** | Enforce unlock payment — remove `ALLOW_DEV_UNLOCK` prod/staging | **Not** listing gate |
| **S5-07** | Wallet + Stripe reconciliation | Credits before card |
| **N-04** | Landlord email on unlock | Wire to unlocks service |
| **N-05** | Tenant unlock receipt email | |

**5B exit criteria**

- [ ] Diaspora can pay unlock via Stripe  
- [ ] Welcome credit + coupon apply before checkout  
- [ ] Webhook idempotent; unlock + LOCKED unit consistent  
- [ ] Landlord + tenant notified on unlock  

**Deferred from old Sprint 5**

- ~~Landlord listing fee checkout~~  
- ~~Gate AVAILABLE on listing payment~~  

---

## Sprint 5C — Uganda local rails (P1)

| ID | Task |
|----|------|
| S5-04 | Flutterwave MoMo unlock |
| S5-05 | USSD (TBD provider) |
| N-06 | SMS unlock alert to landlord |

---

## Phase 6 — Monetization & growth (~month 3+)

| ID | Task | Notes |
|----|------|-------|
| S5-08 | Paid featured checkout | After unlock volume proof |
| T-14 | Optional verify badge (one-time fee) | New `PaymentPurpose` or SKU |
| S4-19 | Landlord country on create | International supply |
| S6-* | UTM, Open Graph, PWA | ROADMAP Phase 6 |
| N-07–N-10 | Stale listing, digest, in-app | NOTIFICATIONS Phase 2–3 |

---

## Schema migrations (anticipated)

| Migration | Purpose |
|-----------|---------|
| `020_trust_attestation.sql` | `buildings.ownership_attested_at`, `ownership_attestation_ip` |
| `021_profile_terms.sql` | `profiles.terms_accepted_at`, `privacy_accepted_at` |
| `022_listing_reports.sql` | `listing_reports` table |
| `023_profile_suspension.sql` | `profiles.suspended_at`, `suspension_reason` |

*(Numbers tentative — apply in order after 019.)*

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

*Last updated: 2026-06-03*
