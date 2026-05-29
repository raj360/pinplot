# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. Uganda launch, global-ready.

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

**Verified flow:** Landlord submit → admin approve → building verified on dashboard. Public map requires units marked `AVAILABLE` (Sprint 3).

---

## Phase 3 — Payments 🔄 Current (Sprint 3)

**Goal:** Monetization live — 30k UGX listing, 20k UGX unlock.

**Recommended build order:**

1. ~~Unlock transaction + contact reveal (S3-04, S3-06)~~ ✅
2. ~~Unlock UX polish (S3-08–S3-17)~~ ✅
3. Payment providers (S3-01 Stripe, S3-02 Flutterwave)
4. Landlord listing fee + unit toggle (S3-03, S3-07)
5. Webhooks + idempotency (S3-05)

### Unlock core ✅

- [x] `FOR UPDATE` first-unlock-wins transaction (`POST /units/:id/unlock`)
- [x] Reveal exact address + landlord contact after unlock
- [x] Dev unlock simulation (`ALLOW_DEV_UNLOCK` in non-production)
- [x] My unlocks page (`/tenant/unlocks`) + directions + satellite mini map
- [x] `GET /unlocks/mine` and `GET /unlocks/building/:id`

### Explore + privacy UX ✅

- [x] Unlocked buildings stay on explore map when tenant has active access (0 public units)
- [x] Optional auth on `GET /buildings` → `myUnlockCount` on summaries
- [x] Location jitter for public pins (~150–280 m); exact coords only after unlock
- [x] Explore map: roadmap only, max zoom 14, stepped cluster drill-down
- [x] Lime pins + access modal (directions, contact, link to building page)
- [x] Sidebar stays discovery-only; access details in modal (no hover flicker)
- [x] Unit availability summary on building detail / explore panel
- [x] SchoolSpring-style map tooltips + list/map hover sync (debounced cache)

### Payments (remaining)

- [ ] Stripe Checkout (cards / diaspora)
- [ ] Flutterwave mobile money (MTN/Airtel UG)
- [ ] Landlord: pay before unit status change
- [ ] Landlord unit status toggle UI
- [ ] Payment webhooks + idempotency

### Stability (recommended before launch)

- [ ] Auth guard DB resilience (graceful fallback on transient `EHOSTUNREACH`)
- [ ] Postgres pool tuning (Supabase pooler `:6543`, keep-alive, retries)

---

## Phase 4 — Launch

- [ ] Superadmin pricing config
- [ ] Full RBAC guards on all admin routes
- [ ] PWA manifest (also resolves `/sw.js` 404 in dev)
- [ ] 20–30 verified Kampala buildings
- [ ] Soft launch (WhatsApp, social)

---

## Phase 5 — Growth

- [ ] React Native app
- [ ] Featured listings
- [ ] Multi-photo gallery on listings
- [ ] Kenya / Tanzania
- [ ] SEO district pages

---

*Last updated: 2026-05-29 — Sprint 3 unlock core + explore UX complete; payments next*
