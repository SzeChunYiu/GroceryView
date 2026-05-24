import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parsePercentOffPromotion } from '../index.js';

describe('parsePercentOffPromotion', () => {
  it('parses percent-off campaign phrases', () => {
    assert.deepEqual(parsePercentOffPromotion('30 % rabatt'), { kind: 'percent_off', pct: 30 });
    assert.deepEqual(parsePercentOffPromotion('Spara 25%'), { kind: 'percent_off', pct: 25 });
    assert.deepEqual(parsePercentOffPromotion('-40%'), { kind: 'percent_off', pct: 40 });
  });

  it('falls back to null for non-percent or ambiguous text', () => {
    assert.equal(parsePercentOffPromotion('Spara 10 kr'), null);
    assert.equal(parsePercentOffPromotion('3 för 2'), null);
    assert.equal(parsePercentOffPromotion('Fett 30%'), null);
  });
});
