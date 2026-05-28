# PlotPin — Sprint Tasks

## Sprint 3 — Payments (current)

**Dates:** 2026-06-25 → 2026-07-08  
**Goal:** 20k unlock + 30k listing fees live; first-unlock-wins.

| ID | Task | Status |
|----|------|--------|
| S3-01 | Stripe Checkout for tenant unlock (20k UGX) | Pending |
| S3-02 | Flutterwave mobile money (UG) | Pending |
| S3-03 | Landlord pay-before-status-change (30k UGX) | Pending |
| S3-04 | `FOR UPDATE` first-unlock-wins transaction | Pending |
| S3-05 | Payment webhooks + idempotency | Pending |
| S3-06 | Reveal exact address + landlord phone after unlock | Pending |
| S3-07 | Unit status toggle UI for landlords | Pending |

---

## Sprint 2 — Core product ✅

**Completed:** 2026-05-28

| ID | Task |
|----|------|
| S2-01–S2-07 | Auth, map, API, explore, detail, shells |
| S2-08 | HD image upload (cover photo on create) |
| S2-09 | Landlord create-building form + units |
| S2-10 | Admin verify-building workflow |
| — | Migration 004 RLS lockdown |
| — | Google Maps + Map ID |

---

## Sprint 1 — Bootstrap ✅

Completed 2026-05-28.

---

## Admin setup (manual until Sprint 4)

Promote your user to admin in Supabase SQL editor:

```sql
UPDATE profiles SET role = 'ADMIN' WHERE id = 'your-auth-user-uuid';
```

Then sign in and open `/admin/buildings` to approve listings.

---

## Commands

```bash
yarn workspace @plotpin/shared-types build
yarn dev:api
yarn dev:web
yarn db:migrate
```

---

*Last updated: Sprint 3 kickoff — 2026-05-28*
