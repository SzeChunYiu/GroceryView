import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeLidlOffer } from '../lidl.js';

const RETRIEVED_AT = '2026-05-25T14:10:00.000Z';

describe('Lidl offer pricing quirks', () => {
  it('emits store channel, Lidl Plus member/coupon flags, clearance, and multi-buy labels', () => {
    const row = normalizeLidlOffer(
      {
        productId: 'p10037163',
        fullTitle: 'Vispgrädde',
        canonicalUrl: '/p/matriket-vispgradde/p10037163',
        brand: { name: 'Matriket' },
        packaging: { text: '5 dl/förp.' },
        regions: ['SE'],
        regionsPrices: {
          SE: {
            currentPrice: { price: 65, currencyCode: 'SEK', oldPrice: 65, basePrice: { text: '65 kr/st' } },
            currentLidlPlusPrice: {
              price: { price: 48, currencyCode: 'SEK', oldPrice: 65, basePrice: { text: '48 kr/st' }, startDate: '2026-05-18', endDate: '2026-05-24' },
              lidlPlusText: 'Med Lidl Plus KUPONG 2 FÖR: 48:-'
            }
          }
        },
        image: 'https://www.lidl.se/vispgradde.jpg'
      },
      'https://www.lidl.se/c/superklipp-fran-torsdag/a10095528',
      RETRIEVED_AT
    );

    assert.deepEqual(row && {
      channel: row.channel,
      member: row.is_member_price,
      coupon: row.is_coupon_price,
      subscription: row.is_subscription_price,
      clearance: row.is_clearance,
      multiBuy: row.multi_buy,
      price: row.price,
      regularPrice: row.regularPrice
    }, {
      channel: 'store',
      member: true,
      coupon: true,
      subscription: false,
      clearance: true,
      multiBuy: 'Med Lidl Plus KUPONG 2 FÖR: 48:-',
      price: 48,
      regularPrice: 65
    });
  });

  it('rejects malformed offer payloads', () => {
    assert.equal(normalizeLidlOffer({ productId: 'missing-price', fullTitle: 'Saknar pris' }, 'https://www.lidl.se', RETRIEVED_AT), null);
  });
});
