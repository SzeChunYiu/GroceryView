import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { expandGoodfriendsRows, parseGoodstoreSePrices } from './goodstore-se.js';

describe('goodstore-se connector pricing quirks', () => {
  it('emits online delivery fields and Goodfriends coupon/member rows', () => {
    const rows = parseGoodstoreSePrices('<article><h2>Nooch Näringsjäst B12 150g Goodstore</h2><p>74,95 SEK</p></article>', 'https://www.goodstore.se/', '2026-05-24T00:00:00Z');
    const base = rows.find((row) => !row.is_member_price)!;
    const member = rows.find((row) => row.is_member_price && row.member_discount_percent === 3)!;

    assert.equal(base.channel, 'online');
    assert.equal(base.online_delivery_fee_sek, 79.95);
    assert.equal(base.online_free_shipping_threshold_sek, 999);
    assert.equal(base.online_minimum_order_sek, 300);
    assert.equal(member.member_program, 'Goodfriends');
    assert.equal(member.is_coupon_price, true);
  });

  it('marks Åsögatan-only chilled rows as store channel with Stockholm region', () => {
    const rows = parseGoodstoreSePrices('<h1>Vegan Roast Beef 120g Goodstore</h1><p>49,95 SEK</p><p>OBS! Finns endast i butiken på Åsögatan 116.</p>');
    assert.equal(rows[0]?.channel, 'store');
    assert.equal(rows[0]?.store_id, 'goodstore-se-stockholm-asogatan-116');
    assert.equal(rows[0]?.region, 'stockholm');
  });

  it('surfaces KÖP N SPARA XKR as a multi_buy row without stacking member discounts', () => {
    const rows = parseGoodstoreSePrices('<article><h2>Sweet Ps Jordnötter Choklad 150g - KÖP 2 SPARA 20KR!</h2><p>49,95 SEK</p></article>');
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0]?.multi_buy, { buy_quantity: 2, save_amount: 20, currency: 'SEK' });
  });

  it('keeps subscription and clearance fields false unless Goodstore documents them', () => {
    const [base] = expandGoodfriendsRows(parseGoodstoreSePrices('<h2>Snappies Chokladlinser 150g</h2><p>56,95 SEK</p>')[0]!);
    assert.equal(base.is_subscription_price, false);
    assert.equal(base.is_clearance, false);
  });
});
