#!/usr/bin/env bash
set -euo pipefail

GROCERYVIEW_SERVER_URL="${GROCERYVIEW_SERVER_URL:-}"
METRICS_TOKEN="${METRICS_TOKEN:-}"
READINESS_TIMEOUT_SECONDS="${READINESS_TIMEOUT_SECONDS:-15}"

if [ -z "$GROCERYVIEW_SERVER_URL" ]; then
  echo "GROCERYVIEW_SERVER_URL is required for hosted readiness smoke" >&2
  exit 2
fi

if [ -z "$METRICS_TOKEN" ]; then
  echo "METRICS_TOKEN is required for hosted readiness smoke" >&2
  exit 2
fi

endpoint="${GROCERYVIEW_SERVER_URL%/}/api/readiness/postgres"
response="$(
  curl -fsS \
    --max-time "$READINESS_TIMEOUT_SECONDS" \
    -H "x-groceryview-metrics-token: $METRICS_TOKEN" \
    "$endpoint"
)"

if ! printf '%s\n' "$response" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ready"'; then
  echo "hosted PostgreSQL readiness smoke failed: expected status=ready from $endpoint" >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

echo "Hosted PostgreSQL readiness smoke passed: $endpoint"
