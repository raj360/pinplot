# PlotPin

Map-first rental discovery for tenants and landlords. Browse buildings on a map, pay to unlock landlord contact and exact location.

**Launch market:** Uganda (UGX) · **Stack:** Next.js 16 + NestJS REST + Supabase + Google Maps

---

## Monorepo structure

```
plotpin/
├── apps/
│   ├── web/          Next.js 16.0.11 frontend
│   └── api/          NestJS REST API
├── packages/
│   └── shared-types/ Shared enums, permissions, DTO types
├── supabase/
│   └── migrations/   SQL migrations (PostGIS)
├── ROADMAP.md        Product phases
├── SPRINT_TASK.md    Active sprint tracking
└── docker-compose.yml  Local PostGIS (optional)
```

---

## Quick start

```bash
# 1. Install dependencies
yarn install

# 2. Build shared types (required before api/web dev)
yarn workspace @plotpin/shared-types build

# 3. Environment
cp .env.example .env
# Fill Supabase + Google Maps keys

# 4. Run dev servers
yarn dev:web    # http://localhost:3000
yarn dev:api    # http://localhost:4000/api/v1/health

# Or both via turbo
yarn dev
```

---

## Key URLs (local)

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/explore | Map/list explorer shell |
| http://localhost:4000/api/v1/health | API health check |

---

## Pricing (Uganda defaults)

| Action | Fee |
|--------|-----|
| Tenant unlock (contact + location) | 20,000 UGX |
| Landlord unit status update | 30,000 UGX |

Configurable per country in `countries` table.

---

## Docs

- [ROADMAP.md](./ROADMAP.md) — 10-week product plan
- [SPRINT_TASK.md](./SPRINT_TASK.md) — Current sprint tasks

---

## Design

- **Border radius:** 2px globally (see `apps/web/src/app/globals.css`)
- **UX reference:** [SchoolSpring job finder](https://mpsaz.schoolspring.com/) — map-first, list/map split, hide map for detail

---

*PlotPin — name subject to change.*
