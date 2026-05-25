import { describe, expect, it } from 'vitest';
import { parseMemberPricePromotion } from '../promotionParsers/memberPrice';

const examples = [
  ['Medlemspris 29 kr Ord pris 39 kr', { kind: 'member', list_price: 39, member_price: 29 }],
  ['Stammis 24,90 kr, ordinarie pris 32,90 kr', { kind: 'member', list_price: 32.9, member_price: 24.9 }],
  ['Willys Plus-pris 15:- Ord. pris 20:-', { kind: 'member', list_price: 20, member_price: 15 }],
  ['Klubbpris 99 SEK tidigare 129 SEK', { kind: 'member', list_price: 129, member_price: 99 }],
  ['Ordinarie pris 49 kr. Medlemspris 35 kr', { kind: 'member', list_price: 49, member_price: 35 }]
] as const;

describe('parseMemberPricePromotion', () => {
  it.each(examples)('parses %s', (input, expected) => {
    expect(parseMemberPricePromotion(input)).toEqual(expected);
  });

  it('returns null unless a supported member keyword and exactly two scalar prices are visible', () => {
    expect(parseMemberPricePromotion('Kampanjpris 29 kr Ord pris 39 kr')).toBeNull();
    expect(parseMemberPricePromotion('Medlemspris 29 kr')).toBeNull();
    expect(parseMemberPricePromotion('Medlemspris 29 kr Ord pris 39 kr Extra rabatt 5 kr')).toBeNull();
    expect(parseMemberPricePromotion('Medlemspris 2 för 40 kr Ord pris 25 kr')).toBeNull();
  });
});
