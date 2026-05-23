#!/usr/bin/env bash
set -euo pipefail

GROCERYVIEW_SERVER_URL="${GROCERYVIEW_SERVER_URL:-}"
METRICS_TOKEN="${METRICS_TOKEN:-}"
READINESS_TIMEOUT_SECONDS="${READINESS_TIMEOUT_SECONDS:-15}"
HOSTED_READINESS_SMOKE_OUTPUT_PATH="${HOSTED_READINESS_SMOKE_OUTPUT_PATH:-}"

if [ -z "$GROCERYVIEW_SERVER_URL" ]; then
  echo "GROCERYVIEW_SERVER_URL is required for hosted readiness smoke" >&2
  exit 2
fi

if [ -z "$METRICS_TOKEN" ]; then
  echo "METRICS_TOKEN is required for hosted readiness smoke" >&2
  exit 2
fi

case "$READINESS_TIMEOUT_SECONDS" in
  ''|*[!0-9]*)
    echo "READINESS_TIMEOUT_SECONDS must be a positive integer" >&2
    exit 2
    ;;
esac

if [ "$READINESS_TIMEOUT_SECONDS" -lt 1 ]; then
  echo "READINESS_TIMEOUT_SECONDS must be a positive integer" >&2
  exit 2
fi

check_readiness_endpoint() {
  local label="$1"
  local endpoint="$2"
  local response
  response="$(
    curl -fsS \
      --max-time "$READINESS_TIMEOUT_SECONDS" \
      -H "x-groceryview-metrics-token: $METRICS_TOKEN" \
      "$endpoint"
  )"

  if ! printf '%s\n' "$response" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"(ready|complete)"'; then
    echo "hosted $label readiness smoke failed: expected ready/complete status from $endpoint" >&2
    printf '%s\n' "$response" >&2
    exit 1
  fi

  echo "Hosted $label readiness smoke passed: $endpoint"
}

postgres_endpoint="${GROCERYVIEW_SERVER_URL%/}/api/readiness/postgres"
scan_endpoint="${GROCERYVIEW_SERVER_URL%/}/api/readiness/scanning"
scan_upload_cors_endpoint="${GROCERYVIEW_SERVER_URL%/}/api/readiness/scan-upload-cors"
scan_upload_storage_endpoint="${GROCERYVIEW_SERVER_URL%/}/api/readiness/scan-upload-storage"
scan_upload_write_endpoint="${GROCERYVIEW_SERVER_URL%/}/api/readiness/scan-upload-write"

check_readiness_endpoint "PostgreSQL" "$postgres_endpoint"
check_readiness_endpoint "scan provider" "$scan_endpoint"
check_readiness_endpoint "scan upload CORS" "$scan_upload_cors_endpoint"
check_readiness_endpoint "scan upload storage" "$scan_upload_storage_endpoint"
check_readiness_endpoint "scan upload write" "$scan_upload_write_endpoint"

if [ -n "$HOSTED_READINESS_SMOKE_OUTPUT_PATH" ]; then
  mkdir -p "$(dirname "$HOSTED_READINESS_SMOKE_OUTPUT_PATH")"
  HOSTED_POSTGRES_READINESS_SMOKE_ENDPOINT="$postgres_endpoint"
  HOSTED_SCAN_READINESS_SMOKE_ENDPOINT="$scan_endpoint"
  HOSTED_SCAN_UPLOAD_CORS_READINESS_SMOKE_ENDPOINT="$scan_upload_cors_endpoint"
  HOSTED_SCAN_UPLOAD_STORAGE_READINESS_SMOKE_ENDPOINT="$scan_upload_storage_endpoint"
  HOSTED_SCAN_UPLOAD_WRITE_READINESS_SMOKE_ENDPOINT="$scan_upload_write_endpoint"
  export HOSTED_POSTGRES_READINESS_SMOKE_ENDPOINT
  export HOSTED_SCAN_READINESS_SMOKE_ENDPOINT
  export HOSTED_SCAN_UPLOAD_CORS_READINESS_SMOKE_ENDPOINT
  export HOSTED_SCAN_UPLOAD_STORAGE_READINESS_SMOKE_ENDPOINT
  export HOSTED_SCAN_UPLOAD_WRITE_READINESS_SMOKE_ENDPOINT
  export HOSTED_READINESS_SMOKE_OUTPUT_PATH

  node --input-type=module <<'NODE'
import { writeFile } from 'node:fs/promises';

const payload = {
  status: 'ready',
  endpoints: {
    postgres: process.env.HOSTED_POSTGRES_READINESS_SMOKE_ENDPOINT,
    scanning: process.env.HOSTED_SCAN_READINESS_SMOKE_ENDPOINT,
    scanUploadCors: process.env.HOSTED_SCAN_UPLOAD_CORS_READINESS_SMOKE_ENDPOINT,
    scanUploadStorage: process.env.HOSTED_SCAN_UPLOAD_STORAGE_READINESS_SMOKE_ENDPOINT,
    scanUploadWrite: process.env.HOSTED_SCAN_UPLOAD_WRITE_READINESS_SMOKE_ENDPOINT
  },
  checkedAt: new Date().toISOString()
};

await writeFile(process.env.HOSTED_READINESS_SMOKE_OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
NODE

  echo "Hosted readiness smoke evidence written: $HOSTED_READINESS_SMOKE_OUTPUT_PATH"
fi
