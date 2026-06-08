# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. **Uganda-first supply, globally open discovery.** English UI only; prices shown in the viewer’s familiar currency where possible.

**Planning docs:** [docs/README.md](./docs/README.md) · **Payments:** [docs/PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md)

---

## Vision (2026)

PlotPin should work for **any visitor** landing from social ads anywhere in the world:

1. **Map meets them where they are** — geolocation or sensible country default; Uganda/Kampala when unknown or denied.
2. **Money makes sense** — listing rent in canonical currency + **approximate FX hint** `(~£308)` for diaspora viewers.
3. **Supply grows without borders** — **free verified listings**; admins verify; featured slots bootstrap supply.
4. **Trust** — direct landlord contact after unlock; anti-blocker vs Jiji brokers ([docs/TRUST-ANTI-SCAM.md](./docs/TRUST-ANTI-SCAM.md)).
5. **No app translation yet** — English copy only; **locale/currency formatting** localized.

---

## Where we stand (product snapshot)

**Phase:** Sprint 4 ✅ → 5A trust ✅ → 5B unlock payments (FW + Lemon Squeezy) ✅ → **5D global discovery, catalog & FX ✅** → 5C Uganda polish (next)

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Homepage v2, **global explore** (country-scoped areas), **viewer-currency FX**, paid unlock | MoMo/SMS polish (5C) |
| **Landlord** | Submit (any country), photos, unit status, reject + resubmit, listing-currency edit | Country/currency on edit flow |
| **Admin** | Approve/reject, coupons, featured launch, verification checklist, reports | — |

**Monetization:** [docs/BUSINESS-MODEL.md](./docs/BUSINESS-MODEL.md) — free listing, paid unlock.  
**Payments:** [docs/PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md) — **Flutterwave + Lemon Squeezy** now; **Stripe when US LLC exists**.

---

## Phase 4 — Supply, wallet & international foundations — **✅ complete**

- Wallet, coupons, reject, homepage v2, D3 hero, featured launch, FX, IP geo, country catalog  
- Details: [SPRINT_TASK.md](./SPRINT_TASK.md)

---

## Phase 5A — Trust, access & engagement — **current**

**Goal:** Safe for real users before payments.

| Priority | Deliverable |
|----------|-------------|
| **P0** | Terms + Privacy pages; acceptance on submit/unlock |
| **P0** | Landlord phone required to approve |
| **P0** | Ownership attestation; admin verification checklist |
| **P0** | Report listing; duplicate pin alerts |
| **P0** | Postmark: approve / reject emails |
| **P0** | Free listing UX (remove listing fee messaging) |

Full task list: [docs/IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md)

---

## Phase 5B — Unlock payments — **after 5A**

**Rails:** Lemon Squeezy (international) + Flutterwave (Uganda). **Not Stripe** until entity formation.

| Priority | Deliverable |
|----------|-------------|
| **P0** | S4-20 multi-country unlock pricing seed |
| **P0** | Checkout routing + shared webhook settlement |
| **P0** | Lemon Squeezy + Flutterwave integrations |
| **P0** | S5-03 enforce unlock payment |
| **P1** | Wallet reconciliation; unlock notification emails |

---

## Phase 5D — Global discovery, catalog & multi-currency — **✅ complete**

**Goal:** Browse/discovery works for **every country**; supply stays Uganda-only (`SUPPLY_MARKET_CODES`). Low runtime cost — no live geocoder on search.

| Area | Deliverable |
|------|-------------|
| **Catalog** | Full ISO country catalog (~250) — migration `023` + `db:seed:countries` (dr5hn, ODbL) |
| **Search areas** | `geo_places` table (region/district/city/neighborhood) — migration `024` + `db:seed:geo` (GeoNames + manual UG); served via cached `GET /api/v1/geo/places?country=XX` |
| **Picker** | Where dropdown scoped to viewer's country (`useGeoPlaces`); recent-search fallback; geocode only on commit |
| **Currency** | UGX-hub `fx_rates` + cross-rate `convertMoney`; `db:seed`/`fx:refresh`; admin edit shows listing currency |
| **Viewer** | Country resolved from real ISO (IP / profile / browser), not collapsed to `ROW` |
| **Cleanup** | Dropped unused `countries` fee columns — migration `025` |

**Data:** 250 countries · 153 FX currencies · 16,094 geo places. **Ops:** `fx:refresh` runs **daily**; catalog/geo seeds are one-time.

---

## Phase 5C — Uganda rails polish

MoMo UX, USSD (TBD), SMS landlord alerts on unlock.

---

## Phase 6 — Global soft launch & deferred monetization

- Social ad landing + UTM, Open Graph, PWA  
- **S5-08 paid featured** (~3 months post-launch)  
- Optional **verify badge** (one-time)  
- **US LLC + Stripe** for diaspora if Lemon Squeezy economics warrant ([PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md) §8)

---

## Architecture principles (international)

| Layer | Rule |
|-------|------|
| **Data** | Listing currency on units; unlock fees (UGX) per `country_code` in `pricing_rules`; catalog by ISO `code` |
| **Search areas** | Seeded `geo_places` (per-place bounds) drive the picker; no live geocoder — geocode only on commit |
| **Display** | `formatMoney` — canonical rent + optional `(~£X)` hint via UGX-hub FX |
| **Currency** | `fx_rates` is UGX-hub; cross any pair via UGX; refresh **daily** |
| **Supply vs browse** | Browse global via `geo_places`; listings only in `SUPPLY_MARKET_CODES` (UG) |
| **Listing** | **Free** after admin verification |
| **Payments** | One unlock flow; route to FW or Lemon Squeezy |
| **Map** | Near me → GPS; deny → viewer country bounds (UG fallback) |
| **Trust** | Admin verify; phone; attestation; reports |
| **Homepage** | Kampala D3 hero; no live Maps API on `/` |

---

*Last updated: 2026-06-08 — Sprint 5D global discovery (full country catalog, geo_places search areas, UGX-hub FX); migrations through 025*
