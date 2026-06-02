# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. **Uganda-first supply, globally open discovery.** English UI only; prices shown in the viewer’s familiar currency where possible.

---

## Vision (2026)

PlotPin should work for **any visitor** landing from social ads anywhere in the world:

1. **Map meets them where they are** — geolocation or sensible country default; Uganda/Kampala when unknown or denied.
2. **Money makes sense** — listing rent in canonical currency + **approximate FX hint** `(~£308)` for diaspora viewers.
3. **Supply grows without borders** — landlords list in their country; admins verify; featured slots bootstrap early supply.
4. **No app translation yet** — English copy only; **locale/currency formatting** localized.

---

## Where we stand (product snapshot)

**Phase:** Sprint 4 — **Slice 3 complete** → Slice 4 (landlord polish)

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Explore, FX footnotes, diaspora empty state, unlock (dev) | Stripe |
| **Landlord** | Submit, photos, unit status, reject + resubmit | Country on create |
| **Admin** | Approve/reject, coupons, **featured launch grant** | Multi-country pricing |

**Core loop:** Discover → unlock (simulated) → contact **works**. Payments **Stripe-first** in Sprint 5.

---

## Phase 4 — Supply, wallet & international foundations 🔄

### Done

- [x] Slice 1–2: pricing, wallet, reject, 429, auth resilience
- [x] **S4-14** Country catalog (`017`) — UG + 10 diaspora corridors
- [x] **S4-15** FX display (`018`, explore + building detail, API listing `currency`)
- [x] **S4-16** Viewer context — timezone before language for browser inference
- [x] **S4-17** Explore empty state — diaspora copy, browse Uganda, landlord CTA
- [x] **S4-18** Featured launch (`019`) — admin batch grant, 20 slots × 90 days, audit log

### In progress / next

| Theme | Deliverables |
|-------|--------------|
| **Explore UX** | Viewport persist (S4-13 remainder); bootstrap GPS polish |
| **Landlord polish** | Country on create (S4-19); multi-country pricing seed (S4-20) |
| **Homepage** | Featured grid + D3 hero (S4-22 / PRD — after Stripe or parallel) |

---

## Phase 5 — Payments (Stripe-first)

Stripe Checkout for diaspora; Flutterwave MoMo for Uganda — after S4-20 pricing seed (recommended).

---

## Phase 6 — Global soft launch

Social ad landing + UTM, Open Graph, supply in UG + diaspora corridors, PWA, featured monetization.

---

## Architecture principles (international)

| Layer | Rule |
|-------|------|
| **Data** | Listing currency on units/buildings; fees per `country_code` in `pricing_rules` |
| **Display** | `formatMoney` — canonical rent + optional `(~£X)` hint via `fx_rates` |
| **Map** | GPS → Near me; deny → viewer country bounds → Kampala |
| **Viewer** | `ViewerContextProvider` — profile, localStorage, **timezone**, language |

---

*Last updated: 2026-06-03 — Slice 3 complete; S4-19/20 next*
