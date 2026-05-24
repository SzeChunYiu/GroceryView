import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rankHouseholdSizePromotion } from '../lib/rankers/householdSize.js';

describe('rankHouseholdSizePromotion', () => {
  it('boosts multi-buy promotions for households of three or more', () => {
    assert.deepEqual(
      rankHouseholdSizePromotion({ householdSize: 4, quantityThreshold: 3, baseScore: 70, promotionText: '3 for 2' }),
      { score: 82, adjustment: 12, reason: 'family_suited' }
    );
  });

  it('demotes family-pack and quantity-tier promotions for single households', () => {
    assert.deepEqual(
      rankHouseholdSizePromotion({ householdSize: 1, quantityThreshold: 2, baseScore: 70, packageSize: 'Family pack 2kg' }),
      { score: 60, adjustment: -10, reason: 'single_household_penalty' }
    );
  });

  it('keeps non quantity-tier deals neutral', () => {
    assert.deepEqual(
      rankHouseholdSizePromotion({ householdSize: 1, baseScore: 70, promotionText: '10 kr off' }),
      { score: 70, adjustment: 0, reason: 'neutral' }
    );
  });
});
