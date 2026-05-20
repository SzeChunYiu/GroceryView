#!/usr/bin/env bash
set -euo pipefail

GROCERYVIEW_SERVER_URL="${GROCERYVIEW_SERVER_URL:-}"
GROCERYVIEW_WEB_URL="${GROCERYVIEW_WEB_URL:-}"
HTTP_SMOKE_TIMEOUT_SECONDS="${HTTP_SMOKE_TIMEOUT_SECONDS:-15}"

if [ -z "$GROCERYVIEW_SERVER_URL" ]; then
  echo "GROCERYVIEW_SERVER_URL is required for hosted HTTP smoke" >&2
  exit 2
fi

api_health_url="${GROCERYVIEW_SERVER_URL%/}/api/health"
api_health_response="$(
  curl -fsS \
    --max-time "$HTTP_SMOKE_TIMEOUT_SECONDS" \
    "$api_health_url"
)"

if ! printf '%s\n' "$api_health_response" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"'; then
  echo "hosted API health smoke failed: expected status=ok from $api_health_url" >&2
  printf '%s\n' "$api_health_response" >&2
  exit 1
fi

if ! printf '%s\n' "$api_health_response" | grep -Eq '"service"[[:space:]]*:[[:space:]]*"groceryview-server"'; then
  echo "hosted API health smoke failed: expected groceryview-server service from $api_health_url" >&2
  printf '%s\n' "$api_health_response" >&2
  exit 1
fi

echo "Hosted API health smoke passed: $api_health_url"

if [ -n "$GROCERYVIEW_WEB_URL" ]; then
  curl -fsS \
    --max-time "$HTTP_SMOKE_TIMEOUT_SECONDS" \
    -o /dev/null \
    "$GROCERYVIEW_WEB_URL"
  echo "Hosted web smoke passed: $GROCERYVIEW_WEB_URL"
fi
