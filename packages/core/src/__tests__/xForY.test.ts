import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseXForYPromotion } from '../lib/promotionParsers/xForY.js';

const positiveCases = [
  ['2 för 20 kr', { n: 2, price: 20 }],
  ['3 för 100 kr', { n: 3, price: 100 }],
  ['2 for 25 kr', { n: 2, price: 25 }],
  ['2 på 25:-', { n: 2, price: 25 }],
  ['ICA: 2 för 35 kr', { n: 2, price: 35 }],
  ['Willys 4 för 40 kr', { n: 4, price: 40 }],
  ['Coop 5 för 50:-', { n: 5, price: 50 }],
  ['2 FÖR 30 KR', { n: 2, price: 30 }],
  ['2 för 20,50 kr', { n: 2, price: 20.5 }],
  ['6 för 99 sek', { n: 6, price: 99 }],
  ['10 för 100 kr', { n: 10, price: 100 }],
  ['2 för 100', { n: 2, price: 100 }],
  ['3 for 100', { n: 3, price: 100 }],
  ['2 på 25', { n: 2, price: 25 }],
  ['Medlemspris 3 för 45 kr', { n: 3, price: 45 }],
  ['Max 1 köp/hushåll 2 för 22 kr', { n: 2, price: 22 }],
  ['Köp fler: 8 för 80 kr', { n: 8, price: 80 }],
  ['2 för 39.90 kr', { n: 2, price: 39.9 }],
  ['Coop kaffe 2 för 89:-', { n: 2, price: 89 }],
  ['Willys pasta 3 för 25 kr', { n: 3, price: 25 }],
  ['ICA yoghurt 2 för 32 kr', { n: 2, price: 32 }],
  ['Frukt 7 för 20 kr', { n: 7, price: 20 }],
  ['Sill 2 för 55 kr.', { n: 2, price: 55 }],
  ['Snacks (2 för 48 kr)', { n: 2, price: 48 }],
  ['Köp 2 betala för 1', { n: 2, price: null, pay_for: 1 }],
  ['Köp 3 betala 2', { n: 3, price: null, pay_for: 2 }]
] as const;

describe('parseXForYPromotion', () => {
  it('parses ICA/Willys/Coop x-for-y flyer phrasings conservatively', () => {
    for (const [label, expected] of positiveCases) {
      assert.deepEqual(parseXForYPromotion(label), { kind: 'x_for_y', currency: 'SEK', ...expected }, label);
    }
  });

  it('returns null for non multi-buy or ambiguous unit text', () => {
    for (const label of [
      '',
      'Ord pris 20 kr',
      'Spara 10 kr',
      '2 för 1 kg',
      '2 for 1 liter',
      '1 för 10 kr',
      'Köp 2 betala för 2',
      'Ta 3 betala 2',
      '20 kr/st',
      '2-pack 25 kr'
    ]) {
      assert.equal(parseXForYPromotion(label), null, label);
    }
  });
});
