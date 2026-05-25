import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchWillysFlyerOffers,
  promotionRouter,
  WILLYS_FLYER_URL
} from '../willys-flyer.js';
import type { WillysWeeklyDiscount } from '../willys.js';

const RETRIEVED_AT = '2026-05-25T08:30:00.000Z';

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload
  } as MockResponse as Response;
}

describe('Willys flyer connector', () => {
  it('routes direct flyer mechanics and filters Willys Plus rows into a separate channel', async () => {
    const requestedUrls: string[] = [];
    const validUntil = 1_798_588_800_000;
    const fixture = {
      results: [
        {
          manufacturer: 'Garant',
          name: 'Pasta Penne',
          priceNoUnit: '18:95',
          googleAnalyticsCategory: 'Skafferi/Pasta',
          displayVolume: '500 g',
          image: { url: 'https://assets.willys.se/images/pasta.jpg' },
          labels: ['Jfr-pris'],
          potentialPromotions: [
            {
              code: 'flyer-x-for-y',
              mainProductCode: '3001',
              name: 'Pasta Penne 500 g',
              brands: ['Garant'],
              campaignType: 'WEEKLY',
              promotionType: 'DISCOUNT',
              price: 18.95,
              cartLabel: 'Tag 2 betala för 1',
              comparePrice: '18:95/kg',
              savePrice: 'Spara 18:95',
              weightVolume: '500 g',
              conditionLabel: 'Tag 2 betala för 1',
              startDate: '2026-05-25',
              endDate: '2026-05-31',
              validUntil
            },
            {
              code: 'plus-only',
              mainProductCode: '3002',
              name: 'Plus coffee',
              campaignType: 'LOYALTY',
              promotionType: 'DISCOUNT',
              price: 39.9,
              cartLabel: '39:90',
              redeemLimitLabel: 'Gäller Willys Plus',
              validUntil
            }
          ]
        }
      ],
      pagination: { numberOfPages: 1, currentPage: 0 }
    };
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrls.push(String(input));
      return jsonResponse(fixture);
    };

    const rows = await fetchWillysFlyerOffers({
      fetchImpl,
      storeIds: ['2110'],
      pageSize: 25,
      maxRows: 25,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(requestedUrls.length, 1);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.channel, 'weekly_flyer');
    assert.equal(rows[0]?.sourceType, 'weekly_flyer');
    assert.equal(rows[0]?.priceType, 'flyer');
    assert.equal(rows[0]?.flyerUrl, WILLYS_FLYER_URL);
    assert.deepEqual(rows[0]?.structuredPromotion, {
      kind: 'x_for_y',
      buyQuantity: 2,
      payQuantity: 1,
      sourceText: 'Tag 2 betala för 1 · Tag 2 betala för 1 · Spara 18:95'
    });
  });

  it('falls back to multi-buy and fixed-price flyer structures', () => {
    const base: WillysWeeklyDiscount = {
      code: 'promo',
      productCode: '3001',
      name: 'Yoghurt',
      brand: 'Garant',
      storeId: '2110',
      storeName: 'Willys Odenplan',
      city: 'Stockholm',
      channel: 'store',
      isMemberPrice: false,
      isCouponPrice: false,
      isSubscriptionPrice: false,
      isClearance: false,
      multiBuy: null,
      campaignType: 'WEEKLY',
      promotionType: 'DISCOUNT',
      price: 12.5,
      priceText: '12:50',
      comparePriceText: '12:50/l',
      regularPriceText: '16:95',
      savePriceText: '',
      packageText: '1 l',
      conditionText: '',
      redeemLimitText: '',
      startDate: '2026-05-25',
      endDate: '2026-05-31',
      validUntil: '2026-05-31T22:00:00.000Z',
      category: 'Mejeri',
      imageUrl: '',
      labels: [],
      sourceUrl: 'https://www.willys.se/search/campaigns/offline?q=2110',
      retrievedAt: RETRIEVED_AT
    };

    assert.deepEqual(promotionRouter({ ...base, conditionText: '2 för', priceText: '2 för 25 kr' }), {
      kind: 'multi_buy_price',
      quantity: 2,
      totalPrice: 25,
      sourceText: '2 för · 2 för 25 kr'
    });
    assert.deepEqual(promotionRouter(base), {
      kind: 'fixed_price',
      price: 12.5,
      sourceText: '12:50'
    });
  });
});
