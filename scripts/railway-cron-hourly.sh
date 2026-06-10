#!/usr/bin/env sh
# Railway Cron service — runs once, exits 0/1. Do NOT run on the main API replicas.
set -eu

API_URL="${PLOTPIN_API_URL:-${API_URL:-}}"
SECRET="${CRON_SECRET:-}"

if [ -z "$API_URL" ] || [ -z "$SECRET" ]; then
  echo "Missing PLOTPIN_API_URL (or API_URL) and/or CRON_SECRET" >&2
  exit 1
fi

curl -fsS -X POST "${API_URL%/}/api/v1/cron/hourly" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json"

echo ""
echo "Hourly cron completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
