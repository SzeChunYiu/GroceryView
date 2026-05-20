#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INGESTION_DIST="$ROOT_DIR/packages/ingestion/dist/index.js"
CONNECTOR_TIMEOUT_SECONDS="${GROCERYVIEW_CONNECTOR_TIMEOUT_SECONDS:-15}"

if [ -z "${GROCERYVIEW_CONNECTOR_URL:-}" ]; then
  echo "GROCERYVIEW_CONNECTOR_URL is required for retailer connector smoke" >&2
  exit 2
fi

if [ -z "${GROCERYVIEW_CONNECTOR_CHAIN_ID:-}" ]; then
  echo "GROCERYVIEW_CONNECTOR_CHAIN_ID is required for retailer connector smoke" >&2
  exit 2
fi

if [ ! -f "$INGESTION_DIST" ]; then
  echo "packages/ingestion/dist/index.js is missing; run: npm run build --workspace @groceryview/ingestion" >&2
  exit 2
fi

cd "$ROOT_DIR"
node --input-type=module <<'NODE'
const {
  fetchRetailerConnectorSnapshot,
  planRetailerConnectorRun
} = await import('./packages/ingestion/dist/index.js');

const required = (name) => {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`${name} is required.`);
  return value.trim();
};

const boolEnv = (name) => String(process.env[name] ?? 'false').toLowerCase() === 'true';
const timeoutMs = Number(process.env.GROCERYVIEW_CONNECTOR_TIMEOUT_SECONDS ?? '15') * 1000;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

try {
  const plan = planRetailerConnectorRun({
    connectorId: process.env.GROCERYVIEW_CONNECTOR_ID || 'retailer-connector-smoke',
    requestedAt: process.env.GROCERYVIEW_CONNECTOR_REQUESTED_AT || new Date().toISOString(),
    chainId: required('GROCERYVIEW_CONNECTOR_CHAIN_ID'),
    sourceType: process.env.GROCERYVIEW_CONNECTOR_SOURCE_TYPE || 'official_api',
    robotsTxtStatus: process.env.GROCERYVIEW_CONNECTOR_ROBOTS_TXT_STATUS || 'unknown',
    legalReviewStatus: process.env.GROCERYVIEW_CONNECTOR_LEGAL_REVIEW_STATUS || 'pending',
    hasDataAgreement: boolEnv('GROCERYVIEW_CONNECTOR_HAS_DATA_AGREEMENT'),
    endpointUrl: required('GROCERYVIEW_CONNECTOR_URL'),
    parserVersion: process.env.GROCERYVIEW_CONNECTOR_PARSER_VERSION || 'connector-smoke-v1'
  });

  if (plan.status !== 'ready') {
    console.error(JSON.stringify({
      status: plan.status,
      runKey: plan.runKey,
      requiredActions: plan.requiredActions,
      message: 'Connector smoke blocked before fetch. Approve legal/robots/data-agreement gates first.'
    }, null, 2));
    process.exit(2);
  }

  const snapshot = await fetchRetailerConnectorSnapshot(plan, {
    headers: {
      accept: process.env.GROCERYVIEW_CONNECTOR_ACCEPT || 'application/json,text/html;q=0.9,*/*;q=0.8'
    },
    rawSnapshotRefPrefix: process.env.GROCERYVIEW_CONNECTOR_RAW_REF_PREFIX || 'raw://retailer-connector-smoke',
    fetchImpl: async (url, init) => fetch(url, { ...init, signal: controller.signal })
  });

  if (snapshot.statusCode < 200 || snapshot.statusCode >= 300) {
    console.error(JSON.stringify({
      status: 'failed',
      statusCode: snapshot.statusCode,
      sourceUrl: snapshot.sourceUrl,
      contentType: snapshot.contentType,
      contentHash: snapshot.contentHash,
      requiredActions: ['investigate_connector_http_status']
    }, null, 2));
    process.exit(1);
  }

  if (snapshot.body.length === 0) {
    console.error(JSON.stringify({
      status: 'failed',
      statusCode: snapshot.statusCode,
      sourceUrl: snapshot.sourceUrl,
      requiredActions: ['investigate_empty_connector_response']
    }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'passed',
    runKey: plan.runKey,
    sourceRunId: plan.sourceRunId,
    sourceUrl: snapshot.sourceUrl,
    statusCode: snapshot.statusCode,
    contentType: snapshot.contentType,
    bytes: snapshot.body.length,
    retrievedAt: snapshot.retrievedAt,
    contentHash: snapshot.contentHash,
    rawSnapshotRef: snapshot.rawSnapshotRef
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    status: 'failed',
    requiredActions: ['investigate_connector_smoke_failure'],
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
NODE
