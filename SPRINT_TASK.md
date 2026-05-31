# PlotPin — Sprint Tasks

## Sprint 4 — Landlord supply & pricing foundation (current)

**Goal:** Give landlords real tools to manage listings **before** payment rails are wired. Design a flexible pricing model (property type, bedrooms, credits/coupons) so tenants can stay hooked while revenue mechanics mature.

**Why payments are deferred:** Stripe, Flutterwave, and **USSD** each need merchant setup, webhooks, and compliance. Sprint 5 will unify checkout once pricing rules and landlord workflows exist.

**Prerequisites:**

```bash
yarn db:migrate   # through 012 (pricing_rules)
```

Keep `ALLOW_DEV_UNLOCK=1` in dev/staging for tenant unlocks until Sprint 5.

---

### Business model rethink (Sprint 4 design → Sprint 5 enforcement)

Flat **20k unlock / 30k listing** was the MVP. Market feedback suggests **variable contact pricing** (studios vs houses, 1-bed vs 4-bed) and **onboarding incentives** to reduce friction.

| Concept                      | Intent                                                         | Sprint                                     |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------ |
| **Tiered unlock fees**       | Price by `building_type` + `bedrooms` (e.g. studio &lt; house) | S4 design + quote API; S5 charge           |
| **Landlord listing credits** | Free or discounted first listings to seed supply               | S4 schema + admin grant; S5 deduct on pay  |
| **Tenant welcome bonus**     | e.g. one free unlock or partial credit for new sign-ups        | S4 wallet + promo rules; S5 settlement     |
| **Coupons / promo codes**    | Campaigns, referrals, diaspora launch                          | S4 admin create + redeem; S5 payment apply |
| **USSD + mobile money**      | Primary UG collection path (no smartphone checkout required)   | Sprint 5                                   |

**Principle:** Build **pricing + wallet + promo data model** and **show quoted fees in UI** now; gate money movement in Sprint 5.

---

### Sprint 4 — Landlord-first (build order)

| ID    | Task                               | Status  | Notes                                                                                                                                         |
| ----- | ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| S4-01 | **Pricing rules schema**           | Done    | Migration `012_pricing_rules` — tiered by building_type + bedrooms; UG seed                                                                   |
| S4-02 | **Quote API**                      | Done    | `GET /pricing/quote?buildingType&bedrooms&purpose=UNLOCK\|LISTING`                                                                            |
| S4-03 | **Wallet / credits foundation**    | Pending | `account_credits` or ledger table; types: WELCOME_BONUS, ADMIN_GRANT, COUPON; no payment provider yet                                         |
| S4-04 | **Coupon codes (admin)**           | Pending | Admin creates codes; tenant redeem → credit; unlock/listing consumes credit first in dev flow                                                 |
| S4-05 | **Landlord unit status toggle UI** | Done    | `/landlord/buildings/[id]` — mark AVAILABLE / UNAVAILABLE / RENTED; dashboard links                                                           |
| S4-06 | **Landlord unit status API**       | Done    | `PATCH /buildings/:id/units/:unitId/status`, `GET /buildings/mine/:id`; listing fee quote on AVAILABLE (no charge yet)                      |
| S4-07 | **Dynamic fee in unlock UX**       | Pending | Replace hardcoded `PRICING.tenantUnlockFeeUgx` with quote API; show breakdown (type + beds)                                                   |
| S4-08 | **Welcome bonus (tenant hook)**    | Pending | On first profile sync: grant 1× unlock credit or partial discount; visible in unlock CTA                                                      |
| S4-09 | **Landlord multi-photo upload UI** | Pending | API ready via `unit_images`; cover + gallery on create/edit                                                                                   |
| S4-10 | **Admin reject listing**           | Pending | Reject with reason; notify landlord (email stub ok)                                                                                           |
| S4-11 | **Explore 429 UX**                 | Pending | Friendly message when rate limit hit (not generic API error)                                                                                  |
| S4-12 | **Auth guard DB resilience**       | Pending | S3-18 — catch transient pg errors in guards                                                                                                   |

**Recommended slice (week 1):** S4-01 → S4-02 → S4-05 → S4-06 (landlord can manage supply).  
**Week 2:** S4-03 → S4-04 → S4-07 → S4-08 (pricing visible + tenant hook).

---

### Sprint 4 — Explore & stability ✅ (recent)

