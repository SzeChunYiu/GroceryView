import { describe, expect, it } from 'vitest';

import { calculateChainPriceIndex, type ChainPriceObservation } from '../../index.js';

describe('calculateChainPriceIndex', () => {
  it('calculates sorted chain price indices from fixture observations', () => {
    const observations: ChainPriceObservation[] = [
      { chainId: 'ica', category: 'dairy', unitPrice: 10 },
      { chainId: 'coop', category: 'dairy', unitPrice: 20 },
      { chainId: 'ica', category: 'produce', unitPrice: 30 },
      { chainId: 'coop', category: 'produce', unitPrice: 60 }
    ];

    const summary = calculateChainPriceIndex(observations);

    expect(summary.generatedFrom).toBe(4);
    expect(summary.categories).toEqual(['dairy', 'produce']);
    expect(summary.marketReferenceByCategory).toEqual({ dairy: 15, produce: 45 });
    expect(summary.chains.map((chain) => chain.chainId)).toEqual(['ica', 'coop']);
    expect(summary.chains[0]).toMatchObject({
      chainId: 'ica',
      overallIndex: 93.33,
      observations: 2,
      categoriesCovered: 2,
      confidence: 'low'
    });
    expect(summary.chains[0]?.byCategory).toEqual([
      { category: 'dairy', index: 93.33, observations: 1, marketReference: 15, confidence: 'low', estimated: true },
      { category: 'produce', index: 93.33, observations: 1, marketReference: 45, confidence: 'low', estimated: true }
    ]);
    expect(summary.chains[1]).toMatchObject({ chainId: 'coop', overallIndex: 106.67 });
  });

  it('returns an empty summary for empty input', () => {
    expect(calculateChainPriceIndex([])).toEqual({
      chains: [],
      categories: [],
      marketReferenceByCategory: {},
      generatedFrom: 0
    });
  });

  it('ignores malformed fixture observations with missing fields', () => {
    const observations = [
      { chainId: 'ica', category: 'dairy', unitPrice: 10 },
      { chainId: '', category: 'dairy', unitPrice: 11 },
      { chainId: 'ica', unitPrice: 12 },
      { chainId: 'coop', category: '', unitPrice: 13 },
      { chainId: 'coop', category: 'dairy' },
      { chainId: 'coop', category: 'dairy', unitPrice: Number.NaN }
    ] as unknown as ChainPriceObservation[];

    const summary = calculateChainPriceIndex(observations);

    expect(summary.generatedFrom).toBe(1);
    expect(summary.categories).toEqual(['dairy']);
    expect(summary.marketReferenceByCategory).toEqual({ dairy: 10 });
    expect(summary.chains).toHaveLength(1);
    expect(summary.chains[0]).toMatchObject({
      chainId: 'ica',
      overallIndex: 100,
      observations: 1,
      categoriesCovered: 1,
      confidence: 'low'
    });
  });
});
