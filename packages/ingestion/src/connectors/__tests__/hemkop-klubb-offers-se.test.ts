import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchHemkopKlubbOffers,
  HEMKOP_KLUBB_OFFERS_URL,
  hemkopKlubbOfferFromDiscount,
  promotionRouter
} from '../hemkop-klubb-offers-se.js';
import type { HemkopWeeklyDiscount } from '../hemkop.js';

const RETRIEVED_AT = '2026-05-25T17:40:00.000Z';

function discount(overrides: Partial<HemkopWeeklyDiscount> = {}): HemkopWeeklyDiscount {
  return {
    code: 'hemkop-klubb-coffee',
    productCode: 'hemkop-coffee',
    name: 'Zoegas Skånerost',
    brand: 'Zoegas',
    storeId: '4003',
    storeName: 'Hemköp Göteborg Masthuggstorget',
    city: 'Göteborg',
    channel: 'store',
    isMemberPrice: true,
    isCouponPrice: false,
    isSubscriptionPrice: false,
    isClearance: false,
    multiBuy: null,
    campaignType: 'PERSONAL_GENERAL',
    promotionType: 'DISCOUNT',
    price: 49.9,
    priceText: '49,90 kr',
    comparePriceText: '110,89 kr/kg',
    regularPriceText: '69,90 kr',
    savePriceText: 'Spara 20 kr',
    packageText: '450 g',
    conditionText: 'Hemköp Klubb medlemspris',
    redeemLimitText: '',
    startDate: '2026-05-25',
    endDate: '2026-05-31',
    validUntil: '2026-05-31T21:59:59.000Z',
    category: 'Kaffe',
    imageUrl: 'https://www.hemkop.se/images/coffee.jpg',
    labels: ['Medlemspris'],
    sourceUrl: 'https://www.hemkop.se/search/campaigns/offline?q=4003&type=PERSONAL_GENERAL&page=0&size=10',
    retrievedAt: RETRIEVED_AT,
    ...overrides
  };
}

describe('Hemkop Klubb offer connector', () => {
  it('emits Hemköp Klubb member rows with structured single-price promotions', () => {
    const offer = hemkopKlubbOfferFromDiscount(discount());

    assert.equal(offer?.channel, 'hemkop_klubb');
    assert.equal(offer?.sourceType, 'member_offer');
    assert.equal(offer?.priceType, 'member');
    assert.equal(offer?.scanRequired, true);
    assert.equal(offer?.memberOfferUrl, HEMKOP_KLUBB_OFFERS_URL);
    assert.deepEqual(offer?.structuredPromotion, {
      kind: 'member_price',
      price: 49.9,
      memberProgram: 'hemkop_klubb',
      sourceText: 'Hemköp Klubb medlemspris · 49,90 kr · Spara 20 kr · Medlemspris'
    });
  });

  it('routes Klubb multi-buy copy through promotionRouter', () => {
    assert.deepEqual(promotionRouter(discount({
      price: 35,
      priceText: '2 för 35 kr',
      conditionText: 'Klubbpris 2 för 35 kr',
      labels: ['Hemköp Klubb']
    })), {
      kind: 'member_multi_buy',
      quantity: 2,
      totalPrice: 35,
      memberProgram: 'hemkop_klubb',
      sourceText: 'Klubbpris 2 för 35 kr · 2 för 35 kr · Spara 20 kr · Hemköp Klubb'
    });
  });

  it('fetches weekly campaign rows and keeps only Klubb/member offers', async () => {
    const rows = await fetchHemkopKlubbOffers({
      storeIds: ['4003'],
      pageSize: 10,
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async () => new Response(JSON.stringify({
        results: [
          {
            manufacturer: 'Zoegas',
            name: 'Zoegas Skånerost',
            priceNoUnit: '69,90 kr',
            googleAnalyticsCategory: 'Kaffe',
            displayVolume: '450 g',
            image: { url: 'https://www.hemkop.se/images/coffee.jpg' },
            labels: ['Medlemspris'],
            potentialPromotions: [{
              code: 'hemkop-klubb-coffee',
              mainProductCode: 'hemkop-coffee',
              name: 'Zoegas Skånerost',
              brands: ['Zoegas'],
              campaignType: 'PERSONAL_GENERAL',
              promotionType: 'DISCOUNT',
              price: 49.9,
              cartLabel: '49,90 kr',
              comparePrice: '110,89 kr/kg',
              savePrice: 'Spara 20 kr',
              weightVolume: '450 g',
              conditionLabel: 'Hemköp Klubb medlemspris',
              redeemLimitLabel: '',
              startDate: '2026-05-25',
              endDate: '2026-05-31',
              validUntil: Date.parse('2026-05-31T21:59:59.000Z')
            }]
          },
          {
            name: 'Public bread',
            potentialPromotions: [{
              code: 'public-bread',
              mainProductCode: 'bread',
              name: 'Public bread',
              promotionType: 'DISCOUNT',
              price: 25,
              cartLabel: '25 kr'
            }]
          }
        ],
        pagination: { numberOfPages: 1, currentPage: 0 }
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.code, 'hemkop-klubb-coffee');
    assert.equal(rows[0]?.structuredPromotion.kind, 'member_price');
  });
});
