#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -z "${OPEN_PRICES_INPUT_PATH:-}" ]; then
  echo "Open Prices artifact import requires OPEN_PRICES_INPUT_PATH." >&2
  exit 2
fi

if [ ! -f "$OPEN_PRICES_INPUT_PATH" ] || [ ! -r "$OPEN_PRICES_INPUT_PATH" ]; then
  echo "Open Prices artifact import requires OPEN_PRICES_INPUT_PATH to point to a readable artifact file." >&2
  exit 2
fi

OPEN_PRICES_IMPORT_DRY_RUN="${OPEN_PRICES_IMPORT_DRY_RUN:-false}"

if [ "$OPEN_PRICES_IMPORT_DRY_RUN" != "true" ] && [ -z "${DATABASE_URL:-}" ]; then
  echo "Open Prices artifact import requires DATABASE_URL." >&2
  exit 2
fi

cd "$ROOT_DIR"

node --input-type=module <<'NODE'
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const inputPath = process.env.OPEN_PRICES_INPUT_PATH;
const databaseUrl = process.env.DATABASE_URL;
const dryRun = process.env.OPEN_PRICES_IMPORT_DRY_RUN === 'true';

if (!inputPath) throw new Error('Open Prices artifact import requires OPEN_PRICES_INPUT_PATH.');
if (!dryRun && !databaseUrl) throw new Error('Open Prices artifact import requires DATABASE_URL.');

const artifact = JSON.parse(await readFile(inputPath, 'utf8'));
const acceptedObservations = Array.isArray(artifact.acceptedObservations) ? artifact.acceptedObservations : [];

if (dryRun) {
  console.log(JSON.stringify({
    status: 'dry_run',
    inputPath,
    acceptedCount: Number(artifact.acceptedCount ?? acceptedObservations.length),
    acceptedObservationCount: acceptedObservations.length,
    hasSourceUrl: typeof artifact.sourceUrl === 'string' && artifact.sourceUrl.length > 0,
    hasContentHash: typeof artifact.contentHash === 'string' && artifact.contentHash.length > 0,
    hasRawSnapshotRef: typeof artifact.rawSnapshotRef === 'string' && artifact.rawSnapshotRef.length > 0
  }, null, 2));
  process.exit(0);
}

const {
  createPgQueryExecutor,
  persistOpenPricesArtifact
} = await import('./packages/db/dist/index.js');
const require = createRequire(import.meta.url);
const { Pool } = require('pg');
const pool = new Pool({ connectionString: databaseUrl });

try {
  const result = await persistOpenPricesArtifact(createPgQueryExecutor(pool), artifact);
  console.log(JSON.stringify({
    status: 'persisted',
    inputPath,
    sourceRunId: result.sourceRunId,
    acceptedCount: result.acceptedCount,
    rawRecordCount: result.rawRecordIds.length,
    observationCount: result.observationIds.length,
    productCount: result.productIds.length,
    chainCount: result.chainIds.length
  }, null, 2));
} finally {
  await pool.end();
}
NODE
