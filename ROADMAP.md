# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. Uganda launch, global-ready.

---

## Where we stand (product snapshot)

**Phase:** Sprint 4 — landlord supply & pricing foundation

| Persona | Can do today | Sprint 4 focus | Sprint 5 (deferred) |
|---------|----------------|----------------|---------------------|
| **Tenant** | Browse, filter, unlock (dev), contact, directions, media | Welcome bonus / coupons; **quoted** fees by type + beds | MoMo, card, **USSD** checkout |
| **Landlord** | Submit, verify, profile + phone | **Unit status toggle**, multi-photo, listing workflow | Pay listing fee at status change |
| **Admin** | Approve buildings | Reject flow, coupon grants, pricing rules seed | Payment reconciliation |

**Core loop status:** Discover → unlock (simulated) → contact + visit **works**. Revenue rails and USSD **intentionally deferred** until pricing + wallet model land in Sprint 4.

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

## Phase 3 — Unlock journey ✅ Complete (Sprint 3)

**Goal:** First-unlock-wins; trustworthy contact handoff; explore + building UX.

- [x] Unlock transaction, contact reveal, dev simulation
- [x] Explore privacy, filters, performance (PostGIS, cache, rate limit)
- [x] Profiles, Call/WhatsApp, gated media
- [ ] ~~Stripe / Flutterwave~~ → moved to **Phase 5**

---

## Phase 4 — Landlord supply & pricing foundation 🔄 Current (Sprint 4)

**Goal:** Landlords manage units without payment blockers; design tiered pricing + credits so tenants stay hooked before USSD/MoMo go live.

**Build order:**

1. Pricing rules schema + quote API (type + bedrooms)
2. Landlord unit status toggle (API + dashboard UI)
3. Wallet / credits + welcome bonus + admin coupons
4. Dynamic fees in unlock + landlord UI (display only; dev unlock / credits settle)
5. Landlord multi-photo upload; admin reject listing
6. Stability: 429 UX, auth guard resilience

### Business model (Sprint 4 → 5)

- [ ] Tiered unlock/listing fees by `building_type` + bedrooms
- [ ] Tenant welcome credit (e.g. first unlock discounted)
- [ ] Coupon / promo codes (admin)
- [ ] Landlord listing credits for early supply
- [ ] Enforce payment at checkout — **Sprint 5**

### Landlord tools

- [ ] Unit status toggle UI + API
- [ ] Multi-photo upload UI
- [ ] Admin reject listing + notification

### Explore (done in Sprint 4 slice)

- [x] URL filters, map area search, panel UX
- [x] PostGIS bounds, indexes `011`, anonymous cache, rate limit

---

## Phase 5 — Payments & USSD (Sprint 5)

**Goal:** Monetize using Sprint 4 pricing + wallet model.

- [ ] Flutterwave mobile money (MTN/Airtel)
- [ ] **USSD payments** (provider TBD)
- [ ] Stripe Checkout (cards / diaspora)
- [ ] Webhooks + idempotency + wallet settlement
- [ ] Enforce landlord listing fee + tenant unlock fee
- [ ] SMS phone verification

---

## Phase 6 — Launch

- [ ] Superadmin pricing config
- [ ] Full RBAC guards on all admin routes
- [ ] PWA manifest (also resolves `/sw.js` 404 in dev)
- [ ] 20–30 verified Kampala buildings
- [ ] Soft launch (WhatsApp, social)
- [ ] Require landlord phone before listing goes live (policy + validation)

---

## Phase 7 — Growth

- [ ] React Native app
- [ ] Featured listings
- [ ] Kenya / Tanzania
- [ ] SEO district pages

*Note: Multi-photo gallery on listings is partially done (API + lightbox); extend landlord upload UX in a later slice.*

---

*Last updated: 2026-05-29 — Unlock UX, profiles, and contact handoff complete; real payments next*
