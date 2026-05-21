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
    for (let i = 0; i < 12; i += 1) {
      observations.push(obs('cheap', 'coffee', 80 + i));
      observations.push(obs('cheap', 'milk', 8 + i * 0.1));
    }
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
    assert.equal(summary.chains[0].chainId, 'cheap');
    // 24 obs across 2 categories => medium confidence (high needs >=30 obs, >=4 cats).
    assert.equal(cheap.categoriesCovered, 2);
    assert.equal(cheap.confidence, 'medium');
  });

  it('shrinks a single extreme observation toward the market and flags it estimated', () => {
    const observations: ChainPriceObservation[] = [];
    for (let i = 0; i < 20; i += 1) observations.push(obs('market', 'coffee', 100 + i));
    observations.push(obs('thin', 'coffee', 10));

    const summary = calculateChainPriceIndex(observations);
    const thin = summary.chains.find((c) => c.chainId === 'thin');
    const cell = thin?.byCategory.find((b) => b.category === 'coffee');

    assert.ok(thin && cell);
    assert.equal(cell.observations, 1);
    assert.equal(cell.estimated, true, 'single-observation cell must be flagged estimated');
    assert.equal(cell.confidence, 'low');
    assert.ok(cell.index > 60, `shrinkage should pull a 1-obs cell toward market (got ${cell.index})`);
  });
});
