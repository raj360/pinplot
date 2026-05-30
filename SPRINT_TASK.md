# PlotPin — Sprint Tasks

## Sprint 3 — Payments (current)

**Goal:** 20k unlock + 30k listing fees live; first-unlock-wins; trustworthy contact reveal.

**Prerequisites:**

```bash
yarn db:migrate   # includes 007 (video), 008 (profile phones)
```

Set `ALLOW_DEV_UNLOCK=1` in API env for simulated tenant unlocks.

---

### Core unlock API ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-04 | `FOR UPDATE` first-unlock-wins transaction | Done | `POST /units/:id/unlock` |
| S3-06 | Reveal exact address + landlord contact after unlock | Done | Snapshot + live phone fallback |
| S3-09 | Unlock list API | Done | `GET /unlocks/mine`, `GET /unlocks/building/:id` |
| S3-10 | Dev unlock simulation | Done | `ALLOW_DEV_UNLOCK` (non-production) |
| S3-20 | Gate cover/video until unlock | Done | API strips URLs; unlock/building responses include media |

### Unlock + explore UX ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-11 | My unlocks tenant page | Done | `/tenant/unlocks`, UserMenu link |
| S3-12 | Post-unlock map + directions | Done | `UnlockedAccessCard`, `LocationMiniMap` |
| S3-13 | Unlocked buildings on explore map | Done | Merge query in `findInBounds` + optional auth |
| S3-14 | Location privacy | Done | Jitter public coords, explore max zoom 14, roadmap only |
| S3-15 | Explore active-access modal | Done | Lime pin → `UnlockedAccessModal` |
| S3-16 | Explore discovery panel | Done | Unit summary, unlock CTA; sidebar discovery-only |
| S3-17 | Map hover sync | Done | Debounced preview cache, DOM tooltips, cluster drill-down |

### Building page UX ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-22 | Unlocked building page hierarchy | Done | Media once → Step 1 Visit → Step 2 optional → overview |
| S3-23 | Media lightbox + compact gallery | Done | `BuildingMediaPreview`, `BuildingMediaLightbox` |
| S3-24 | Exclusive access countdown | Done | `UnlockCountdown` on access cards |
| S3-25 | Visitor unit grid + unlock sidebar | Done | Two-column layout on building detail (locked state) |
| S3-26 | Multi-image API | Done | `imageUrls` from `unit_images` + cover |

### Profiles + contact ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-27 | Profile completion flow | Done | Modal + `/auth/complete-profile` + Settings editor |
| S3-28 | `PATCH /profiles/me` | Done | Name, primary + secondary phone (E.164) |
| S3-29 | International phone input | Done | `IntlPhoneField`, Uganda default, diaspora countries |
| S3-30 | Call + WhatsApp on unlock contact | Done | `ContactActions`; email fallback when no phone |
| S3-31 | Profile phones migration | Done | `008_profile_phones.sql` |
| S3-32 | Live landlord phone on unlock list | Done | `resolveContact()` prefers profile phone over email snapshot |

### Profiles — next slice

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S3-21 | SMS phone verification | Pending | `phone_verified_at` columns exist; UI stub in Settings; needs Twilio / Africa's Talking |

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
| S3-19 | Postgres pool hardening | Done | Pooler URL `:6543`, direct `:5432` for migrations |

**Recommended next slice:** S3-01 + S3-02 (payments) **or** S3-07 + S3-03 (landlord listing gate) — then S3-05 webhooks.

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

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Tenant can find building on map | ✅ |
| Tenant can unlock unit (dev) | ✅ |
| Tenant gets address + directions | ✅ |
| Tenant gets landlord contact (phone or email) | ✅ |
| Tenant sees photos/video after unlock | ✅ |
| Landlord can submit + get verified | ✅ |
| Landlord profile with phone | ✅ (prompted; not verified by SMS) |
| Real payment collection | ❌ |
| Landlord listing fee + unit toggle | ❌ |
| Production-hardened auth/DB guards | ⚠️ partial (pooler done; S3-18 pending) |

---

## Admin setup (manual until Sprint 4)

```sql
UPDATE profiles SET role = 'ADMIN' WHERE id = 'your-auth-user-uuid';
```

Then sign in and open `/admin/buildings` to approve listings.

Landlords should complete **Settings → Profile** with a phone so tenants get Call/WhatsApp, not email-only.

---

## Commands

```bash
yarn workspace @plotpin/shared-types build
yarn dev:api
yarn dev:web
yarn db:migrate   # required on each env after merge (through 008)
```

---

## Backlog (post–Sprint 3)

- Admin reject listing + landlord notification
- Places autocomplete (optional)
- Approximate pin radius circle on explore map (~200 m)
- Landlord multi-photo upload UI (API ready via `unit_images`)
- Notification preferences in Settings

---

*Last updated: 2026-05-29 — Sprint 3 unlock UX + profiles done; payments + SMS verification next*
