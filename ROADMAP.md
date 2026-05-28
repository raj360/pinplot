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

1. Unlock transaction + contact reveal (S3-04, S3-06)
2. Payment providers (S3-01 Stripe, S3-02 Flutterwave)
3. Landlord listing fee + unit toggle (S3-03, S3-07)
4. Webhooks + idempotency (S3-05)

- [ ] `FOR UPDATE` first-unlock-wins transaction
- [ ] Reveal exact address + landlord contact after unlock
- [ ] Stripe Checkout (cards / diaspora)
- [ ] Flutterwave mobile money (MTN/Airtel UG)
- [ ] Landlord: pay before unit status change
- [ ] Landlord unit status toggle UI
- [ ] Payment webhooks + idempotency

---

## Phase 4 — Launch

- [ ] Superadmin pricing config
- [ ] Full RBAC guards on all admin routes
- [ ] PWA manifest
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

*Last updated: 2026-05-28 — Sprint 2 merged; Sprint 3 next*
