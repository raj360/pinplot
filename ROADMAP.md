# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. Uganda launch, global-ready.
> Design reference: [SchoolSpring job finder UX](https://mpsaz.schoolspring.com/)

---

## Vision

Tenants browse buildings on a map for free. They pay a small fee to unlock exact location and landlord contact. Landlords pay to mark units available. The first tenant to pay wins exclusive contact access for 72 hours.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js **16.0.11**, React 19, Tailwind CSS 4, 2px border radius |
| Backend | NestJS REST (`/api/v1`) |
| Database | Supabase Postgres + PostGIS |
| Auth | Supabase Auth (email + phone OTP) |
| Storage | Supabase Storage (HD images) |
| Maps | Google Maps JS API + MarkerClusterer |
| Payments | Flutterwave (MTN/Airtel UG) + Stripe (cards / diaspora) |
| Monorepo | Yarn workspaces + Turborepo |

---

## Phase 1 — Foundation (Weeks 1–2) ✅ In progress

**Goal:** Runnable monorepo, design system, schema, health checks.

- [x] Monorepo scaffold (`apps/web`, `apps/api`, `packages/shared-types`)
- [x] ROADMAP + SPRINT_TASK tracking docs
- [x] Shared types (roles, permissions, pricing constants)
- [x] Supabase SQL migration skeleton (`001_initial_schema.sql`)
- [x] Landing page + explore shell (mock map/list split)
- [x] NestJS health endpoint
- [ ] Supabase project created + migration applied
- [ ] `.env` wired locally
- [ ] Git init + first commit

---

## Phase 2 — Core Product (Weeks 3–5)

**Goal:** Real buildings, units, map, and admin-on-behalf flows.

- [ ] Supabase Auth integration (tenant + landlord signup)
- [ ] Profiles table sync on signup (role selection)
- [ ] Buildings CRUD (landlord + admin-on-behalf)
- [ ] Units CRUD with status grid (12-unit buildings)
- [ ] HD image upload (Supabase Storage, min 1200px)
- [ ] Google Maps: bounds API + MarkerClusterer + cluster popup
- [ ] List/map split + Hide Map toggle (SchoolSpring pattern)
- [ ] Approximate pin vs exact address gating
- [ ] REST endpoints:
  - `GET /buildings?bounds=&filters=`
  - `GET /buildings/:id`
  - `POST /buildings` (landlord/admin)
  - `PATCH /units/:id/status` (pre-payment validation only)

---

## Phase 3 — Payments (Weeks 6–7)

**Goal:** Monetization live — 30k UGX listing, 20k UGX unlock.

- [ ] Flutterwave mobile money (Uganda)
- [ ] Stripe Checkout (cards, multi-currency display)
- [ ] Landlord: pay before status change (AVAILABLE / UNAVAILABLE)
- [ ] Tenant: pay to unlock with first-wins row lock (`FOR UPDATE`)
- [ ] Webhook handlers + idempotency
- [ ] Unlock history + landlord notification
- [ ] Refund policy for failed/race-lost unlocks

---

## Phase 4 — Admin & Launch (Weeks 8–10)

**Goal:** Trust, moderation, pilot listings in Kampala.

- [ ] Admin dashboard (`/admin` route group or separate app)
- [ ] Verify buildings before public listing
- [ ] Superadmin: country pricing config
- [ ] RBAC guards (port LPMS permission pattern)
- [ ] PWA manifest + service worker
- [ ] Seed 20–30 Kampala buildings (agent partnerships)
- [ ] Soft launch: WhatsApp groups, Twitter/X Uganda RE communities

---

## Phase 5 — Growth (Months 3–6)

- [ ] React Native app (reuse REST API)
- [ ] Featured building placements (50k UGX / 7 days)
- [ ] Verified landlord badge
- [ ] Tenant waitlist when unit is LOCKED
- [ ] Kenya (`KE`) + Tanzania (`TZ`) country rows
- [ ] SEO pages per district (`/kampala/namuwongo`)

---

## Success Metrics

| Milestone | Target |
|-----------|--------|
| MVP live | Week 10 |
| Pilot buildings | 20+ verified |
| Month 3 unlocks | 150+ |
| Month 6 MRR (UGX gross) | 21M+ (~$5.6k) |
| Unlock conversion | 5%+ of map browsers |

---

## Out of Scope (v1)

- Lease management / rent collection (see Rentolynk — different product)
- In-app messaging
- Background checks
- Multi-tenant schema isolation (country_code + RLS is enough)

---

## Reference Repos (reuse patterns, not code copy)

| Repo | Borrow |
|------|--------|
| `lpm-multi-tenant-template` | RBAC, admin sidebar |
| `bondex/remote3` | Stripe checkout flow |
| `freelance/talkback-app` | Payment service structure |
| `rentolynk` | Uganda property field names |
| `kapeesa/current` | Mobile bottom-sheet UX |

---

*Last updated: Sprint 1 — repo bootstrap*
