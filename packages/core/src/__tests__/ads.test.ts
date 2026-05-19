import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyAdPolicy, rankOrganicDeals } from '../index.js';

describe('ad policy', () => {
  it('labels sponsored placements and keeps them out of critical decision areas', () => {
    const placements = applyAdPolicy({
      premiumUser: false,
      candidates: [
        { id: 'native-1', surface: 'market_feed', sponsor: 'Brand A' },
        { id: 'bad-1', surface: 'deal_score_explanation', sponsor: 'Brand B' },
        { id: 'banner-1', surface: 'product_page_bottom', sponsor: 'Brand C' }
      ]
    });

    assert.deepEqual(placements.map((placement) => ({ id: placement.id, label: placement.label, allowed: placement.allowed })), [
      { id: 'native-1', label: 'Sponsored', allowed: true },
      { id: 'bad-1', label: 'Sponsored', allowed: false },
      { id: 'banner-1', label: 'Sponsored', allowed: true }
    ]);
  });

  it('removes ads for premium users', () => {
    const placements = applyAdPolicy({ premiumUser: true, candidates: [{ id: 'native-1', surface: 'market_feed', sponsor: 'Brand A' }] });
    assert.deepEqual(placements, []);
  });

  it('ranks organic deals without sponsored influence', () => {
    const ranked = rankOrganicDeals([
      { productId: 'coffee', dealScore: 82, sponsored: false },
      { productId: 'butter-sponsored', dealScore: 42, sponsored: true },
      { productId: 'milk', dealScore: 75, sponsored: false }
    ]);

    assert.deepEqual(ranked.map((deal) => deal.productId), ['coffee', 'milk', 'butter-sponsored']);
  });
});
