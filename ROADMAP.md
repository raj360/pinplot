# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. **Uganda-first supply, globally open discovery.** English UI only; prices shown in the viewer’s familiar currency where possible.

---

## Vision (2026)

PlotPin should work for **any visitor** landing from social ads anywhere in the world:

1. **Map meets them where they are** — geolocation or sensible country default; Uganda/Kampala when unknown or denied.
2. **Money makes sense** — listing rent in canonical currency + **FX footnote** for diaspora viewers.
3. **Supply grows without borders** — landlords list in their country; admins verify; featured slots bootstrap early supply.
4. **No app translation yet** — English copy only; **locale/currency formatting** localized.

---

## Where we stand (product snapshot)

**Phase:** Sprint 4 — **Slice 3** (international foundations)

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Explore, unlock (dev), diaspora map default + FX rent footnotes | Featured listings, Stripe |
| **Landlord** | Submit, photos, unit status, see reject reason + resubmit | Country selector on create |
| **Admin** | Approve/reject, coupons, edit pending | Featured launch grants |

**Core loop:** Discover → unlock (simulated) → contact **works**. Payments **Stripe-first** in Sprint 5.

---

## Phase 4 — Supply, wallet & international foundations 🔄

### Done

- [x] Slice 1: pricing, explore perf, admin edit
- [x] Slice 2: wallet, coupons, welcome bonus, multi-photo, reject flow, 429 UX, auth DB retry, design tokens
- [x] **S4-14** Country catalog (`017`) — UG + 10 diaspora corridors (GB, US, KE, TZ, RW, NG, ZA, AE, CA, DE)
- [x] **S4-15** FX display (`018`, `formatMoney`, explore card footnotes)
- [x] **S4-16** Viewer context (profile → localStorage → browser → UG)

### In progress / next

| Theme | Deliverables |
|-------|--------------|
| **Explore UX** | Viewport persist (S4-13 remainder); empty state (S4-17) |
| **Featured launch** | First ~20 verified featured free (S4-18) |
| **Homepage** | Featured grid + D3 hero (S4-22 / PRD — after S4-18) |
| **Landlord polish** | Country on create (S4-19); multi-country pricing seed (S4-20) |

---

## Phase 5 — Payments (Stripe-first)

Stripe Checkout for diaspora; Flutterwave MoMo for Uganda — after display layer (✅) and preferably featured/empty-state polish.

---

## Phase 6 — Global soft launch

Social ad landing + UTM, Open Graph, supply in UG + diaspora corridors, PWA, featured monetization.

---

## Architecture principles (international)

| Layer | Rule |
|-------|------|
| **Data** | Listing currency on units/buildings; fees per `country_code` in `pricing_rules` |
| **Display** | `formatMoney` — canonical rent + optional `~$X` footnote via `fx_rates` |
| **Map** | GPS → Near me; deny → viewer country bounds → Kampala |
| **Viewer** | `ViewerContextProvider` — profile, localStorage, `navigator.language`/timezone |

---

*Last updated: 2026-06-02 — Slice 2 complete; S4-14/15/16 shipped*
