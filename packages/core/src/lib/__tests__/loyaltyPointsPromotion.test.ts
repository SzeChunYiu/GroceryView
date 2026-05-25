import { describe, expect, it } from 'vitest';
import { parseLoyaltyPointsPromotion } from '../promotionParsers/loyaltyPoints';

describe('parseLoyaltyPointsPromotion', () => {
  it('parses multiplier point boosts without treating them as discounts', () => {
    expect(parseLoyaltyPointsPromotion('10x poäng')).toEqual({ kind: 'loyalty_points', multiplier: 10 });
    expect(parseLoyaltyPointsPromotion('5 gånger bonuspoäng')).toEqual({ kind: 'loyalty_points', multiplier: 5 });
  });

  it('parses percent bonus points as a points multiplier', () => {
    expect(parseLoyaltyPointsPromotion('20% bonuspoäng')).toEqual({ kind: 'loyalty_points', multiplier: 1.2 });
  });

  it('ignores ordinary price discount copy', () => {
    expect(parseLoyaltyPointsPromotion('20% rabatt på kaffe')).toBeNull();
  });
});
