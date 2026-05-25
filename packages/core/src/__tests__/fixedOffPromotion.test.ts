import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseFixedOffPromotion } from '../lib/promotionParsers/fixedOff.js';

describe('parseFixedOffPromotion', () => {
  it('parses Spara fixed-off copy', () => {
    assert.deepEqual(parseFixedOffPromotion('Spara 10:- på kaffe'), {
      kind: 'fixed_off',
      amount: 10,
      currency: 'SEK',
      matchedText: 'Spara 10:-'
    });
  });

  it('parses kr rabatt fixed-off copy', () => {
    assert.deepEqual(parseFixedOffPromotion('15 kr rabatt med kupong'), {
      kind: 'fixed_off',
      amount: 15,
      currency: 'SEK',
      matchedText: '15 kr rabatt'
    });
  });

  it('ignores percent-only discounts', () => {
    assert.equal(parseFixedOffPromotion('20% rabatt'), null);
  });
});
