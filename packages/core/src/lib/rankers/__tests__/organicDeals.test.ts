import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { rankOrganicDeals } from '../../../index.js';

describe('rankOrganicDeals ranker', () => {
  it('orders organic deals by score before sponsored placements', () => {
    const ranked = rankOrganicDeals([
      { productId: 'sponsored-top-bid', dealScore: 99, sponsored: true },
      { productId: 'organic-good', dealScore: 74, sponsored: false },
      { productId: 'organic-best', dealScore: 91, sponsored: false },
      { productId: 'sponsored-low', dealScore: 15, sponsored: true }
    ]);

    assert.deepEqual(ranked.map((deal) => deal.productId), [
      'organic-best',
      'organic-good',
      'sponsored-top-bid',
      'sponsored-low'
    ]);
  });
});
