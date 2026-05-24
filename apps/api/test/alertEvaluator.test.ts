import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluatePriceAlert } from '../src/jobs/alertNotifier.js';

describe('evaluatePriceAlert', () => {
  it('triggers when price equals target', () => {
    const result = evaluatePriceAlert({
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      targetPrice: 50,
      currentPrice: 50
    });

    assert.equal(result.outcome.status, 'triggered');
    assert.equal(result.outcome.reason, 'price_drops_to_target');
  });

  it('triggers when price drops below target', () => {
    const result = evaluatePriceAlert({
      productId: 'milk',
      productName: 'Arla Milk 1L',
      targetPrice: 50,
      currentPrice: 45
    });

    assert.equal(result.outcome.status, 'triggered');
    assert.equal(result.outcome.reason, 'price_drops_below_target');
  });

  it('does not trigger when price rises', () => {
    const result = evaluatePriceAlert({
      productId: 'eggs',
      productName: 'Eggs 12-pack',
      targetPrice: 35,
      currentPrice: 39
    });

    assert.equal(result.outcome.status, 'not_triggered');
    assert.equal(result.outcome.reason, 'price_rises');
  });

  it('skips already-triggered alerts', () => {
    const result = evaluatePriceAlert({
      productId: 'bread',
      productName: 'Dark Rye Bread 1kg',
      targetPrice: 30,
      currentPrice: 28,
      wasTriggered: true
    });

    assert.equal(result.outcome.status, 'already_triggered');
    assert.equal(result.outcome.reason, 'already_triggered');
  });
});
