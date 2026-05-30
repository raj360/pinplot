# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. Uganda launch, global-ready.

---

## Where we stand (product snapshot)

**Phase:** Sprint 3 — monetization & trust UX (~**70% of unlock journey complete**)

| Persona | Can do today | Not yet |
|---------|----------------|---------|
| **Tenant** | Browse map, filter, unlock unit (dev payment), see exact address + directions, call/WhatsApp landlord, view gated photos/video, manage unlocks | Real card/mobile-money payment |
| **Landlord** | Submit building, upload cover + YouTube, complete profile (intl phone), get verified | Pay listing fee, toggle unit status in UI |
| **Admin** | Approve buildings, review media + landlord email | Reject flow, pricing config |

**Core loop status:** Discover → unlock (simulated) → contact + visit **works end-to-end**. Revenue collection and landlord listing fees are the main gaps before soft launch.

---

## Phase 2 — Core Product ✅ Complete

- [x] Supabase Auth + profile sync (email OTP, Google OAuth)
- [x] Buildings REST API + Kampala seed data
- [x] Explore page + Google Maps + Map ID
- [x] Building detail + unit grid
- [x] Landlord create-building form (map pin, address hints, cover, YouTube, units)
- [x] Landlord + admin app shells (sidebar layout)
- [x] Admin verify-building workflow (map, cover, YouTube, landlord email)
- [x] RLS lockdown migration (`004`)
- [x] Building video URL migration (`007`)

**Verified flow:** Landlord submit → admin approve → building verified on dashboard.

---

## Phase 3 — Payments & trust 🔄 Current (Sprint 3)

**Goal:** 30k UGX listing + 20k UGX unlock live; trustworthy contact handoff.

**Recommended build order:**

1. ~~Unlock transaction + contact reveal~~ ✅
2. ~~Unlock + building page UX polish~~ ✅
3. ~~Profile + contact quality (phone, Call/WhatsApp)~~ ✅
4. Payment providers (S3-01 Stripe, S3-02 Flutterwave)
5. Landlord listing fee + unit toggle (S3-03, S3-07)
6. Webhooks + idempotency (S3-05)
7. Phone SMS verification (S3-21 — post-payment slice)

### Unlock core ✅

- [x] `FOR UPDATE` first-unlock-wins transaction
- [x] Reveal exact address + landlord contact after unlock
- [x] Dev unlock simulation (`ALLOW_DEV_UNLOCK`)
- [x] My unlocks page + directions + satellite mini map
- [x] Unlock list APIs (`/unlocks/mine`, `/unlocks/building/:id`)
- [x] Live exclusive-access countdown on unlock cards

### Explore + privacy UX ✅

- [x] Unlocked buildings stay on explore map when tenant has active access
- [x] Optional auth on `GET /buildings` → `myUnlockCount`
- [x] Location jitter for public pins; exact coords after unlock
- [x] Explore map: roadmap only, max zoom 14, cluster drill-down
- [x] Lime pins + access modal (no sidebar flicker)
- [x] Unit availability summary on building detail / explore panel
- [x] SchoolSpring-style map tooltips + list/map hover sync

### Building page + media ✅

- [x] Gated cover photo + building tour until unlock (`S3-20`)
- [x] Unlocked layout: media once → Step 1 Visit → Step 2 Unlock more → collapsed overview
- [x] Photo gallery lightbox + compact preview strip
- [x] Multi-image support via `unit_images` + `imageUrls` API
- [x] Visitor layout: unit grid + sticky unlock sidebar

### Profiles + contact ✅

- [x] Profile completion modal + post-sign-in step (`/auth/complete-profile`)
- [x] Settings profile editor (`PATCH /profiles/me`)
- [x] International phone input (Uganda default) + optional secondary phone (`008`)
- [x] Call + WhatsApp actions on unlock contact
- [x] Live landlord phone fallback when profile updated after unlock
- [x] Email-only fallback messaging when landlord has no phone
- [ ] SMS phone verification (`phone_verified_at`) — UI stub only; provider TBD

### Payments (remaining)

- [ ] Stripe Checkout (cards / diaspora)
- [ ] Flutterwave mobile money (MTN/Airtel UG)
- [ ] Landlord: pay before unit status change
- [ ] Landlord unit status toggle UI
- [ ] Payment webhooks + idempotency

### Stability (pre-launch)

- [ ] Auth guard DB resilience (graceful fallback on transient `EHOSTUNREACH`) — `S3-18`
- [x] Postgres pool tuning (Supabase pooler `:6543`, session `:5432` for migrations)

---

## Phase 4 — Launch

- [ ] Superadmin pricing config
- [ ] Full RBAC guards on all admin routes
- [ ] PWA manifest (also resolves `/sw.js` 404 in dev)
- [ ] 20–30 verified Kampala buildings
- [ ] Soft launch (WhatsApp, social)
- [ ] Require landlord phone before listing goes live (policy + validation)

---

## Phase 5 — Growth

- [ ] React Native app
- [ ] Featured listings
- [ ] Kenya / Tanzania
- [ ] SEO district pages

*Note: Multi-photo gallery on listings is partially done (API + lightbox); extend landlord upload UX in a later slice.*

---

*Last updated: 2026-05-29 — Unlock UX, profiles, and contact handoff complete; real payments next*
