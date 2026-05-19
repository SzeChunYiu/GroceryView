import assert from 'node:assert/strict';

import {
  ApiContractSchemas,
  PRICE_TYPES,
  PriceObservationSchema,
} from '../dist/index.js';

const observedAt = '2026-05-16T09:30:00.000Z';
const price = PriceObservationSchema.parse({
  id: 'demo-price-zoegas-willys',
  productSlug: 'zoegas-skane-mellanrost-450g',
  storeSlug: 'willys-odenplan',
  priceAmount: 49.9,
  currency: 'SEK',
  unit: 'package',
  unitPriceAmount: 110.89,
  unitPriceUnit: 'kg',
  priceType: 'promotion',
  observedAt,
  sourceType: 'retailer_page',
  confidence: 0.89,
  confidenceLabel: 'high',
  provenance: {
    sourceType: 'retailer_page',
    sourceName: 'Willys demo retailer page',
    sourceRunId: 'demo-run-2026-05-16',
    sourceUrl: 'https://example.com/demo/willys/zoegas',
    rawRecordId: 'demo-raw-zoegas-willys',
    rawSnapshotRef: 's3://groceryview-raw/demo/zoegas.json',
    fetchedAt: observedAt,
    observedAt,
    parserVersion: 'demo-v1',
  },
  memberOnly: false,
  promotionLabel: 'Demo campaign',
  validFrom: null,
  validTo: null,
  demo: true,
});

assert.equal(price.priceType, 'promotion');
assert.equal(price.confidence, 0.89);
assert.equal(price.observedAt, observedAt);
assert.equal(price.sourceType, 'retailer_page');
assert.equal(price.provenance.sourceType, 'retailer_page');
assert.equal(price.provenance.observedAt, observedAt);
assert.equal(price.provenance.parserVersion, 'demo-v1');

for (const requiredPriceType of [
  'online',
  'flyer',
  'member',
  'in_store',
  'receipt',
  'shelf_photo',
  'manual',
  'estimated',
]) {
  assert.ok(
    PRICE_TYPES.includes(requiredPriceType),
    `${requiredPriceType} price type exported`,
  );
}

for (const schemaName of [
  'ProductSummary',
  'ProductDetail',
  'StoreSummary',
  'StoreDetail',
  'PriceObservation',
  'LatestStorePrice',
  'WatchlistItem',
  'WeeklyBasket',
  'Alert',
]) {
  assert.ok(ApiContractSchemas[schemaName], `${schemaName} schema exported`);
}