| ID    | Task                                         | Status | Notes                                                                            |
| ----- | -------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| S4-E1 | URL-synced explore filters + map area search | Done   | `explore-url-filters`, mobile “Search visible area”                              |
| S4-E2 | Filter UX + panel chrome                     | Done   | Placeholder labels, `bg-panel`, consistent sidebar width                         |
| S4-E3 | Explore performance Phase 1                  | Done   | PostGIS `ST_Intersects`, migration `011`, 30s anonymous cache, 60/min rate limit |
| S4-E4 | Auth provider + header skeleton              | Done   | Single session bootstrap; no nav flicker on refresh                              |
| S4-E5 | Property type filter                         | Done   | Migration `010`, API + explore UI                                                |

---

## Sprint 5 — Payments & USSD (deferred)

**Goal:** Collect money using pricing rules + wallets from Sprint 4. Support **mobile money, cards, and USSD**.

| ID    | Task                                    | Status  | Notes                                                                 |
| ----- | --------------------------------------- | ------- | --------------------------------------------------------------------- |
| S5-01 | Flutterwave mobile money (MTN / Airtel) | Pending | Primary UG path                                                       |
| S5-02 | **USSD payment flow**                   | Pending | Provider TBD (Flutterwave USSD, Pegasus, etc.); session ref → webhook |
| S5-03 | Stripe Checkout                         | Pending | Cards / diaspora                                                      |
| S5-04 | Payment webhooks + idempotency          | Pending | All providers; credit/wallet settlement                               |
| S5-05 | Enforce landlord listing fee            | Pending | Deduct wallet or charge before `AVAILABLE`                            |
| S5-06 | Enforce tenant unlock fee               | Pending | Replace dev unlock; apply coupons/credits at checkout                 |
| S5-07 | SMS phone verification                  | Pending | S3-21 — Africa's Talking / Twilio                                     |

**Do not start until:** S4-01–S4-03 pricing + wallet schema merged.

---

## Sprint 3 — Unlock journey ✅

**Completed:** 2026-05-29 (payments moved to Sprint 5)

**Goal:** First-unlock-wins; trustworthy contact reveal; explore + building UX.

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

### Moved to Sprint 4 / 5

| ID    | Task                              | New home                         |
| ----- | --------------------------------- | -------------------------------- |
| S3-07 | Unit status toggle UI             | **S4-05**                        |
| S3-03 | Landlord pay-before-status-change | **S5-05** (after pricing + USSD) |
| S3-01 | Stripe Checkout                   | **S5-03**                        |
| S3-02 | Flutterwave mobile money          | **S5-01**                        |
| S3-05 | Payment webhooks                  | **S5-04**                        |
| S3-21 | SMS phone verification            | **S5-07**                        |
| S3-18 | Auth guard DB resilience          | **S4-12**                        |
| S3-19 | Postgres pool hardening           | Done                             |

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
| Tenant can unlock unit (dev / credits when S4-08) | ✅ dev |
| Tenant gets address + directions | ✅ |
| Tenant gets landlord contact (phone or email) | ✅ |
| Tenant sees photos/video after unlock | ✅ |
| Landlord can submit + get verified | ✅ |
| Landlord profile with phone | ✅ (prompted; SMS in S5-07) |
| Landlord can toggle unit status on dashboard | ❌ **S4-05** |
| Tiered pricing by type + bedrooms (quoted in UI) | ❌ **S4-01, S4-02, S4-07** |
| Credits / coupons / welcome bonus | ❌ **S4-03, S4-04, S4-08** |
| Real payment collection (MoMo, card, **USSD**) | ❌ **Sprint 5** |
| Explore scale (PostGIS, cache, rate limit) | ✅ |
| Production-hardened auth/DB guards | ⚠️ **S4-12** |

---

## Admin setup (manual)

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
yarn db:migrate   # required on each env after merge (through 011)
```

---

## Backlog (post–Sprint 4)

- Explore sidebar pagination + virtual list (S4 stretch / Sprint 6)
- Saved / recent searches (auth)
- Custom min/max rent filters
- SEO district pages
- Zero-result analytics
- Notification preferences in Settings
- Approximate pin radius circle on explore map (~200 m)

---

*Last updated: 2026-05-30 — Sprint 4 landlord-first + pricing foundation; payments + USSD deferred to Sprint 5*
