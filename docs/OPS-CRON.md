# PlotPin — Production cron (Railway)

**Policy:** No in-app schedulers (`@nestjs/schedule`) on the Nest API. Use **external cron only** so multiple API replicas never multiply job runs.

**Hourly job (production):** Railway Cron service → `POST /api/v1/cron/hourly`  
**Daily FX refresh:** GitHub Actions `refresh-fx-rates.yml` (repo script + `DIRECT_URL`)

See also [NOTIFICATIONS.md](./NOTIFICATIONS.md) for what the hourly job sends.

---

## What the hourly job does

| Step | Action |
|------|--------|
| 1 | Unlock expiring (landlord ~12h, tenant ~24h) — in-app + email |
| 2 | Unlock expired (last hour) — in-app + email |
| 3 | Unit lock ended (long-term, before release) — in-app + email |
| 4 | Featured expiring (7d window) — in-app + email |
| 5 | Stale AVAILABLE reminders (30d+, deduped per unit) — in-app + email |
| 6 | Release expired `LOCKED` units → `AVAILABLE` |

Endpoint: `POST /api/v1/cron/hourly`  
Auth: `Authorization: Bearer <CRON_SECRET>` (same secret on API + cron service)

Other endpoints (optional, manual):

- `POST /api/v1/cron/notifications` — emails only  
- `POST /api/v1/cron/release-expired-locks` — lock release only  

---

## Pre-deploy checklist

1. Apply migrations through **033** (`yarn db:migrate` with `DIRECT_URL`) — includes `user_notifications` for in-app inbox.
2. Set **`CRON_SECRET`** on the **Nest API** Railway service (long random string).
3. Configure Postmark env vars on the API (emails are no-ops without them).
4. After API is live, add the **cron service** below (do not enable until API URL works).

---

## Railway setup (recommended)

Use a **separate lightweight service** in the same Railway project — not the main API. Railway cron services must **start, run, and exit**; the always-on Nest app stays on your API service with `N` replicas.

### Architecture

```
┌─────────────────────────────┐     hourly POST       ┌──────────────────────────┐
│  plotpin-cron (1 schedule)  │ ──────────────────►   │  plotpin-api (N replicas)│
│  Cron Schedule: 15 * * * *  │   Bearer CRON_SECRET  │  POST /api/v1/cron/hourly│
│  exits after curl           │                       │  (no in-app scheduler)   │
└─────────────────────────────┘                       └──────────────────────────┘
```

One schedule → one HTTP request → load balancer picks **one** replica. No duplicate runs from scaling API to 5 instances.

### Option A — Shell script in this repo (simplest)

1. **New service** in Railway project: e.g. `plotpin-cron-hourly`.
2. **Source:** same GitHub repo as the API.
3. **Start command:**
   ```bash
   sh scripts/railway-cron-hourly.sh
   ```
4. **Cron Schedule** (Settings → Cron Schedule, **UTC**):
   ```
   15 * * * *
   ```
   (Every hour at :15 — avoids stacking on the hour with other jobs.)
5. **Variables** on the cron service:

   | Variable | Example | Notes |
   |----------|---------|--------|
   | `PLOTPIN_API_URL` | `https://api.plotpin.net` | Public API base, no trailing slash |
   | `CRON_SECRET` | *(same as API)* | Must match API service exactly |

6. **Do not** assign a public domain to the cron service (no inbound traffic needed).
7. **Replicas:** 1 (default). Only the cron schedule starts runs.

**Railway constraints (from [Railway cron docs](https://docs.railway.com/cron-jobs)):**

- Schedules are **UTC**.
- Minimum interval **5 minutes** (hourly is fine).
- If a run **has not exited** when the next slot fires, the next run is **skipped** — our script exits in seconds, so this is fine.

### Option B — Railway template “Cron Trigger External Webhook URL”

Use if you prefer a Bun micro-service instead of `curl`:

1. Deploy [Cron Trigger External Webhook URL](https://railway.com/deploy/cron-trigger-external-webhook-url) in the project.
2. Set `CRON_ENDPOINT_URL` = `https://<api>/api/v1/cron/hourly`
3. Set `CRON_SECRET` = same as API.
4. Configure Cron Schedule in Settings (e.g. `15 * * * *`).

---

## Nest API service (Railway)

| Variable | Required | Purpose |
|----------|----------|---------|
| `CRON_SECRET` | Yes (prod) | Validates `POST /api/v1/cron/*` |
| `DATABASE_URL` | Yes | Supabase pooler |
| `POSTMARK_*` | Yes (prod emails) | Notification sends |
| `CORS_ORIGIN` / `WEB_APP_URL` | Yes | Email links |

**Do not** enable `@nestjs/schedule` on this service.

**Replicas:** Scale freely; cron is external.

---

## Verify after deploy

```bash
# Replace URL and secret
export PLOTPIN_API_URL=https://your-api.up.railway.app
export CRON_SECRET=your-secret

curl -fsS -X POST "$PLOTPIN_API_URL/api/v1/cron/hourly" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Expected JSON shape:

```json
{
  "counts": {
    "unlockExpiring": 0,
    "unlockExpired": 0,
    "unitLockEnded": 0,
    "featuredExpiring": 0,
    "staleAvailable": 0
  },
  "released": 0
}
```

Check Railway logs for the cron service after the first scheduled run.

---

## GitHub Actions (manual / staging only)

`.github/workflows/plotpin-cron.yml` is **`workflow_dispatch` only** — not scheduled — to avoid GitHub Actions minutes and double-firing alongside Railway.

Use **Actions → PlotPin cron jobs → Run workflow** for one-off tests before Railway cron is wired.

**Daily FX:** `.github/workflows/refresh-fx-rates.yml` remains on a **daily** schedule (~30–90 min/month).

---

## Local dev

Cron is optional locally. To test:

```bash
# API running with CRON_SECRET in .env
curl -X POST http://localhost:4000/api/v1/cron/hourly \
  -H "Authorization: Bearer $CRON_SECRET"
```

Unlock checkout still clears an **expired lock on one unit** if cron has not run yet (safety net only).

---

## Analytics (5H) — confirmed working

Listing events (`IMPRESSION`, `DETAIL_VIEW`, `UNLOCK_CLICK`) are written via `POST /api/v1/analytics/events`. Landlord metrics appear on the manage building **Featured boost** panel (30d). No cron required for analytics.

**Optional later:** H-27 daily rollup table for faster admin queries at scale.

---

*Last updated: 2026-06-10*
