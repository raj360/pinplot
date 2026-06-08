# PlotPin — Sprint Tasks

## Strategic shift (June 2026)

**Product direction:** Open internationally for **discovery and diaspora tenants** while **Uganda remains primary supply market**. English-only UI. **Currency presentation** (not translation).

**Monetization:** **Free verified listing** · **Paid tenant unlock** · Featured/badge ~3 months post-launch — [docs/BUSINESS-MODEL.md](./docs/BUSINESS-MODEL.md)

**Payments (updated):** **Flutterwave + Lemon Squeezy** for Sprint 5B — **no US LLC / Stripe until traction** — [docs/PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md)

**Trust:** Anti-blocker positioning — [docs/TRUST-ANTI-SCAM.md](./docs/TRUST-ANTI-SCAM.md)

**Planning index:** [docs/README.md](./docs/README.md) · **Build order:** [docs/IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md)

---

## Sprint 4 — **✅ complete**

```bash
yarn db:migrate   # through 022 for Sprint 5B
```

Keep `ALLOW_DEV_UNLOCK=1` in dev until Sprint **5B** webhooks enforce unlock payment.

---

## Sprint 5A — Trust, access & engagement — **✅ implemented (run migration 020)**

| ID | Task | Status | Ref |
|----|------|--------|-----|
| T-01 | Landlord phone required before admin approve | Done | TRUST |
| T-02 | Ownership attestation on landlord submit | Done | TRUST |
| T-03 | `/terms` + `/privacy` pages | Done | legal/ |
| T-04 | Terms acceptance on submit + unlock | Done | T-03 |
| T-05 | Admin verification checklist UI | Done | TRUST §4 |
| T-06 | Report listing + admin queue | Done | TRUST |
| T-07 | Duplicate pin warning on approve | Done | TRUST |
| T-08 | New landlord building cap | Done | TRUST |
| T-09 | Free listing UX — remove listing fee banner | Done | BUSINESS |
| N-01 | Postmark integration | Done | NOTIFICATIONS |
| N-02 | Email: listing approved | Done | N-01 |
| N-03 | Email: listing rejected | Done | N-01 |

**Order:** T-03 → T-04 → T-09 → T-01 → T-02 → T-05 → T-06–T-08 → N-01–N-03

---

## Sprint 5B — Unlock payments (Flutterwave + Lemon Squeezy) — **✅ implemented**

**Gate:** Sprint 5A exit ✅ · **No Stripe / LLC in this sprint**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P-00 | `LEMON_SQUEEZY` on `payment_provider` enum | Done | Migration `021` |
| S4-20 | Multi-country `pricing_rules` seed | Done | Migration `022` |
| S5-01a | `POST /units/:unitId/unlock/checkout` + routing | Done | UG → FW; intl → LS |
| S5-01b | Lemon Squeezy checkout + webhook | Done | `LEMON_SQUEEZY_*` env |
| S5-01c | Flutterwave checkout + webhook | Done | `FLUTTERWAVE_*` env |
| S5-02 | Shared settleUnlock idempotency | Done | `SettleUnlockService` |
| S5-03 | Enforce unlock payment (prod) | Done | `ALLOW_DEV_UNLOCK` off in prod |
| S5-07 | Wallet + payment reconciliation | Done | Credit peek + partial charge |
| N-04 | Email: landlord unlock received | Done | Postmark |
| N-05 | Email: tenant unlock receipt | Done | Postmark |

**Deferred:** ~~S5-01 Stripe~~ · ~~US LLC~~ · ~~landlord listing fee~~

**Later (volume):** US LLC + Stripe migration — [PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md) §8

---

## Sprint 5D — Global discovery, catalog & multi-currency — **✅ implemented (run migrations 023–025)**

**Goal:** Open browse/discovery to **every country** while listing supply stays Uganda-only (`SUPPLY_MARKET_CODES = ["UG"]`). Dynamic, low-cost area search; viewer-aware currency everywhere.

