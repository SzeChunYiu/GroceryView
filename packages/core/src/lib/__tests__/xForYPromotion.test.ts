import { describe, expect, it } from 'vitest';
import { parseXForYPromotion } from '../promotionParsers/xForY';

const examples = [
  ['2 för 20 kr', { kind: 'x_for_y', n: 2, price: 20, currency: 'SEK' }],
  ['3 for 100', { kind: 'x_for_y', n: 3, price: 100, currency: 'SEK' }],
  ['2 på 25:-', { kind: 'x_for_y', n: 2, price: 25, currency: 'SEK' }],
  ['4 för 39,90 kr', { kind: 'x_for_y', n: 4, price: 39.9, currency: 'SEK' }],
  ['Köp 2 betala för 1', { kind: 'x_for_y', n: 2, price: 1, currency: 'SEK' }],
  ['buy 3 pay for 2', { kind: 'x_for_y', n: 3, price: 2, currency: 'SEK' }]
] as const;

describe('parseXForYPromotion', () => {
  it.each(examples)('parses %s', (input, expected) => {
    expect(parseXForYPromotion(input)).toEqual(expected);
  });

  it('returns null for non-promotions and unsafe matches', () => {
    expect(parseXForYPromotion('20 kr/st')).toBeNull();
    expect(parseXForYPromotion('1 för 10 kr')).toBeNull();
    expect(parseXForYPromotion('Köp 2 betala för 2')).toBeNull();
  });
});
