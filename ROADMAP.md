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

**Phase:** Sprint 4 — **Slice 3 done** → **Slice 4 homepage v2** → Sprint 5 Stripe (S4-19/20 paired with checkout)

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Explore, FX hints, diaspora empty state, display country in Settings, unlock (dev) | Homepage featured grid + ad landing |
| **Landlord** | Submit, photos, unit status, reject + resubmit | Paid featured (S5-08) |
| **Admin** | Approve/reject, coupons, featured launch grant (20 slots) | — |

**Core loop:** Discover → unlock (simulated) → contact **works**. **Homepage v2** converts ad traffic; **Stripe** follows.

---

## Phase 4 — Supply, wallet & international foundations

### Done (Slice 1–3)

- [x] Wallet, coupons, reject flow, 429 UX, auth DB resilience
- [x] **S4-14** Country catalog (`017`) — UG + 10 diaspora corridors
- [x] **S4-15** FX display (`018`) — explore cards + building detail; API listing `currency`
- [x] **S4-16** Viewer context — timezone → language; **Settings → Display country** override
- [x] **S4-17** Explore empty state — diaspora copy, browse Uganda, landlord CTA
- [x] **S4-18** Featured launch (`019`) — `/admin/featured`, 20 × 90 days, audit log

### Next (Slice 4 — homepage)

| Theme              | Deliverables                                                       |
| ------------------ | ------------------------------------------------------------------ |
| **Homepage**       | Featured grid + D3 hero + diaspora copy (S4-22 / PRD)              |
| **Explore polish** | Viewport persist + bootstrap GPS only on Near me (S4-13 remainder) |

### Before Stripe (Slice 5 prep)

| Theme | Deliverables |
|-------|--------------|
| **Landlord** | Country on create (S4-19) |
| **Pricing** | Multi-country `pricing_rules` seed for US/GB/corridors (S4-20) |

---

## Phase 5 — Payments (Stripe-first)

Stripe Checkout for diaspora (presentment currency follows viewer context); Flutterwave MoMo for Uganda.

**Recommended gate:** S4-20 pricing rules seeded so `/pricing/quote` returns correct fees per viewer country (can ship in same sprint as S5-01).

---

## Phase 6 — Global soft launch

Social ad landing + UTM, Open Graph, supply in UG + diaspora corridors, PWA, paid featured monetization.

---

## Architecture principles (international)

| Layer | Rule |
|-------|------|
| **Data** | Listing currency on units/buildings; fees per `country_code` in `pricing_rules` |
| **Display** | `formatMoney` — canonical rent + optional `(~£X)` hint via `fx_rates` |
| **Map** | Near me → GPS; deny → viewer country bounds; supply search always UG for now |
| **Viewer** | Settings override → localStorage → profile → timezone → language → UG |

---

*Last updated: 2026-06-03 — Homepage v2 (S4-22) in progress; S4-19/20 deferred until Stripe*
