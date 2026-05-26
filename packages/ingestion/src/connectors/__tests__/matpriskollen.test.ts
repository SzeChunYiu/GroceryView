import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeMatpriskollenOffer } from '../matpriskollen.js';

describe('Matpriskollen offer normalization', () => {
  it('surfaces store channel, region, format, member, coupon, and multi-buy quirks', () => {
    const row = normalizeMatpriskollenOffer(
      {
        key: 'offer-1',
        condition: '2 för 35 kr med kupong',
        price: '35,00/frp',
        comprice: '17,50/st',
        regular: '22,90/st',
        volume: '2 x 500 g',
        requiresMembershipCard: true,
        requiresCoupon: true,
        validFrom: 1772409600,
        validTo: 1773014400,
        store_id: 'ica-123',
        product: {
          name: 'Pasta',
          brand: 'ICA',
          origin: 'Sverige',
          categories: [{ name: 'Torrvaror', parent_category: { name: 'Mat' } }]
        }
      },
      {
        sourceUrl: 'https://matpriskollen.se/api/v1/stores/ica-kvantum/offers',
        retrievedAt: '2026-05-25T14:05:00.000Z',
        storeName: 'ICA Kvantum Falkenberg',
        storeKey: 'ica-kvantum-falkenberg',
        storeId: 'fallback-store',
        regionName: 'malmo'
      }
    );

    assert.deepEqual(row && {
      channel: row.channel,
      storeId: row.storeId,
      format: row.format,
      member: row.is_member_price,
      coupon: row.is_coupon_price,
      multiBuy: row.multi_buy,
      validFrom: row.validFrom,
      validTo: row.validTo
    }, {
      channel: 'store',
      storeId: 'ica-123:malmo',
      format: 'ica-kvantum',
      member: true,
      coupon: true,
      multiBuy: '2 för 35 kr med kupong',
      validFrom: '2026-03-02T00:00:00.000Z',
      validTo: '2026-03-09T00:00:00.000Z'
    });
  });

  it('rejects offers without required identity, name, or price', () => {
    assert.equal(
      normalizeMatpriskollenOffer(
        { key: 'missing-price', product: { name: 'Pasta' } },
        { sourceUrl: 'https://matpriskollen.se', retrievedAt: '2026-05-25T14:05:00.000Z', storeName: 'Willys', storeKey: 'willys', storeId: '1' }
      ),
      null
    );
  });
});
