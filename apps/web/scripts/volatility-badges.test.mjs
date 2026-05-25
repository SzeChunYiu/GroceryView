import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('price volatility badges', () => {
  it('classifies recent observations into stable, rising, falling, and volatile badges', async () => {
    const intelligence = await read('src/lib/price-intelligence.ts');

    assert.match(intelligence, /export type PriceVolatilityBadgeKind = 'stable' \| 'rising' \| 'falling' \| 'volatile'/);
    assert.match(intelligence, /export function classifyPriceVolatilityBadge/);
    assert.match(intelligence, /kind: 'stable'/);
    assert.match(intelligence, /kind: 'rising'/);
    assert.match(intelligence, /kind: 'falling'/);
    assert.match(intelligence, /kind: 'volatile'/);
    assert.match(intelligence, /slice\(-6\)/);
  });

  it('surfaces badge labels on price badges, product cards, product rows, deal cards, and the volatility API', async () => {
    const [priceBadge, cards, rows, deals, route] = await Promise.all([
      read('src/components/price-badge.tsx'),
      read('src/components/product-price-cards.tsx'),
      read('src/components/store-product-row.tsx'),
      read('src/components/deal-card.tsx'),
      read('src/app/api/pricing/volatility/route.ts')
    ]);

    assert.match(priceBadge, /recentObservations\?: ReadonlyArray<PriceVolatilityObservation>/);
    assert.match(priceBadge, /volatilityBadge\?: PriceVolatilityBadge \| null/);
    assert.match(priceBadge, /volatilityStyles\[volatility\.kind\]/);

    assert.match(cards, /classifyPriceVolatilityBadge\(card\.sparklinePoints\)/);
    assert.match(cards, /\{badge\.label\} · Volatility score/);

    assert.match(rows, /recentPriceObservations\?: ReadonlyArray<PriceVolatilityObservation>/);
    assert.match(rows, /Price trend: \{volatilityBadge\.label\}/);

    assert.match(deals, /classifyPriceVolatilityBadge\(\[/);
    assert.match(deals, /\{volatilityBadge\.label\}/);

    assert.match(route, /classifyPriceVolatilityBadge\(row\.observations\)/);
    assert.match(route, /badgeKind: badge\.kind/);
    assert.match(route, /badgeLabel: badge\.label/);
  });
});
