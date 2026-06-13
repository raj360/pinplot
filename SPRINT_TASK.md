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

## Sprint 5E — Explore polish, viewer UX & homepage personalization — **✅ implemented (2026-06-09)**

**Goal:** Stable explore on mobile/desktop, correct SSR viewer context, and a homepage that prioritizes local featured supply while surfacing global discovery.

```bash
yarn db:migrate   # applies 026 (RLS), 027 (country map backfill) if not yet run
```

| ID | Task | Status | Notes |
|----|------|--------|-------|
| E-01 | Mobile explore: pin tap, tooltip link, hide-map bootstrap | Done | `ExploreClient`, `PlotPinMap` |
| E-02 | Disable Google Maps POI click popups | Done | `clickableIcons: false` + POI styles |
| E-03 | Explore filter bar mobile UX | Done | Where/Filters divider; compact footer |
| E-04 | Country map defaults from catalog + `geo_places` | Done | `country-map-defaults.ts`; migration `027` |
| E-05 | Block map interaction while loading/searching | Done | `interactionBlocked` on map |
| E-06 | Fix infinite loaders (map-idle bootstrap fallback) | Done | Fallback `useEffect` when map hidden/slow |
| E-07 | Global map bounds listing query | Done | Removed hardcoded `countryCode=UG` in `load-buildings.ts` |
| E-08 | Viewer country: location-first + SSR cookie | Done | `resolve-viewer-country.ts`, `ViewerContextProvider` |
| E-09 | Viewer-currency-primary pricing display | Done | `format-money.ts`; hero UGX footnote only in Uganda |
| E-10 | Featured: local grid + worldwide carousel | Done | `FeaturedListingsSection`, `FeaturedListingsCarousel` |
| E-11 | Featured API scopes | Done | `localOnly`, `excludeCountryCode` on `GET /buildings/featured` |
| E-12 | Carousel explore-country deep links + stats | Done | `explore-country-link.ts`; market/unit header |
| E-13 | Unlock: card default outside MoMo markets | Done | Payer = resolved `viewer.countryCode` |
| E-14 | Pointer cursor on interactive controls + avatar | Done | `globals.css`, `UserMenu` |
| E-15 | Skeleton shimmer + radius fix | Done | `skeleton.tsx`, `globals.css` |
| E-16 | RLS on public catalog tables | Done | Migration `026` |
| E-17 | Navigation progress on route changes | Done | `NavigationProgress` in `AppProviders` |
| E-18 | Client-side catalog/geo/FX caching | Done | TTL localStorage + API `Cache-Control` |

**Deferred from 5E:** Featured recommendation/ranking service; explore empty-state copy refresh for multi-market supply; extend `SUPPLY_MARKET_CODES` beyond UG.

---

## Sprint 5F — Role dashboards & featured monetization — **✅ implemented (2026-06-09)**

**Goal:** Tenant sidebar shell, landlord featured stats, and live paid featured checkout (S5-08 pulled forward from Phase 6).

| ID | Task | Status | Notes |
|----|------|--------|-------|
| F-01 | Tenant sidebar layout (`SidebarAppShell` + `TENANT_NAV`) | Done | `/tenant/*` now matches landlord/admin shells |
| F-02 | `FEATURED_PRICING_TIERS` (7d/14d/30d = UGX 30k/50k/90k) | Done | `shared-types`; presented in viewer currency via FX |
| F-03 | `POST /payments/featured/checkout` (landlord) | Done | `FeaturedCheckoutService` — FW (MoMo markets) / Lemon Squeezy (cards) |
| F-04 | Settlement branches on `purpose = FEATURED` | Done | Webhooks + redirect confirm grant `featured_source = 'PAID'`; extends active window |
| F-05 | `featured_grants` audit row on paid grant | Done | `admin_id` = paying landlord |
| F-06 | Landlord featured stats | Done | `findByLandlord`/`findMineById` return `isFeatured`, `featuredUntil`, `unlockCount` |
| F-07 | `FeaturedBoostPanel` on building manage page | Done | Status, unlock count, tier buy buttons |
| F-08 | Dashboard stat cards: tenant unlocks · featured now | Done | Plus per-building featured/unlock badges |
| F-09 | `/landlord/featured/complete` return page | Done | Mirrors tenant unlock completion (FW + LS confirm + poll) |

