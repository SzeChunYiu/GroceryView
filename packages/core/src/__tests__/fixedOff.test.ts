import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFixedOffPromotion } from '../lib/promotionParsers/fixedOff.js';

describe('parseFixedOffPromotion', () => {
  it('parses fixed SEK discount flyer phrasings', () => {
    for (const [text, amount] of [
      ['Spara 10:-', 10],
      ['Spara 10 kr', 10],
      ['Spara 10 SEK', 10],
      ['15 kr rabatt', 15],
      ['15:- rabatt', 15],
      ['ICA Spara 12,50 kr', 12.5],
      ['Willys 20 kr rabatt', 20],
      ['Coop spara 30:-', 30]
    ] as const) {
      assert.deepEqual(parseFixedOffPromotion(text), { kind: 'fixed_off', amount, currency: 'SEK' }, text);
    }
  });

  it('returns null for ambiguous or non-discount text', () => {
    for (const text of ['', '10 kr', 'Rabatt', 'Spara pengar', 'Spara 0 kr', '10 procent rabatt', '2 för 20 kr']) {
      assert.equal(parseFixedOffPromotion(text), null, text);
    }
  });
});
