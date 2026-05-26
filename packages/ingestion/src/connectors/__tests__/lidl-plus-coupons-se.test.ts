import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchLidlPlusCoupons,
  promotionRouter,
  LIDL_PLUS_COUPONS_URL
} from '../lidl-plus-coupons-se.js';
import type { LidlOffer } from '../lidl.js';

const RETRIEVED_AT = '2026-05-25T14:10:00.000Z';

type MockResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function htmlResponse(html: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => html
  } as MockResponse as Response;
}

function gridData(value: unknown): string {
  return JSON.stringify(value).replace(/"/g, '&quot;');
}

describe('Lidl Plus coupon connector', () => {
  it('emits only Lidl Plus coupon rows with scan-required structured promotions', async () => {
    const html = [
      `<div data-grid-data="${gridData({
        productId: 'p10037163',
        fullTitle: 'Vispgraddde',
        canonicalUrl: '/p/matriket-vispgradde/p10037163',
        brand: { name: 'Matriket' },
        packaging: { text: '5 dl/forp.' },
        regions: ['SE'],
        regionsPrices: {
          SE: {
            currentPrice: { price: 65, currencyCode: 'SEK', oldPrice: 65, basePrice: { text: '65 kr/st' } },
            currentLidlPlusPrice: {
              price: { price: 48, currencyCode: 'SEK', oldPrice: 65, basePrice: { text: '48 kr/st' }, startDate: '2026-05-18', endDate: '2026-05-24' },
              lidlPlusText: 'Med Lidl Plus KUPONG 2 FOR: 48:-'
            }
          }
        },
        image: 'https://www.lidl.se/vispgraddde.jpg'
      })}"></div>`,
      `<div data-grid-data="${gridData({
        productId: 'p-public',
        fullTitle: 'Public bread',
        price: { price: 25, currencyCode: 'SEK' }
      })}"></div>`
    ].join('');
    const fetchImpl: typeof fetch = async () => htmlResponse(html);

    const rows = await fetchLidlPlusCoupons({
      fetchImpl,
      offerPaths: ['/c/lidl-plus-erbjudanden/a10094788'],
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.channel, 'lidl_plus');
    assert.equal(rows[0]?.sourceType, 'member_coupon');
    assert.equal(rows[0]?.priceType, 'coupon');
    assert.equal(rows[0]?.scanRequired, true);
    assert.equal(rows[0]?.couponCatalogUrl, LIDL_PLUS_COUPONS_URL);
    assert.deepEqual(rows[0]?.structuredPromotion, {
      kind: 'coupon_multi_buy',
      quantity: 2,
      totalPrice: 48,
      scanRequired: true,
      sourceText: 'Med Lidl Plus KUPONG 2 FOR: 48:-'
    });
  });

  it('routes plain coupon prices when no multi-buy text is present', () => {
    const offer: LidlOffer = {
      code: 'p101',
      name: 'Coffee',
      brand: 'Lidl',
      packageText: '450 g',
      category: 'lidl-public-offers',
      price: 39.9,
      regularPrice: 59.9,
      priceText: '39.90 SEK',
      unitPriceText: '88.67 kr/kg',
      promotionText: 'Med Lidl Plus KUPONG',
      memberOnly: true,
      channel: 'store',
      is_member_price: true,
      is_coupon_price: true,
      is_subscription_price: false,
      is_clearance: false,
      multi_buy: '',
      regions: ['SE'],
      validFrom: '2026-05-25',
      validTo: '2026-05-31',
      productUrl: 'https://www.lidl.se/p/coffee/p101',
      imageUrl: '',
      sourceUrl: 'https://www.lidl.se/c/lidl-plus-erbjudanden/a10094788',
      retrievedAt: RETRIEVED_AT
    };

    assert.deepEqual(promotionRouter(offer), {
      kind: 'coupon_price',
      price: 39.9,
      scanRequired: true,
      sourceText: 'Med Lidl Plus KUPONG'
    });
  });
});
