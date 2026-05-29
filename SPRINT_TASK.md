# PlotPin — Sprint Tasks

## Sprint 3 — Payments (current)

**Goal:** 20k unlock + 30k listing fees live; first-unlock-wins.

**Prerequisite:** Run `yarn db:migrate` (includes `007_building_video_url.sql`).

### Core unlock API

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-04 | `FOR UPDATE` first-unlock-wins transaction | Done | `POST /units/:id/unlock` |
| S3-06 | Reveal exact address + landlord contact after unlock | Done | `UnlockPanel`, `UnlockedAccessCard` |
| S3-09 | Unlock list API | Done | `GET /unlocks/mine`, `GET /unlocks/building/:id` |
| S3-10 | Dev unlock simulation | Done | `ALLOW_DEV_UNLOCK` (non-production) |

### Unlock + explore UX (Sprint 3 polish)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-11 | My unlocks tenant page | Done | `/tenant/unlocks`, UserMenu link |
| S3-12 | Post-unlock map + directions | Done | `UnlockedAccessCard`, `LocationMiniMap` |
| S3-13 | Unlocked buildings on explore map | Done | Merge query in `findInBounds` + optional auth |
| S3-14 | Location privacy | Done | Jitter public coords, explore max zoom 14, roadmap only |
| S3-15 | Explore active-access modal | Done | Lime pin / “Your access” → `UnlockedAccessModal` |
| S3-16 | Explore discovery panel | Done | Unit summary, unlock CTA; sidebar never mixes access card |
| S3-17 | Map hover sync | Done | Debounced preview cache, DOM tooltips, cluster drill-down |

### Payments (next)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-07 | Unit status toggle UI for landlords | Pending | Caretaker marks units taken after visit; pairs with S3-03 |
| S3-03 | Landlord pay-before-status-change (30k UGX) | Pending | Required before map listing |
| S3-01 | Stripe Checkout for tenant unlock (20k UGX) | Pending | Cards / diaspora |
| S3-02 | Flutterwave mobile money (UG) | Pending | MTN / Airtel |
| S3-05 | Payment webhooks + idempotency | Pending | After S3-01 / S3-02 |

### Stability (parallel / pre-launch)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-18 | Auth guard DB resilience | Pending | Catch transient pg errors in optional/required guards |
| S3-19 | Postgres pool hardening | Pending | Pooler URL, keep-alive, single retry on `EHOSTUNREACH` |

**Recommended next slice:** S3-07 → S3-03 → S3-01 → S3-05

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

**Dev unlock:** Set `ALLOW_DEV_UNLOCK=1` in API env (non-production) to simulate payment.

---

## Backlog (post–Sprint 3)

- Photo gallery (multi-image listings)
- Settings / profile (name, phone for admin display)
- Admin reject listing + landlord notification
- Places autocomplete (optional)
- Approximate pin radius circle on explore map (~200 m)

---

*Last updated: 2026-05-29 — Sprint 3 unlock + explore UX done; payments + landlord toggle next*
