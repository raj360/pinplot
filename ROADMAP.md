# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. **Uganda-first supply, globally open discovery.** English UI only; prices shown in the viewer’s familiar currency where possible.

---

## Vision (2026)

PlotPin should work for **any visitor** landing from social ads (YouTube, Facebook, Instagram, TikTok) anywhere in the world:

1. **Map meets them where they are** — geolocation or sensible country default; Uganda/Kampala when unknown or denied.
2. **Money makes sense** — listing rent and platform fees shown with **currency presentation** (UGX rent + “~$X” for diaspora), Stripe checkout in local presentment currency later.
3. **Supply grows without borders** — landlords list in their country; admins verify; featured slots bootstrap early supply.
4. **No app translation yet** — all copy stays English; only **locale/currency formatting** is localized.

---

## Where we stand (product snapshot)

**Phase:** Sprint 4 — supply, wallet, and **international foundations**

| Persona      | Can do today                                                | Next                                                      |
| ------------ | ----------------------------------------------------------- | --------------------------------------------------------- |
| **Tenant**   | Explore Kampala **seed**, unlock (dev), contact, directions | Geo map bootstrap, dual-currency display, welcome credits |
| **Landlord** | Submit, verify, unit status, admin can edit pending         | Multi-photo, reject flow                                  |
| **Admin**    | Approve + edit pending listings (pin, units, media)         | Reject + coupons + featured launch grants                 |

**Core loop:** Discover → unlock (simulated) → contact **works**. Payments **Stripe-first** in Sprint 5; MoMo/USSD for Uganda after card rails prove out.

---

## Phase 2 — Core Product ✅

Auth, maps, explore, landlord submit, admin verify, RLS, video URL — complete.

---

## Phase 3 — Unlock journey ✅

Unlock API, privacy jitter, explore UX, profiles, Call/WhatsApp, gated media — complete.

---

## Phase 4 — Supply, wallet & international foundations 🔄 Current

**Goal:** Landlords manage listings; pricing/credits model exists; app feels global on first visit without blocking Uganda.

### Done (Sprint 4 slice 1)

- [x] Pricing rules + quote API (`012`, tiered by type + bedrooms)
- [x] Landlord unit status API + dashboard UI
- [x] Explore performance (PostGIS, cache, rate limit, filters)
- [x] Admin pending edit (units, cover upload, exact pin)
- [x] Admin + landlord loading UX polish

### In progress / next (Sprint 4 slice 2)

| Theme                | Deliverables                                                                  |
| -------------------- | ----------------------------------------------------------------------------- |
| **Wallet & promos**  | Credits ledger, coupons, welcome bonus, dynamic fee in unlock UI              |
| **Landlord quality** | Multi-photo upload; admin reject with reason                                  |
| **Geo bootstrap**    | Explore map centers on user location; fallback Kampala; country-aware bounds  |
| **Currency display** | Present rent + fees in viewer currency (FX hint); canonical storage unchanged |
| **Featured launch**  | First ~20 verified listings featured free (admin grant / coupon / credit)     |
| **Stability**        | Explore 429 UX; auth guard DB resilience                                      |

### Business model (display now → charge Sprint 5)

- Tiered unlock/listing fees by `building_type` + bedrooms + `country_code`
- Tenant welcome credit; admin coupons; landlord listing credits
- Featured listing surcharge (paid later; **launch promo: first 20 global**)
- Enforce payment at checkout — **Sprint 5**

---

## Phase 5 — Payments (Stripe-first, then local rails)

**Goal:** Monetize using Sprint 4 pricing + wallet. **International diaspora pays by card first.**

| Order | Rail                          | Audience                                               |
| ----- | ----------------------------- | ------------------------------------------------------ |
| 1     | **Stripe Checkout**           | US, UK, EU, diaspora — adaptive / presentment currency |
| 2     | Webhooks + wallet settlement  | All providers                                          |
| 3     | Flutterwave mobile money      | Uganda MTN/Airtel                                      |
| 4     | USSD                          | Uganda feature-phone path                              |
| 5     | Enforce listing + unlock fees | Replace dev unlock                                     |

SMS phone verification moves here or Phase 6 depending on Stripe KYC needs.

---

## Phase 6 — Global soft launch

- [ ] Seed / onboard supply in **UG + 1–2 diaspora corridors** (not Kampala-only marketing)
- [ ] Social ad landing: UTM capture, Open Graph previews, geo-aware explore entry
- [ ] Featured monetization (beyond launch 20)
- [ ] Superadmin pricing per country
- [ ] Full RBAC on admin routes
- [ ] PWA manifest
- [ ] Require landlord phone before go-live

---

## Phase 7 — Growth

- React Native app
- Kenya / Tanzania country packs
- SEO city/district pages (English)
- Saved searches, analytics

---

## Architecture principles (international)

| Layer        | Rule                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **Data**     | Buildings/units store **listing currency** (ISO 4217). Fees in `pricing_rules` per `country_code`. |
| **Display**  | `Intl.NumberFormat` with viewer locale/currency; optional FX footnote (“~$12 USD”).                |
| **Checkout** | Stripe presentment currency matches viewer; settlement config TBD.                                 |
| **Map**      | GPS → map center + search; deny/unsupported → profile country centroid → **Kampala default**.      |
| **Language** | English only until explicit i18n sprint.                                                           |
| **Featured** | `is_featured` + optional `featured_until`; grants via credits/coupons at launch.                   |

---

## What we are *not* doing yet

- Full UI translation (Spanish, French, etc.)
- Per-country payment methods on day one (Stripe first)
- Automatic listing in wrong country (geo informs **map**, not fake listings)

---

*Last updated: 2026-06-01 — International-first strategy; Sprint 4 slice 1 merged*


