# PlotPin — Pending work & PR merge handoff

**Purpose:** Single checklist for merging the current PR and resuming development later.  
**Last updated:** 2026-06-13

---

## In this PR (ready to merge)

Admin trust & listing quality fixes on top of Sprint **5I** (unlock hub).

| ID | Deliverable | Notes |
|----|-------------|-------|
| **T-07+** | Duplicate pin review — **exact pin** 50m query + map | Was using jittered `location` (~150–280m); now `exact_lat/lng` |
| **T-07+** | `AdminNearbyPinsReview` — map, list, decision guide, reject preset | `GET /admin/buildings/:id/nearby-pins` |
| **T-07+** | Live nearby refresh when admin moves pin (debounced) | Save pin before approve |
| **PHOTO-01** | Cover sync on approve; block approve with zero photos | `assertBuildingHasCoverImage` |
| **PHOTO-01** | Auto-promote first upload when no primary / after wipe | `BuildingPhotoManager` + `insertBuildingImage` |
| **Docs** | U-06 cron plan, PWA checklist, OG+UTM plan | See links below |

**No new migration** in this PR — code-only fixes.

---

## Before merge (verify locally)

- [ ] `yarn db:migrate` through **034** (if not already applied)
- [ ] Admin: remove all photos → upload new → **Upload pending** → first photo is cover → **Approve** → explore/card shows cover
- [ ] Admin: place pending pin within **50m of verified neighbor’s exact pin** → nearby panel flags duplicate risk
- [ ] Approve without photos → API returns clear error (not silent go-live)
- [ ] API env: Supabase host resolves (`DATABASE_URL` / DNS) — see dev notes in conversation

---

## After merge — ops (production)

- [ ] Apply migrations **029–034** on prod Supabase if not done
- [ ] Railway **hourly cron** for scheduled notifications — [OPS-CRON.md](./OPS-CRON.md)
- [ ] Daily **FX refresh** (`yarn fx:refresh` or GitHub Action)
- [ ] PSP webhooks + `ALLOW_DEV_UNLOCK=0` in prod

---

## Resume next (product — priority order)

| Priority | ID | Task | Plan doc |
|----------|-----|------|----------|
| **P1** | **U-06** | Post-unlock feedback cron (24h + intent events) | [PLAN-U-06-FEEDBACK-CRON.md](./PLAN-U-06-FEEDBACK-CRON.md) |
| **P1** | **5C** | Uganda MoMo UX polish; USSD TBD; SMS on unlock (N-08) paused | [SPRINT_TASK.md](../SPRINT_TASK.md) §5C |
| **P2** | **U-07** / **N-09f** | Dedicated `/notifications` page | [NOTIFICATIONS.md](./NOTIFICATIONS.md) |
| **P2** | **S6-OG** | Open Graph + Twitter cards (building detail first) | [GROWTH-OG-UTM.md](./GROWTH-OG-UTM.md) |
| **P2** | **S6-UTM** | Paid social UTM capture → checkout metadata | [GROWTH-OG-UTM.md](./GROWTH-OG-UTM.md) |
| **P2** | **S6-PWA** | Manifest + `/sw.js` (fixes dev `GET /sw.js 404` when shipped) | [PWA-CHECKLIST.md](./PWA-CHECKLIST.md) |
| **P3** | **M-01** | Multi-unlock open-contact mode (landlord opt-in) | [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) §8.1 |
| **P3** | **T-14** | Optional verify badge | Phase 6 |
| **P3** | **P-LLC** | US LLC + Stripe | [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md) §8 |

---

## Deferred (super-admin / when pain appears)

| Item | Workaround today | Build when |
|------|------------------|------------|
| **Repair cover on live listing** | Unverify → fix photos on admin pending UI → approve again; or landlord `/landlord/buildings/:id` | Bulk bad listings or un-verify too risky → `SUPERADMIN` “sync cover from gallery” |
| **Stripe / LLC** | Lemon Squeezy + Flutterwave | Traction triggers in payments strategy |

---

## Admin ops runbook (quick reference)

### Broken cover after approve (legacy listings)

1. Admin: set **verified = false**, save, fix photos (upload + cover), approve again **or**
2. Landlord: manage building → upload photos → set cover (no un-verify)

### Duplicate pin review

- Uses **exact landlord pin**, not explore map jitter
- **Reject:** verified listing, different landlord, within 50m → preset “Duplicate or conflicting listing…”
- **Approve anyway:** check acknowledgment + checklist item “duplicate pin reviewed”

---

## Doc index

| Doc | Purpose |
|-----|---------|
| [SPRINT_TASK.md](../SPRINT_TASK.md) | Task IDs & sprint status |
| [ROADMAP.md](../ROADMAP.md) | Phases & persona snapshot |
| [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) | Build order |
| [TRUST-ANTI-SCAM.md](./TRUST-ANTI-SCAM.md) | Trust controls + admin checklist |

---

*When resuming: start with **U-06** (small, data already collected) or **5C** if Uganda beta is the gate.*
