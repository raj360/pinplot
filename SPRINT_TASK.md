# PlotPin — Sprint Tasks

> Track active work here. Move completed items to **Done** with date.
> Aligns with [ROADMAP.md](./ROADMAP.md) Phase 1–2.

---

## Sprint 2 — Auth & Map

**Dates:** 2026-05-28 → 2026-06-24  
**Goal:** Supabase migrations live, real buildings on map, auth signup, REST API.

### In progress

| ID | Task | Status |
|----|------|--------|
| S2-08 | Supabase Storage image upload UI | Backlog → Sprint 3 |
| S2-09 | Landlord create-building form (POST API) | Backlog |
| S2-10 | Admin verify-building toggle | Backlog |

### Backlog (Sprint 3)

| ID | Task | Phase |
|----|------|-------|
| S3-01 | Flutterwave + Stripe unlock/listing payments | 3 |
| S3-02 | First-unlock-wins transaction | 3 |
| S3-03 | HD image upload to Storage | 3 |

---

## Sprint 1 — Repo Bootstrap ✅

**Completed:** 2026-05-28

---

## Done

| ID | Task | Completed |
|----|------|-----------|
| S1-01 | Monorepo root scaffold | 2026-05-28 |
| S1-02 | Next.js 16.0.11 web app | 2026-05-28 |
| S1-03 | NestJS REST + health endpoint | 2026-05-28 |
| S1-04 | shared-types package | 2026-05-28 |
| S1-05 | Supabase migration skeleton | 2026-05-28 |
| S1-06 | Landing page | 2026-05-28 |
| S1-07 | Explore shell (mock list/map) | 2026-05-28 |
| S1-08 | yarn install + build verified | 2026-05-28 |
| S1-09 | Supabase project + migrations applied | 2026-05-28 |
| S1-10 | `.env` configured (Supabase DATABASE_URL) | 2026-05-28 |
| S1-11 | Git pushed to origin | 2026-05-28 |
| S2-01 | Supabase Auth client + middleware (Next.js) | 2026-05-28 |
| S2-02 | Profile sync API (`POST /profiles/sync`) | 2026-05-28 |
| S2-03 | `GET /buildings` bounds query + seed data | 2026-05-28 |
| S2-04 | Google Maps MarkerClusterer component | 2026-05-28 |
| S2-05 | Building detail page + unit grid | 2026-05-28 |
| S2-06 | Landlord dashboard shell | 2026-05-28 |
| S2-07 | Admin layout + RBAC docs | 2026-05-28 |
| — | Migrations 002 (RLS + auth trigger) | 2026-05-28 |
| — | Migration 003 (Kampala seed — 3 buildings) | 2026-05-28 |
| — | `yarn db:migrate` script | 2026-05-28 |

---

## Definition of Done

- [x] `yarn build` passes for web + api
- [x] Migrations applied to Supabase
- [x] No secrets committed (`.env` gitignored)
- [ ] ROADMAP checkboxes updated on merge

---

## Commands

```bash
yarn install
yarn workspace @plotpin/shared-types build
yarn dev:web    # http://localhost:3000
yarn dev:api    # http://localhost:4000/api/v1/health
yarn db:migrate # apply supabase/migrations/*.sql
```

---

*Last updated: Sprint 2 bootstrap — 2026-05-28*
