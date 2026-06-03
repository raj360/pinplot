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

**Phase:** Sprint 4 **complete** → **Sprint 5 Stripe** (S4-19/20 paired with checkout)

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Homepage v2, explore, FX hints, diaspora empty state, Settings display country, unlock (dev) | Stripe checkout |
| **Landlord** | Submit, photos, unit status, reject + resubmit | Listing fee via Stripe (S5-01) |
| **Admin** | Approve/reject, coupons, featured launch grant (20 slots) | Paid featured (S5-08) |

**Core loop:** Discover → unlock (simulated) → contact **works**. **Homepage** converts ad traffic; **Stripe** is the next gate to real payments.

---

## Phase 4 — Supply, wallet & international foundations — **✅ complete**

### Done (Slice 1–4)

- [x] Wallet, coupons, reject flow, 429 UX, auth DB resilience
- [x] **S4-14** Country catalog (`017`) — UG + 10 diaspora corridors
- [x] **S4-15** FX display (`018`) — explore cards + building detail + homepage; API listing `currency`
- [x] **S4-16** Viewer context — Settings override → profile → **IP** → timezone → language → UG
- [x] **S4-17** Explore empty state — diaspora copy, browse Uganda, landlord CTA
- [x] **S4-18** Featured launch (`019`) — `/admin/featured`, 20 × 90 days, audit log
- [x] **S4-22** Homepage v2 — featured grid (`GET /buildings/featured`), diaspora copy, CTAs
- [x] **S4-24** D3 hero — Kampala map, rotating unlock story, persistent green pins per cycle
- [x] **S4-25** IP geolocation — `/api/geo` for anonymous viewer country

### Optional polish (not blocking Sprint 5)

| Theme | Deliverables |
|-------|--------------|
| **Explore** | S4-13 remainder — viewport URL persist; bootstrap GPS only on Near me click |
| **Hero** | Pin coordinate tweaks vs final `kampala.svg` |

### Paired with Sprint 5 (deferred from Sprint 4)

| Theme | Deliverables |
|-------|--------------|
| **Landlord** | Country on create (S4-19) |
| **Pricing** | Multi-country `pricing_rules` seed for US/GB/corridors (S4-20) |

---

## Phase 5 — Payments (Stripe-first) — **current**

Stripe Checkout for diaspora (presentment currency follows viewer context); Flutterwave MoMo for Uganda.

| Priority | Deliverable |
|----------|-------------|
| **P0** | S5-01 Stripe Checkout — tenant unlock + landlord listing fee |
| **P0** | S5-02 Webhooks — idempotent payment → unlock / listing credit |
| **P0** | S5-03 Enforce fees — remove dev unlock bypass in prod/staging |
| **P1** | S4-20 + S5-01 together — multi-country fee quotes before live checkout |
| **P2** | S5-08 Paid featured — monetize homepage/explore boost |
| **P3** | S5-04–S5-06 Flutterwave MoMo / USSD |

---

## Phase 6 — Global soft launch

Social ad landing + UTM, Open Graph, supply in UG + diaspora corridors, PWA, paid featured at scale.

---

## Architecture principles (international)

| Layer | Rule |
|-------|------|
| **Data** | Listing currency on units/buildings; fees per `country_code` in `pricing_rules` |
| **Display** | `formatMoney` — canonical rent + optional `(~£X)` hint via `fx_rates` |
| **Map** | Near me → GPS; deny → viewer country bounds; supply search UG-first for now |
| **Viewer** | Settings override → localStorage → profile → **IP (`/api/geo`)** → timezone → language → UG |
| **Homepage** | Single Kampala supply map; diaspora context in copy + FX only (no live Maps API on `/`) |

---

*Last updated: 2026-06-03 — Sprint 4 complete; Sprint 5 Stripe is next*
