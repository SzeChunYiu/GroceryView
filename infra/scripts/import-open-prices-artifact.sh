#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -z "${OPEN_PRICES_INPUT_PATH:-}" ]; then
  echo "Open Prices artifact import requires OPEN_PRICES_INPUT_PATH." >&2
  exit 2
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Open Prices artifact import requires DATABASE_URL." >&2
  exit 2
fi

cd "$ROOT_DIR"

node --input-type=module <<'NODE'
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import {
  createPgQueryExecutor,
  persistOpenPricesArtifact
} from './packages/db/dist/index.js';

const require = createRequire(import.meta.url);
const { Pool } = require('pg');

const inputPath = process.env.OPEN_PRICES_INPUT_PATH;
const databaseUrl = process.env.DATABASE_URL;

if (!inputPath) throw new Error('Open Prices artifact import requires OPEN_PRICES_INPUT_PATH.');
if (!databaseUrl) throw new Error('Open Prices artifact import requires DATABASE_URL.');

const artifact = JSON.parse(await readFile(inputPath, 'utf8'));
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