**Business decisions recorded in [docs/BUSINESS-MODEL.md](./docs/BUSINESS-MODEL.md) §8:**
- Unlock stays **exclusive by default** (anti-blocker promise); landlord opt-in capped "open contact" mode is the Phase 6-compatible path (M-01)
- `/day` rental period planned via `units.rent_period` (R-01)
- Listing stays **free** — no listing fee; escalate anti-spam guardrails only on abuse signals

---

## Sprint 5G — Stay class (AirBnB /day) + dashboard polish — **✅ implemented (2026-06-10)**

```bash
yarn db:migrate   # applies 028 (units.rent_period)
```

| ID | Task | Status | Notes |
|----|------|--------|-------|
| G-01 | Migration `028_rent_period` + backfill airbnb → day | Done | |
| G-02 | `resolveUnlockPolicy()` in shared-types | Done | 72h+lock vs 24h+stay available |
| G-03 | Unlocks service: skip unit LOCK for short-stay | Done | |
| G-04 | `formatListingRent` / `/night` display sitewide | Done | Viewer currency first; DB stores `day` |
| G-09 | Stale unit lock release on unlock + explore | Done | `releaseStaleUnitLock` + `releaseExpiredUnitLocks` |
| G-05 | Unlock copy: verified contact vs exclusive | Done | Modal unchanged structurally |
| G-06 | Dashboard skeletons (stats, listings, tenant unlocks) | Done | Replaces spinners |
| G-07 | Featured boost pricing — UGX footnote only in Uganda | Done | Matches hero / homepage |
| G-08 | Defer open-contact (M-01) — docs updated | Done | BUSINESS-MODEL §8.1 |

---

## Sprint 5C — Uganda polish (P1)

