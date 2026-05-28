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

## Phase 1 — Foundation (Weeks 1–2) ✅ Complete

- [x] Monorepo scaffold
- [x] Supabase project + migrations applied (`001`, `002`, `003`)
- [x] `.env` with Supabase `DATABASE_URL`
- [x] Git pushed

## Phase 2 — Core Product (Weeks 3–5) 🔄 In progress

- [x] Supabase Auth (email signup/login)
- [x] Profile sync API + auth trigger
- [x] Buildings REST API with bounds query
- [x] Kampala seed data (3 buildings, 20 units)
- [x] Explore page wired to API + map component
- [x] Building detail page with unit grid
- [x] Landlord dashboard shell
- [x] Admin layout shell
- [ ] Landlord create-building form
- [ ] Admin verify-building workflow
- [ ] HD image upload (Supabase Storage)
- [ ] Google Maps API key in production env

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
