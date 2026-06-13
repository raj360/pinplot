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

**Phase:** Sprint 4 ✅ → 5A trust ✅ → 5B unlock payments (FW + Lemon Squeezy) ✅ → 5D global discovery ✅ → **5E explore & homepage polish ✅** → **5F–5I dashboards, stay-class, lifecycle & unlock hub ✅** → 5C Uganda rails polish (next)

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Homepage v2 with **personalized featured**, **global explore**, paid unlock, **My unlocks hub** (contact-first, share/calendar, deep links), **saved listings**, in-app notification bell | Feedback prompts (U-06) · MoMo/SMS polish (5C) |
| **Landlord** | Submit (any country), photos, unit status, reject + resubmit, **paid featured**, unlock/view stats on dashboard | Extend `SUPPLY_MARKET_CODES` as markets launch |
| **Admin** | Approve/reject, coupons, featured launch, verification checklist, reports, listing analytics overview | — |

**Monetization:** [docs/BUSINESS-MODEL.md](./docs/BUSINESS-MODEL.md) — free listing, paid unlock.  
**Payments:** [docs/PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md) — **Flutterwave + Lemon Squeezy** now; **Stripe when US LLC exists**.

---

## Phase 4 — Supply, wallet & international foundations — **✅ complete**

- Wallet, coupons, reject, homepage v2, D3 hero, featured launch, FX, IP geo, country catalog  
- Details: [SPRINT_TASK.md](./SPRINT_TASK.md)

---

## Phase 5A — Trust, access & engagement — **✅ complete**

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

## Phase 5B — Unlock payments — **✅ complete**

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

## Phase 5E — Explore polish, viewer UX & homepage personalization — **✅ complete (2026-06-09)**

**Goal:** Production-quality explore on mobile/desktop, correct viewer context on SSR, and a homepage that feels personalized for a global audience.

| Area | Deliverable |
|------|-------------|
| **Explore** | Mobile pin/tap + tooltip fixes; POI popups disabled; map non-interactive while loading; bootstrap fallback when map hidden/slow (no infinite spinners) |
| **Map & listings** | Remove hardcoded `countryCode=UG` on bounds query — verified listings appear in any market (e.g. London); country map center/bounds from catalog → `geo_places` → global fallback |
| **Viewer context** | Location-first country (stored override → IP → timezone/locale → profile); SSR cookie hint; hydration-safe hero; viewer-currency-primary rent + unlock labels |
| **Homepage featured** | Local featured grid (viewer country) + **Featured around the world** carousel; API `localOnly` / `excludeCountryCode`; per-card **Explore {country} on map** links + market/unit stats |
| **Unlock UX** | Card checkout default for non–Flutterwave MoMo viewers (uses resolved viewer country, not profile billing country) |
| **UI polish** | Global pointer cursor on interactive controls; avatar menu cursor; skeleton shimmer; navigation progress |
| **Data / security** | Migration `026` RLS on public catalog tables; migration `027` backfill `countries.map_center` / `map_bounds` from `geo_places` |

**Next (deferred):** Featured ranking / recommendation service as inventory grows; refresh explore empty-state copy for multi-market supply.

---

## Phase 5F — Role dashboards & paid featured — **✅ complete (2026-06-09)**

Tenant sidebar shell, landlord featured checkout (S5-08), dashboard stat cards. See [SPRINT_TASK.md](./SPRINT_TASK.md) §5F.

---

## Phase 5G — Stay class (`/night`) + dashboard polish — **✅ complete (2026-06-10)**

Short-stay unlock policy (24h verified contact vs 72h exclusive), stale lock release, dashboard skeletons. Migration `028`. See [SPRINT_TASK.md](./SPRINT_TASK.md) §5G.

---

## Phase 5H — Unlock lifecycle, analytics & cron notifications — **✅ complete**

Tenant active/past unlock tabs, listing analytics, hourly cron emails, in-app inbox (N-09). Migrations `029`–`031`, `033`. See [SPRINT_TASK.md](./SPRINT_TASK.md) §5H · [OPS-CRON.md](./docs/OPS-CRON.md).

---

## Phase 5I — Tenant unlock hub (UX + engagement) — **✅ complete (2026-06-13)**

**Goal:** Paid unlock feels worth it — fast contact, listing context on hub cards, measurable intent for feedback.

| Area | Deliverable |
|------|-------------|
| **My unlocks** | Contact-first layout; open contact post-payment; copy address/phone; time progress bar |
| **Multi-unlock** | List/detail picker (desktop + mobile strip); `?tab=active\|expired&unlock=` deep links from notifications |
| **Mobile** | Notification bell in header; sticky Call / WhatsApp / Directions bar on unlock cards |
| **Building detail** | Session unlock cache + skeleton until status known (no locked→unlocked flash) |
| **Share** | Add calendar reminder, share/copy unlock hub link |
| **Analytics** | Post-unlock engagement events (`CONTACT_*`, `DIRECTIONS`) with `unlock_id` — migration `034` |
| **API** | Unlock payloads include rent, bedrooms, district/city, amount paid from `payments` join |

**Next:** U-06 engagement-based feedback prompt (cron); dedicated `/notifications` page.

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
| **Display** | `formatMoney` — viewer currency primary; listing native currency as footnote when different |
| **Currency** | `fx_rates` is UGX-hub; cross any pair via UGX; refresh **daily** |
| **Supply vs browse** | Browse global via `geo_places`; map loads verified listings in viewport (supply markets still `SUPPLY_MARKET_CODES`; extend as markets launch) |
| **Listing** | **Free** after admin verification |
| **Payments** | One unlock flow; route to FW or Lemon Squeezy; card default outside MoMo markets |
| **Map** | Near me → GPS; deny → viewer country bounds from catalog/geo; not Kampala-by-default |
| **Trust** | Admin verify; phone; attestation; reports |
| **Homepage** | Kampala D3 hero; personalized featured (local + worldwide carousel); no live Maps API on `/` |

---

*Last updated: 2026-06-13 — Sprint 5I tenant unlock hub; migrations through 034*
