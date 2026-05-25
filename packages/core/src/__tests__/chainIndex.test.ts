import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateChainPriceIndex, type ChainPriceObservation } from '../index.js';

function obs(
  chainId: string,
  category: string,
  unitPrice: number,
  matchedProductId?: string,
  basketWeight?: number
): ChainPriceObservation {
  const observation: ChainPriceObservation = { chainId, category, unitPrice };
  if (matchedProductId) observation.matchedProductId = matchedProductId;
  if (basketWeight !== undefined) observation.basketWeight = basketWeight;
  return observation;
}

describe('calculateChainPriceIndex', () => {
  it('returns an empty summary when there are no usable observations', () => {
    const summary = calculateChainPriceIndex([
      { chainId: '', category: 'coffee', unitPrice: 10 },
      { chainId: 'ica', category: 'coffee', unitPrice: 0 },
      { chainId: 'ica', category: 'coffee', unitPrice: Number.NaN }
    ]);
    assert.equal(summary.chains.length, 0);
    assert.equal(summary.generatedFrom, 0);
  });

  it('does not create an index for a chain with no matched products', () => {
    const summary = calculateChainPriceIndex([
      obs('market', 'coffee', 100),
      obs('market', 'coffee', 110),
      { chainId: 'empty', category: 'coffee', unitPrice: 0 },
      { chainId: 'empty', category: 'coffee', unitPrice: Number.NaN }
    ]);

    assert.equal(summary.chains.some((chain) => chain.chainId === 'empty'), false);
    assert.ok(summary.chains.every((chain) => Number.isFinite(chain.overallIndex)));
  });

  it('ranks a consistently cheaper chain below a pricier one on a 100-centred scale', () => {
    const observations: ChainPriceObservation[] = [];
    // Cheap chain: well below the market median in two well-covered categories.
    for (let i = 0; i < 12; i += 1) {
      observations.push(obs('cheap', 'coffee', 80 + i));
      observations.push(obs('cheap', 'milk', 8 + i * 0.1));
    }
    // Pricey chain: well above.
    for (let i = 0; i < 12; i += 1) {
      observations.push(obs('pricey', 'coffee', 130 + i));
      observations.push(obs('pricey', 'milk', 14 + i * 0.1));
    }

    const summary = calculateChainPriceIndex(observations);
    const cheap = summary.chains.find((c) => c.chainId === 'cheap');
    const pricey = summary.chains.find((c) => c.chainId === 'pricey');

    assert.ok(cheap && pricey);
    assert.ok(cheap.overallIndex < 100, `cheap should be below market (got ${cheap.overallIndex})`);
    assert.ok(pricey.overallIndex > 100, `pricey should be above market (got ${pricey.overallIndex})`);
    // Cheapest chain is sorted first.
    assert.equal(summary.chains[0].chainId, 'cheap');
    // Both categories covered; 24 obs across 2 categories => medium confidence
    // (high requires >=30 obs and >=4 categories).
    assert.equal(cheap.categoriesCovered, 2);
    assert.equal(cheap.confidence, 'medium');
  });

  it('shrinks a single extreme observation toward the market and flags it estimated', () => {
    const observations: ChainPriceObservation[] = [];
    // A dense market so the median is well-defined.
    for (let i = 0; i < 20; i += 1) observations.push(obs('market', 'coffee', 100 + i));
    // A chain with ONE wildly cheap observation in that category.
    observations.push(obs('thin', 'coffee', 10));

    const summary = calculateChainPriceIndex(observations);
    const thin = summary.chains.find((c) => c.chainId === 'thin');
    const cell = thin?.byCategory.find((b) => b.category === 'coffee');

    assert.ok(thin && cell);
    assert.equal(cell.observations, 1);
    assert.equal(cell.estimated, true, 'single-observation cell must be flagged estimated');
    assert.equal(cell.confidence, 'low');
    // Raw ratio would be ~0.09 (index ~9); shrinkage must pull it far toward 100.
    assert.ok(cell.index > 60, `shrinkage should pull a 1-obs cell toward market (got ${cell.index})`);
  });

  it('raises confidence from matched-basket products without drifting from the 100-centred scale', () => {
    const observations: ChainPriceObservation[] = [];
    for (let i = 0; i < 12; i += 1) {
      const productId = `matched-product-${i}`;
      observations.push(obs('willys', 'pantry · st', 90, productId));
      observations.push(obs('hemkop', 'pantry · st', 110, productId));
    }

    const summary = calculateChainPriceIndex(observations);
    const willys = summary.chains.find((chain) => chain.chainId === 'willys');
    const hemkop = summary.chains.find((chain) => chain.chainId === 'hemkop');

    assert.ok(willys && hemkop);
    assert.equal(summary.matchedBasketProductIds.length, 12);
    assert.equal(willys.confidence, 'high');
    assert.equal(hemkop.confidence, 'high');
    assert.equal(willys.matchedBasketCoveragePercent, 100);
    assert.equal(hemkop.matchedBasketCoveragePercent, 100);
    assert.equal(Math.round(((willys.overallIndex + hemkop.overallIndex) / 2) * 10) / 10, 100);
  });

  it('reports missing matched-basket products for partially covered chains', () => {
    const summary = calculateChainPriceIndex([
      obs('willys', 'dairy · st', 10, 'milk'),
      obs('willys', 'dairy · st', 20, 'yogurt'),
      obs('hemkop', 'dairy · st', 12, 'milk')
    ]);

    const hemkop = summary.chains.find((chain) => chain.chainId === 'hemkop');

    assert.ok(hemkop);
    assert.equal(hemkop.matchedBasketCoveragePercent, 50);
    assert.deepEqual(hemkop.missingMatchedBasketProductIds, ['yogurt']);
    assert.equal(hemkop.confidence, 'low');
  });

  it('weights matched-basket categories by basket exposure', () => {
    const summary = calculateChainPriceIndex([
      obs('willys', 'dairy · st', 90, 'milk', 10),
      obs('hemkop', 'dairy · st', 110, 'milk', 10),
      obs('willys', 'snacks · st', 120, 'chips', 1),
      obs('hemkop', 'snacks · st', 80, 'chips', 1)
    ]);

    const willys = summary.chains.find((chain) => chain.chainId === 'willys');
    const hemkop = summary.chains.find((chain) => chain.chainId === 'hemkop');

    assert.ok(willys && hemkop);
    assert.ok(willys.overallIndex < hemkop.overallIndex);
  });
});
