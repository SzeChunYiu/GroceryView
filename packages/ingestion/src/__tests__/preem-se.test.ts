import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPreemBusinessListPriceRow,
  buildPreemConsumerPumpPriceRow,
  buildPreemMastercardDiscountRows
} from '../connectors/preem-se.js';

describe('Preem SE pricing quirk codification', () => {
  it('marks consumer pump prices as station-local store-channel rows', () => {
    const row = buildPreemConsumerPumpPriceRow({
      productName: 'Preem Evolution Bensin 95',
      price: 18.89,
      format: 'staffed_station',
      storeId: 'preem-stockholm',
      retrievedAt: '2026-05-24T00:00:00.000Z'
    });

    assert.equal(row.channel, 'store');
    assert.equal(row.format, 'staffed_station');
    assert.equal(row.customer_segment, 'consumer');
    assert.equal(row.store_region_tag, 'station_local');
    assert.equal(row.store_id, 'preem-stockholm');
  });

  it('emits member-price discount rows for Preem Mastercard station formats', () => {
    const rows = buildPreemMastercardDiscountRows('2026-05-24T00:00:00.000Z');

    assert.deepEqual(rows.map((row) => row.format), ['staffed_station', 'automat_station']);
    assert.deepEqual(rows.map((row) => row.is_member_price), [true, true]);
    assert.deepEqual(rows.map((row) => row.membership_program), ['Preem Mastercard', 'Preem Mastercard']);
    assert.deepEqual(rows.map((row) => row.discount_ore_per_liter), [25, 10]);
  });

  it('emits B2B list-price rows for business formats', () => {
    const row = buildPreemBusinessListPriceRow({
      productName: 'Diesel Preem Evolution Diesel',
      price: 21.34,
      unit: 'liter',
      format: 'company_card_list_price',
      retrievedAt: '2026-05-24T00:00:00.000Z'
    });

    assert.equal(row.customer_segment, 'business');
    assert.equal(row.is_b2b_price, true);
    assert.equal(row.format, 'company_card_list_price');
    assert.equal(row.channel, 'store');
  });
});
