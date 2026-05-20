#!/usr/bin/env bash
set -euo pipefail

GROCERYVIEW_SERVER_URL="${GROCERYVIEW_SERVER_URL:-}"
GROCERYVIEW_WEB_URL="${GROCERYVIEW_WEB_URL:-}"
GROCERYVIEW_TERMINAL_PRODUCT_ID="${GROCERYVIEW_TERMINAL_PRODUCT_ID:-coffee}"
HTTP_SMOKE_TIMEOUT_SECONDS="${HTTP_SMOKE_TIMEOUT_SECONDS:-15}"
HOSTED_HTTP_SMOKE_OUTPUT_PATH="${HOSTED_HTTP_SMOKE_OUTPUT_PATH:-}"

if [ -z "$GROCERYVIEW_SERVER_URL" ]; then
  echo "GROCERYVIEW_SERVER_URL is required for hosted HTTP smoke" >&2
  exit 2
fi

case "$HTTP_SMOKE_TIMEOUT_SECONDS" in
  ''|*[!0-9]*)
    echo "HTTP_SMOKE_TIMEOUT_SECONDS must be a positive integer" >&2
    exit 2
    ;;
esac

if [ "$HTTP_SMOKE_TIMEOUT_SECONDS" -lt 1 ]; then
  echo "HTTP_SMOKE_TIMEOUT_SECONDS must be a positive integer" >&2
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

api_terminal_url="${GROCERYVIEW_SERVER_URL%/}/api/products/${GROCERYVIEW_TERMINAL_PRODUCT_ID}/terminal"
api_terminal_response="$(
  curl -fsS \
    --max-time "$HTTP_SMOKE_TIMEOUT_SECONDS" \
    "$api_terminal_url"
)"

require_terminal_pattern() {
  local pattern="$1"
  local expectation="$2"

  if ! printf '%s\n' "$api_terminal_response" | grep -Eq "$pattern"; then
    echo "hosted product terminal smoke failed: expected $expectation from $api_terminal_url" >&2
    printf '%s\n' "$api_terminal_response" >&2
    exit 1
  fi
}

api_terminal_compact="$(printf '%s' "$api_terminal_response" | tr -d '[:space:]')"
if ! printf '%s\n' "$api_terminal_compact" | grep -Fq "\"productId\":\"$GROCERYVIEW_TERMINAL_PRODUCT_ID\""; then
  echo "hosted product terminal smoke failed: expected productId=$GROCERYVIEW_TERMINAL_PRODUCT_ID from $api_terminal_url" >&2
  printf '%s\n' "$api_terminal_response" >&2
  exit 1
fi

require_terminal_pattern '"productId"[[:space:]]*:' 'productId'
require_terminal_pattern '"ticker"[[:space:]]*:' 'ticker'
require_terminal_pattern '"quote"[[:space:]]*:' 'quote'
require_terminal_pattern '"distributions"[[:space:]]*:' 'distributions'
require_terminal_pattern '"chart"[[:space:]]*:' 'chart'

echo "Hosted product terminal smoke passed: $api_terminal_url"

if [ -n "$GROCERYVIEW_WEB_URL" ]; then
  curl -fsS \
    --max-time "$HTTP_SMOKE_TIMEOUT_SECONDS" \
    -o /dev/null \
    "$GROCERYVIEW_WEB_URL"
  echo "Hosted web smoke passed: $GROCERYVIEW_WEB_URL"
fi

if [ -n "$HOSTED_HTTP_SMOKE_OUTPUT_PATH" ]; then
  mkdir -p "$(dirname "$HOSTED_HTTP_SMOKE_OUTPUT_PATH")"
  HOSTED_HTTP_SMOKE_API_HEALTH_URL="$api_health_url"
  HOSTED_HTTP_SMOKE_PRODUCT_TERMINAL_URL="$api_terminal_url"
  export HOSTED_HTTP_SMOKE_API_HEALTH_URL
  export HOSTED_HTTP_SMOKE_PRODUCT_TERMINAL_URL
  export HOSTED_HTTP_SMOKE_OUTPUT_PATH

  node --input-type=module <<'NODE'
import { writeFile } from 'node:fs/promises';

const payload = {
  status: 'passed',
  apiHealthUrl: process.env.HOSTED_HTTP_SMOKE_API_HEALTH_URL,
  productTerminalUrl: process.env.HOSTED_HTTP_SMOKE_PRODUCT_TERMINAL_URL,
  productId: process.env.GROCERYVIEW_TERMINAL_PRODUCT_ID,
  webUrl: process.env.GROCERYVIEW_WEB_URL || null,
  checkedAt: new Date().toISOString()
};

await writeFile(process.env.HOSTED_HTTP_SMOKE_OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
NODE

  echo "Hosted HTTP smoke evidence written: $HOSTED_HTTP_SMOKE_OUTPUT_PATH"
fi
