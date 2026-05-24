import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateChainPriceIndex, type ChainPriceObservation } from '../index.js';

function obs(chainId: string, category: string, unitPrice: number): ChainPriceObservation {
  return { chainId, category, unitPrice };
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

  it('accepts matched-basket refinement rows without drifting the 100-centred scale', () => {
    const broad = [
      obs('willys', 'pantry', 10),
      obs('hemkop', 'pantry', 12),
      obs('willys', 'dairy', 20),
      obs('hemkop', 'dairy', 24)
    ];
    const matchedBasket = Array.from({ length: 8 }, (_, index) => [
      obs('willys', `matched-basket-${index}`, 100),
      obs('hemkop', `matched-basket-${index}`, 110)
    ]).flat();

    const summary = calculateChainPriceIndex([...broad, ...matchedBasket]);
    const willys = summary.chains.find((chain) => chain.chainId === 'willys');
    const hemkop = summary.chains.find((chain) => chain.chainId === 'hemkop');

    assert.ok(willys && hemkop);
    assert.equal(summary.generatedFrom, broad.length + matchedBasket.length);
    assert.equal(summary.marketReferenceByCategory['matched-basket-0'], 105);
    assert.ok(willys.overallIndex < 100, `Willys matched basket should stay below 100 (got ${willys.overallIndex})`);
    assert.ok(hemkop.overallIndex > 100, `Hemköp matched basket should stay above 100 (got ${hemkop.overallIndex})`);
    assert.equal(willys.categoriesCovered, 10);
    assert.equal(willys.confidence, 'medium');
  });

  it('does not invent matched-basket categories for chains missing those rows', () => {
    const summary = calculateChainPriceIndex([
      obs('willys', 'matched-basket-coffee', 80),
      obs('hemkop', 'matched-basket-coffee', 100),
      obs('coop', 'bread', 25),
      obs('willys', 'bread', 20),
      obs('hemkop', 'bread', 22)
    ]);
    const coop = summary.chains.find((chain) => chain.chainId === 'coop');

    assert.ok(coop);
    assert.equal(coop.categoriesCovered, 1);
    assert.equal(coop.byCategory.some((cell) => cell.category === 'matched-basket-coffee'), false);
    assert.equal(summary.categories.includes('matched-basket-coffee'), true);
  });
});