```bash
yarn db:migrate            # applies 023, 024, 025
yarn db:seed:countries     # full ISO catalog (~250 countries) — one-time
yarn db:seed:geo           # geo_places search areas — one-time (~50 min)
yarn fx:refresh            # FX rates — schedule DAILY (cron)
```

| ID | Task | Status | Notes |
|----|------|--------|-------|
| G-01 | Full ISO country catalog (~250) | Done | Migration `023` + `seed-countries-catalog.mjs` (dr5hn, ODbL) |
| G-02 | `geo_places` search-area catalog | Done | Migration `024`; `seed-geo-places.mjs` (GeoNames + manual UG neighborhoods) |
| G-03 | `GET /api/v1/geo/places?country=XX` | Done | 24h cache; zero runtime Maps/geocoder cost |
| G-04 | Country-scoped Where picker | Done | `useGeoPlaces(viewer.countryCode)` → regions/cities/areas of viewer's country only |
| G-05 | Recent searches (localStorage) | Done | Zero-API fallback in Where dropdown |
| G-06 | FX **UGX-hub** model + cross-rate | Done | `refresh-fx-rates.mjs` (open.er-api.com); `convertMoney` crosses via UGX |
| G-07 | Viewer country from real ISO (IP/profile/browser) | Done | `resolve-viewer-country.ts` — no more `ROW` collapse |
| G-08 | Admin edit shows **listing** currency (not hardcoded UGX) | Done | `AdminEditBuildingClient` |
| G-09 | Drop legacy `countries` fee columns | Done | Migration `025` (`tenant_unlock_fee`/`landlord_listing_fee` — never read; pricing is UGX via `pricing_rules`) |
| G-10 | Normalize non-ISO catalog currency (AQ `AAD`→`USD`) | Done | Seed override; full FX coverage (only `KPW`/N. Korea skipped) |

**Robustness:** geo seed is now **per-country atomic + streaming** (`spawn unzip`) — a failure on one country (e.g. CN/US) no longer wipes the table; resume via `GEO_COUNTRIES=<codes>`.

**Current data:** 250 active countries · 153 FX-covered currencies · 16,094 geo places (246 countries) · 0 orphans.

**Reseed cadence:** countries + geo = **one-time** (idempotent); **`fx:refresh` = daily cron** (rates move daily).

---

## Sprint 5C — Uganda polish (P1)

| ID | Task | Status |
|----|------|--------|
| S5-04 | MoMo UX polish | Pending |
| S5-05 | USSD | Pending |
| N-06 | SMS unlock alert | Pending |

---

## Phase 6 — Deferred monetization & growth

| ID | Task | Notes |
|----|------|-------|
| S5-08 | Paid featured | ~3 months post-launch |
| T-14 | Verify badge (one-time) | Optional |
| S4-19 | Landlord country on create | |
| **P-LLC** | US LLC + Stripe | When PAYMENTS-STRATEGY §8 triggers |
| S6-* | UTM, Open Graph, PWA | |

---

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Sprint 4 complete | ✅ |
| Payments strategy documented | ✅ |
| Trust / terms plan | ✅ docs |
| Sprint 5A guardrails | ✅ (run `yarn db:migrate` → 020) |
| Live unlock (FW + LS) | ✅ (configure PSP keys + webhooks) |
| Global discovery + catalog + FX (5D) | ✅ (migrations 023–025; run seeds; FX daily cron) |
| Stripe / LLC | ⏸ deferred |

---

## Recommended build order

```
Done:  5A (trust + terms + notifications) · 5B (FW + Lemon Squeezy unlock) · 5D (global catalog + geo + FX)
Next:  5C polish · Phase 6 featured · LLC+Stripe when justified
Ops:   yarn fx:refresh on a daily cron
```

---

*Last updated: 2026-06-08 — Sprint 5D global discovery (catalog + geo_places + UGX-hub FX); migrations through 025*
