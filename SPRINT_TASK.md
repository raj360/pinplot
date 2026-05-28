# PlotPin — Sprint Tasks

> Track active work here. Move completed items to **Done** with date.
> Aligns with [ROADMAP.md](./ROADMAP.md) Phase 1–2.

---

## Sprint 1 — Repo Bootstrap

**Dates:** 2026-05-28 → 2026-06-10  
**Goal:** Monorepo runs locally; explore UI shell visible; API health check passes.

### In progress

| ID | Task | Owner | Notes |
|----|------|-------|-------|
| S1-01 | Monorepo root (yarn workspaces, turbo, docker-compose) | — | Done in scaffold |
| S1-02 | `@plotpin/web` Next.js 16.0.11 + Tailwind 2px radius | — | Done in scaffold |
| S1-03 | `@plotpin/api` NestJS REST + `/api/v1/health` | — | Done in scaffold |
| S1-04 | `@plotpin/shared-types` enums + permissions | — | Done in scaffold |
| S1-05 | Supabase migration `001_initial_schema.sql` | — | Done in scaffold |
| S1-06 | Landing page (`/`) | — | Done in scaffold |
| S1-07 | Explore shell (`/explore`) mock list/map split | — | Done in scaffold |
| S1-08 | `yarn install` + verify `yarn dev:web` + `yarn dev:api` | — | Done 2026-05-28 |
| S1-09 | Create Supabase project + apply migration | — | Pending |
| S1-10 | Copy `.env.example` → `.env` and fill keys | — | Pending |
| S1-11 | Git init + initial commit | — | Pending |

### Backlog (Sprint 2 preview)

| ID | Task | Phase |
|----|------|-------|
| S2-01 | Supabase Auth client in Next.js | 2 |
| S2-02 | Profile creation webhook / API sync | 2 |
| S2-03 | `GET /buildings` bounds query (PostGIS) | 2 |
| S2-04 | Google Maps MarkerClusterer component | 2 |
| S2-05 | Building detail page with unit grid | 2 |
| S2-06 | Landlord dashboard shell | 2 |
| S2-07 | Admin `/admin` layout + RBAC guard | 2 |
| S2-08 | Supabase Storage image upload | 2 |

---

## Sprint 2 — Auth & Map (planned)

**Dates:** 2026-06-11 → 2026-06-24  
**Goal:** Real auth, real buildings on map, image upload.

*(Tasks to be expanded when Sprint 1 closes.)*

---

## Definition of Done

- [ ] Code merged to `main`
- [ ] `yarn build` passes for web + api
- [ ] No secrets committed
- [ ] ROADMAP checkbox updated
- [ ] Task moved to Done below

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

---

## Blockers

| ID | Blocker | Resolution |
|----|---------|------------|
| — | — | — |

---

## Commands

```bash
# Install
yarn install

# Dev (from repo root)
yarn dev:web    # http://localhost:3000
yarn dev:api    # http://localhost:4000/api/v1/health

# Local Postgres + PostGIS (optional; Supabase preferred)
yarn db:start

# Build shared types first (api/web depend on it)
yarn workspace @plotpin/shared-types build
```

---

*Update this file at the end of each work session.*
