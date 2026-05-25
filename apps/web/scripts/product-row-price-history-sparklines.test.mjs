import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('product row price history sparklines', () => {
  it('renders unit-price history by chain and store where observations exist', async () => {
    const [cards, terminal, priceEvents, verified] = await Promise.all([
      read('src/components/product-price-cards.tsx'),
      read('src/components/price-chart-terminal.tsx'),
      read('src/lib/price-events.ts'),
      read('src/lib/verified-data.ts')
    ]);

    assert.match(priceEvents, /ProductPriceHistorySparklinePoint/);
    assert.match(priceEvents, /buildProductPriceHistorySparkline/);
    assert.match(priceEvents, /chainLabel/);
    assert.match(priceEvents, /storeLabel/);
    assert.match(priceEvents, /chartValueLabel/);

    assert.match(verified, /buildProductPriceHistorySparkline/);
    assert.match(verified, /normalizeComparableUnitPrice\(point\.value, product\.quantity\)/);
    assert.match(verified, /observed unit-price points from price_daily\/OpenPrices history by chain and store/);

    assert.match(cards, /data-product-row-price-history-sparkline/);
    assert.match(cards, /7-day price history · unit view/);
    assert.match(cards, /chain and store/);
    assert.match(cards, /latest\.chainLabel/);
    assert.match(cards, /latest\.storeLabel/);
    assert.match(cards, /point\.chartValue/);

    assert.match(terminal, /data-chain-store-unit-price-history/);
    assert.match(terminal, /seriesUnitHistoryLabel/);
    assert.match(terminal, /Chain\/store unit-price history/);
  });
});
