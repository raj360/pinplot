# PlotPin — Sprint Tasks

## Sprint 3 — Payments (current)

**Goal:** 20k unlock + 30k listing fees live; first-unlock-wins.

**Prerequisite:** Run `yarn db:migrate` (includes `007_building_video_url.sql`).

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-04 | `FOR UPDATE` first-unlock-wins transaction | Done | `POST /units/:id/unlock` |
| S3-06 | Reveal exact address + landlord phone after unlock | Done | Building detail UnlockPanel |
| S3-01 | Stripe Checkout for tenant unlock (20k UGX) | Pending | Cards / diaspora |
| S3-02 | Flutterwave mobile money (UG) | Pending | MTN / Airtel |
| S3-03 | Landlord pay-before-status-change (30k UGX) | Pending | Required before map listing |
| S3-07 | Unit status toggle UI for landlords | Pending | Pairs with S3-03 |
| S3-05 | Payment webhooks + idempotency | Pending | After S3-01 / S3-02 |

---

## Sprint 2 — Core product ✅

**Completed:** 2026-05-28

| ID | Task |
|----|------|
| S2-01–S2-07 | Auth, map, API, explore, detail, shells |
| S2-08 | HD cover photo upload |
| S2-09 | Landlord create-building form + units |
| S2-10 | Admin verify-building workflow |
| S2-11 | Email OTP + Google OAuth + login form (zod/RHF) |
| S2-12 | Landlord + admin sidebar layouts |
| S2-13 | Map pin picker + reverse-geocode address hints |
| S2-14 | YouTube tour link + admin review preview |
| S2-15 | Shared UI (Button, Spinner, Input, FormField, ImageUpload) |
| — | Migrations 004–007 |

**QA confirmed:** Create building → admin approve → verified on landlord dashboard.

---

## Sprint 1 — Bootstrap ✅

Completed 2026-05-28.

---

## Admin setup (manual until Sprint 4)

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
yarn db:migrate   # required on each env after merge
```

---

## Backlog (post–Sprint 3)

- Photo gallery (multi-image listings)
- Settings / profile (name, phone for admin display)
- Admin reject listing + landlord notification
- Places autocomplete (optional)

---

*Last updated: 2026-05-28 — Sprint 2 merged*