| ID | Task | Status |
|----|------|--------|
| S5-04 | MoMo UX polish | Pending |
| S5-05 | USSD | Pending |
| N-08 | SMS unlock alert (Africa's Talking) | Pending |

---

## Sprint 5H — Unlock lifecycle, analytics & scheduled notifications — **✅ implemented (run migrations 029–031)**

**Goal:** Close gaps from 5G review — expired unlock visibility, listing view metrics for landlords/admins, cron-based reminder emails, schema hygiene for dormant tables.

**Prerequisite:** 5B live unlocks + 5G stay-class policy in prod.

```bash
yarn db:migrate   # applies 029 (notification_log), 030 (listing_analytics_events), 031 (drop listing_events)
# Ops after deploy: Railway cron — docs/OPS-CRON.md (CRON_SECRET on API + cron service)
```

### Track A — Unlock lifecycle (P0, ~2 days)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| H-01 | Stale `LOCKED` → `AVAILABLE` on expiry | Done | Hourly cron (`POST /cron/hourly`); unlock checkout safety net only |
| H-02 | `GET /unlocks/mine?status=active\|expired\|all` | Done | Default `active` |
| H-03 | Tenant UI: **Active** + **Past unlocks** tabs | Done | |
| H-04 | Expired row copy + CTA | Done | “Unlock again on Explore” |
| H-05 | Landlord: optional “lock ended” in-app hint | Done | Server inbox (`user_notifications`) + dashboard banner + manage countdown |

**Exit:** Tenants see unlock history; long-term units reappear on map after expiry (H-01).

### Track B — Scheduled notifications (P0, ~3 days)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| H-10 | Migration `029_notification_log` | Done | |
| H-11 | Secured cron endpoints `POST /cron/*` | Done | `CRON_SECRET`; prod = Railway — [OPS-CRON.md](./docs/OPS-CRON.md) |
| H-12 | **N-06a** Landlord unlock expiring (12h left) | Done | |
| H-13 | **N-06b** Tenant unlock expiring (24h left) | Done | Short-stay vs long-term copy |
| H-14 | **N-06c** Unlock expired (day-of) | Done | Tenant + landlord |
| H-15 | **N-12** Landlord unit lock ended | Done | Before lock release in hourly job |
| H-16 | **N-13** Featured expiring (7d left) | Done | |
| H-17 | Postmark templates for above | Done | `TransactionalEmailBuilder` |
| H-18 | **N-07** Stale AVAILABLE (30d) cron | Done | Weekly cadence via hourly job (deduped per unit) |

**Cron schedule (UTC):**

| Job | Cadence | Query window |
|-----|---------|--------------|
| `unlock-expiring` | Hourly | `expires_at` in (now+11h, now+13h) landlord · (now+23h, now+25h) tenant |
| `unlock-expired` | Hourly | `expires_at` in (now−1h, now) and not yet logged |
| `unit-lock-ended` | Hourly | `locked_until` in (now−1h, now) |
| `featured-expiring` | Daily 08:00 | `featured_until` in 7 days |
| `stale-available` | Weekly Mon | units `AVAILABLE` 30d+ unchanged |

**Exit:** No silent unlock expiry; landlords get actionable reminders.

### Track C — Listing analytics (P1, ~4 days)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| H-20 | Migration `030_listing_analytics_events` | Done | |
| H-21 | `POST /analytics/events` (batch, rate-limited) | Done | Optional auth |
| H-22 | Client: map pin / card **impression** | Done | IntersectionObserver |
| H-23 | Client: building panel **detail_view** | Done | On panel open |
| H-24 | Client: **unlock_click** (funnel) | Done | Before checkout modal |
| H-25 | Landlord stats: views, detail views, unlock rate | Done | FeaturedBoostPanel + `findMineById` metrics |
| H-26 | Admin overview: top listings, featured CTR | Done | `GET /admin/analytics/overview` |
| H-27 | Daily rollup job | Done | `building_metrics_daily` + hourly cron refresh |
| H-31 | **`saved_buildings` MVP** | Done | Heart on Explore + `/tenant/saved` |

**Event schema (`listing_analytics_events`):**

```sql
event_type   TEXT  -- IMPRESSION | DETAIL_VIEW | UNLOCK_CLICK
                  -- CONTACT_CALL | CONTACT_WHATSAPP | CONTACT_COPY | DIRECTIONS  (034)
building_id  UUID  NOT NULL
unit_id      UUID  NULL
unlock_id    UUID  NULL          -- migration 034, post-unlock engagement
viewer_id    UUID  NULL          -- authenticated
session_id   TEXT  NULL          -- anon fingerprint (cookie)
source       TEXT  NULL          -- explore | featured | direct | unlocks
country_code CHAR(2) NULL
created_at   TIMESTAMPTZ
```

**Metrics exposed:**

| Audience | Metrics |
|----------|---------|
| Landlord | Impressions (7d/30d), detail views, unlock clicks, unlocks, conversion % |
| Admin | Same + featured vs non-featured comparison |
| Product | Homepage → explore CTR (UTM Phase 6) |

**Exit:** Landlords see view performance; featured ROI measurable.

### Track E — In-app notification inbox (N-09 v1) — **✅ implemented (run migration 033)**

**Goal:** Server-side inbox for cron + transactional events; bell in header; landlord dashboard banners. Email remains optional audit via `notification_log`.

```bash
yarn db:migrate   # applies 033 (user_notifications)
```

| ID | Task | Status | Notes |
|----|------|--------|-------|
| N-09a | Migration `033_user_notifications` | Done | `read_at`, `dismissed_at`, idempotent `(user_id, type, dedupe_key)` |
| N-09b | `InAppNotificationsService` + REST API | Done | `GET /notifications/mine`, unread count, read/dismiss, mark-all-read |
| N-09c | Cron + transactional create in-app first | Done | `scheduled-notifications`, landlord/tenant notify services |
| N-09d | Web: `NotificationBell` in header | Done | Unread badge + dropdown |
| N-09e | Web: landlord lock-ended banner | Done | `InAppNotificationBanner` on dashboard (server dismiss) |
| N-09f | Dedicated `/notifications` page | Pending | Phase 6 polish |

**Exit:** Users see unread count in-app; dismiss/read persists server-side; lock-ended alerts no longer use localStorage.

---

## Sprint 5I — Tenant unlock hub (UX + engagement) — **✅ implemented (run migration 034)**

**Goal:** Deliver clear ROI after paid unlock — contact-first hub, engagement tracking for feedback, no locked→unlocked flash on building detail.

```bash
yarn db:migrate   # applies 034 (unlock engagement event types + unlock_id on analytics)
```

| ID | Task | Status | Notes |
|----|------|--------|-------|
| U-01 | **My unlocks** Phase 1 — contact-first layout, open contact, copy, time progress | Done | `UnlockedAccessCard` |
| U-02 | Engagement analytics events | Done | `CONTACT_CALL`, `CONTACT_WHATSAPP`, `CONTACT_COPY`, `DIRECTIONS` + `unlock_id` |
| U-03 | Phase 2 — multi-unlock picker, `?tab=&unlock=` deep links, mobile bell | Done | `UnlockPickerList`, `AppHeader` |
| U-04 | Phase 3 — building unlock session cache, detail skeleton gate, mobile bar, share/calendar | Done | `unlocks-cache.ts`, `UnlockAccessTools` |
| U-05 | Phase 4 — enrich unlock API (rent, bedrooms, district/city, amount paid) | Done | `GET /unlocks/mine`, building unlocks |
| U-06 | Post-unlock feedback prompt (engagement + 24h rule, cron) | Pending | Uses analytics intent events |
| U-07 | Dedicated `/notifications` page | Pending | Moved from N-09f |

**Exit:** Tenants reach landlord contact in one tap; unlock hub shows listing context and actual paid amount; product can target feedback to users who tapped Call/WhatsApp/directions.

### Track D — Schema hygiene (P2, parallel)

| ID | Task | Status | Decision |
|----|------|--------|----------|
| H-30 | **`listing_events`** | Done | Dropped in migration `031` |
| H-31 | **`saved_buildings`** | Done | Heart on explore + `/tenant/saved` + API |
| H-32 | PostGIS catalog tables | N/A | No action — system tables; document in runbook |

---

## Phase 6 — Deferred monetization & growth

| ID | Task | Notes |
|----|------|-------|
| ~~S5-08~~ | ~~Paid featured~~ | **✅ Done in 5F** — market it once unlock volume proves ROI |
| M-01 | Multi-unlock "open contact" mode (landlord opt-in, cap 3, discounted fee) | BUSINESS-MODEL §8.1 |
| ~~R-01~~ | ~~`units.rent_period` — `/night` for short-stay~~ | **✅ Done in 5G** |
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
| Explore polish + homepage featured (5E) | ✅ (migrations 026–027; local + worldwide featured) |
| Tenant sidebar + paid featured (5F) | ✅ |
| Stay class /night + stale lock fix (5G) | ✅ (migration 028) |
| Unlock history + analytics + cron notifications (5H) | ✅ (migrations 029–031; Railway cron after deploy — [OPS-CRON.md](./docs/OPS-CRON.md)) |
| In-app notification inbox (N-09 v1) | ✅ (migration 033; bell + server dismiss) |
| Tenant unlock hub + engagement analytics (5I) | ✅ (migration 034; phases 1–4) |
| Stripe / LLC | ⏸ deferred |

---

## Recommended build order

```
Done:  5A · 5B · 5D · 5E · 5F · 5G · 5H · N-09 v1 · 5I (phases 1–4)
Next:  Ops go-live (Railway cron, migrations 029–034) · U-06 feedback cron · 5C MoMo polish (SMS paused)
Later: M-01 open-contact · `/notifications` page · LLC+Stripe when justified
Ops:   yarn fx:refresh daily (GitHub) · Railway hourly cron after deploy — docs/OPS-CRON.md
```

### Sprint 5H suggested day order

```
Day 1:   H-02, H-03, H-04 (tenant unlock history)
Day 2:   H-10, H-11, H-17 (notification_log + cron infra + templates)
Day 3:   H-12 → H-16 (expiring + expired + lock-ended + featured emails)
Day 4–5: H-20 → H-25 (analytics schema, track API, client events, landlord stats)
Day 6:   H-26 (admin slice) · H-30 (drop listing_events) · H-18 if time (stale AVAILABLE)
```

---

*Last updated: 2026-06-13 — Sprint 5I tenant unlock hub (phases 1–4); migration 034 engagement analytics*
