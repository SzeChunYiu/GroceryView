#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INGESTION_DIST="$ROOT_DIR/packages/ingestion/dist/index.js"
OPEN_PRICES_TIMEOUT_SECONDS="${OPEN_PRICES_TIMEOUT_SECONDS:-15}"

case "$OPEN_PRICES_TIMEOUT_SECONDS" in
  ''|*[!0-9]*)
    echo "OPEN_PRICES_TIMEOUT_SECONDS must be a positive integer" >&2
    exit 2
    ;;
esac

if [ "$OPEN_PRICES_TIMEOUT_SECONDS" -lt 1 ]; then
  echo "OPEN_PRICES_TIMEOUT_SECONDS must be a positive integer" >&2
  exit 2
fi

if [ -z "${OPEN_PRICES_USER_AGENT:-}" ]; then
  echo "Open Prices smoke requires OPEN_PRICES_USER_AGENT in the form requested by Open Food Facts docs." >&2
  exit 2
fi

if [ ! -f "$INGESTION_DIST" ]; then
  echo "packages/ingestion/dist/index.js is missing; run: npm run build --workspace @groceryview/ingestion" >&2
  exit 2
fi

cd "$ROOT_DIR"
node --input-type=module <<'NODE'
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const {
  buildOpenPricesConnectorUrl,
  fetchRetailerConnectorSnapshot,
  parseOpenPricesSnapshot,
  runRetailerConnector
} = await import('./packages/ingestion/dist/index.js');

const timeoutSeconds = Number(process.env.OPEN_PRICES_TIMEOUT_SECONDS ?? '15');
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

try {
  const endpointUrl = process.env.OPEN_PRICES_URL || buildOpenPricesConnectorUrl({
    currency: 'SEK',
    countryCode: process.env.OPEN_PRICES_COUNTRY_CODE || 'SE',
    size: Number(process.env.OPEN_PRICES_SIZE ?? '10')
  });

  const result = await runRetailerConnector({
    connectorId: 'open-prices-public-api',
    requestedAt: process.env.OPEN_PRICES_REQUESTED_AT || new Date().toISOString(),
    chainId: 'open_prices',
    sourceType: 'official_api',
    robotsTxtStatus: 'not_applicable',
    legalReviewStatus: 'approved',
    hasDataAgreement: true,
    endpointUrl,
    parserVersion: 'open-prices-v1',
    fetcher: (plan) => fetchRetailerConnectorSnapshot(plan, {
      headers: {
        accept: 'application/json',
        'user-agent': process.env.OPEN_PRICES_USER_AGENT
      },
      rawSnapshotRefPrefix: process.env.OPEN_PRICES_RAW_REF_PREFIX || 'raw://open-prices-smoke',
      fetchImpl: async (url, init) => fetch(url, { ...init, signal: controller.signal })
    }),
    parser: parseOpenPricesSnapshot
  });

  if (result.status !== 'completed' || result.acceptedCount < 1 || !result.snapshot) {
    console.error(JSON.stringify({
      status: result.status,
      acceptedCount: result.acceptedCount,
      rejectedCount: result.rejectedCount,
      requiredActions: result.requiredActions,
      error: result.error || 'Open Prices smoke did not produce any accepted price rows.'
    }, null, 2));
    process.exit(1);
  }

  const first = result.ingestion.accepted[0];
  const summary = {
    status: 'passed',
    message: 'Hosted Open Prices real-data smoke passed',
    sourceUrl: result.snapshot.sourceUrl,
    statusCode: result.snapshot.statusCode,
    contentType: result.snapshot.contentType,
    bytes: result.snapshot.body.length,
    retrievedAt: result.snapshot.retrievedAt,
    contentHash: result.snapshot.contentHash,
    rawSnapshotRef: result.snapshot.rawSnapshotRef,
    acceptedCount: result.acceptedCount,
    rejectedCount: result.rejectedCount,
    firstProduct: {
      productId: first.product.id,
      canonicalName: first.product.canonicalName,
      chainId: first.priceObservation.chainId,
      price: first.priceObservation.price,
      currency: first.priceObservation.currency,
      observedAt: first.priceObservation.observedAt
    },
    attribution: 'Open Prices by Open Food Facts; respect ODbL/share-alike, custom User-Agent, and rate limits.'
  };

  const outputPath = process.env.OPEN_PRICES_OUTPUT_PATH;
  if (outputPath) {
    const artifact = {
      ...summary,
      generatedAt: new Date().toISOString(),
      acceptedObservations: result.ingestion.accepted.map((row) => ({
        product: row.product,
        alias: row.alias,
        priceObservation: row.priceObservation,
        promotionObservation: row.promotionObservation
      }))
    };
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
    console.error(`Open Prices normalized artifact written: ${outputPath}`);
  }

  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    status: 'failed',
    requiredActions: ['investigate_open_prices_smoke_failure'],
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
NODE
