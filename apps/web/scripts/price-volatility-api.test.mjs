import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('price volatility prediction endpoint', () => {
  it('ships a route backed by the price intelligence job and generated data preview', async () => {
    const [route, intelligence, verified] = await Promise.all([
      read('src/app/api/pricing/volatility/route.ts'),
      read('src/lib/price-intelligence.ts'),
      read('src/lib/verified-data.ts')
    ]);

    assert.match(route, /api\/pricing\/volatility|runVolatilityPredictionJob/);
    assert.match(route, /NextResponse\.json/);
    assert.match(route, /Cache-Control/);
    assert.match(route, /ETag/);
    assert.match(route, /if-none-match/);
    assert.match(route, /status: 304/);
    assert.match(route, /minObservations/);
    assert.match(route, /category/);
    assert.match(intelligence, /ProductStoreVolatilityPrediction/);
    assert.match(intelligence, /shortTermVolatilityScore/);
    assert.match(intelligence, /pairKey/);
    assert.match(intelligence, /OpenPrices generated historical timestamps/);
    assert.match(intelligence, /does not forecast a future price/);
    assert.match(intelligence, /priceSwingPercent/);
    assert.match(intelligence, /describeVolatilityInputWindow/);
    assert.match(intelligence, /earliestObservedAt/);
    assert.match(intelligence, /sourceObservationCount/);
    assert.match(verified, /priceVolatilityPredictionPreview/);
    assert.match(verified, /\/api\/pricing\/volatility/);
  });
});
