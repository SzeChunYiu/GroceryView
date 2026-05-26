import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchWillysPlusOffers,
  promotionRouter,
  WILLYS_PLUS_OFFERS_URL
} from '../willys-plus-offers-se.js';
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

describe('Willys Plus offer connector', () => {
  it('emits only member offers with structured Willys Plus promotion rows', async () => {
    const fixture = {
      results: [
        {
          manufacturer: 'Arla',
          name: 'Mjolk 3%',
          priceNoUnit: '18:95',
          googleAnalyticsCategory: 'Mejeri/Mjolk',
          displayVolume: '1 l',
          image: { url: 'https://assets.willys.se/images/milk.jpg' },
          labels: ['Fran Sverige'],
          potentialPromotions: [
            {
              code: 'plus-milk',
              mainProductCode: '2001',
              name: 'Mjolk 3% 1 l',
              brands: ['Arla Ko'],
              campaignType: 'LOYALTY',
              promotionType: 'DISCOUNT',
              price: 12.9,
              cartLabel: '12:90',
              comparePrice: '12:90/l',
              savePrice: 'Spara 6:05',
              weightVolume: '1 liter',
              redeemLimitLabel: 'Galler Willys Plus',
              startDate: '2026-05-25',
              endDate: '2026-05-31',
              validUntil: 1_797_984_000_000
            },
            {
              code: 'public-pasta',
              mainProductCode: '3001',
              name: 'Pasta',
              campaignType: 'WEEKLY',
              promotionType: 'DISCOUNT',
              price: 18.95,
              cartLabel: 'Tag 2 betala for 1',
              validUntil: 1_797_984_000_000
            }
          ]
        }
      ],
      pagination: { numberOfPages: 1, currentPage: 0 }
    };
    const fetchImpl: typeof fetch = async () => jsonResponse(fixture);

    const rows = await fetchWillysPlusOffers({
      fetchImpl,
      storeIds: ['2110'],
      pageSize: 25,
      maxRows: 25,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.channel, 'willys_plus');
    assert.equal(rows[0]?.sourceType, 'member_offer');
    assert.equal(rows[0]?.priceType, 'member');
    assert.equal(rows[0]?.scanRequired, true);
    assert.equal(rows[0]?.memberOfferUrl, WILLYS_PLUS_OFFERS_URL);
    assert.deepEqual(rows[0]?.structuredPromotion, {
      kind: 'member',
      price: 12.9,
      memberProgram: 'willys_plus',
      sourceText: '12:90 · Spara 6:05 · Galler Willys Plus'
    });
  });

  it('routes Willys Plus multi-buy offers separately from fixed member prices', () => {
    const base: WillysWeeklyDiscount = {
      code: 'plus-yoghurt',
      productCode: '3001',
      name: 'Yoghurt',
      brand: 'Garant',
      storeId: '2110',
      storeName: 'Willys Odenplan',
      city: 'Stockholm',
      channel: 'store',
      isMemberPrice: true,
      isCouponPrice: false,
      isSubscriptionPrice: false,
      isClearance: false,
      multiBuy: { qualifyingCount: 2, label: '2 for' },
      campaignType: 'LOYALTY',
      promotionType: 'DISCOUNT',
      price: 25,
      priceText: '25:-',
      comparePriceText: '12:50/l',
      regularPriceText: '16:95',
      savePriceText: '',
      packageText: '1 l',
      conditionText: '2 for',
      redeemLimitText: 'Galler Willys Plus',
      startDate: '2026-05-25',
      endDate: '2026-05-31',
      validUntil: '2026-05-31T22:00:00.000Z',
      category: 'Mejeri',
      imageUrl: '',
      labels: [],
      sourceUrl: 'https://www.willys.se/search/campaigns/offline?q=2110',
      retrievedAt: RETRIEVED_AT
    };

    assert.deepEqual(promotionRouter(base), {
      kind: 'member_multi_buy',
      quantity: 2,
      totalPrice: 25,
      memberProgram: 'willys_plus',
      sourceText: '2 for · 25:- · Galler Willys Plus'
    });
  });
});
