import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildDbSiteSnapshotArtifact,
  renderDbSiteTrendingPriceChangesModule
} from '../../../scripts/ingestion/export-db-site-snapshot.mjs';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

const latestPriceRow = {
  productSlug: 'filmjolk-1l',
  canonicalName: 'Filmjolk 1 l',
  categoryPath: ['Dairy'],
  packageSize: 1,
  packageUnit: 'l',
  comparableUnit: 'l',
  chainSlug: 'ica',
  chainName: 'ICA',
  priceType: 'regular',
  price: 18.9,
  unitPrice: 18.9,
  currency: 'SEK',
  observedAt: '2026-05-24T10:00:00.000Z',
  isAvailable: true,
  confidence: 0.98,
  observationId: 'obs-1',
  provenance: { sourceUrl: 'https://example.test/ica' }
};

const trendingPriceChange = {
  rank: 1,
  productId: 'prod-1',
  productSlug: 'filmjolk-1l',
  productName: 'Filmjolk 1 l',
  brand: 'ICA',
  categoryLabel: 'Dairy',
  changeCount: 2,
  observationCount: 4,
  latestPrice: 18.9,
  previousPrice: 20.9,
  changeAmount: -2,
  changePercent: -9.57,
  currency: 'SEK',
  latestObservedAt: '2026-05-24T10:00:00.000Z',
  chainSlug: 'ica',
  chainName: 'ICA'
};

test('DB site snapshot exports persisted trending price changes for generated homepage data', async () => {
  const artifact = buildDbSiteSnapshotArtifact({
    generatedAt: '2026-05-25T08:00:00.000Z',
    rows: [latestPriceRow],
    trendingPriceChanges: [trendingPriceChange],
    requiredChains: ['ica']
  });

  assert.deepEqual(artifact.trendingPriceChanges, [trendingPriceChange]);

  const moduleSource = renderDbSiteTrendingPriceChangesModule({
    generatedAt: artifact.generatedAt,
    trendingPriceChanges: artifact.trendingPriceChanges
  });

  assert.match(moduleSource, /postgres\.trending_price_changes/);
  assert.match(moduleSource, /TrendingProductPriceChange/);
  assert.match(moduleSource, /dbSiteHomepageTrendingPriceChanges/);
  assert.match(moduleSource, /filmjolk-1l/);
});

test('homepage trending data prefers generated DB rows before OpenPrices fallback', async () => {
  const exportScript = await read('../../scripts/ingestion/export-db-site-snapshot.mjs');
  const generatedModule = await read('src/lib/generated/db-site-trending-price-changes.ts');
  const verifiedData = await read('src/lib/verified-data.ts');

  assert.match(exportScript, /createPostgresTrendingPriceChangeReader/);
  assert.match(exportScript, /GROCERYVIEW_DB_SITE_SNAPSHOT_TRENDING_MODULE_PATH/);
  assert.match(exportScript, /listTrendingPriceChanges\(\{ since: isoDaysBefore\(generatedAt, 7\), until: generatedAt, limit: 10 \}\)/);
  assert.match(generatedModule, /dbSiteHomepageTrendingPriceChanges: TrendingProductPriceChange\[] = \[]/);
  assert.match(verifiedData, /dbSiteHomepageTrendingPriceChanges/);
  assert.match(verifiedData, /dbSiteHomepageTrendingPriceChanges\.length > 0/);
  assert.match(verifiedData, /openPricesHomepageTrendingPriceChanges/);
});

