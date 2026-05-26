import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cityGrossKlubbenOfferFromProduct,
  fetchCityGrossKlubbenOffers,
  CITY_GROSS_KLUBBEN_OFFERS_URL
} from '../citygross-klubben-offers-se.js';
import type { CityGrossProduct } from '../citygross.js';

const RETRIEVED_AT = '2026-05-25T12:55:00.000Z';

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

describe('City Gross Klubben offer connector', () => {
  it('emits only member rows with structured Klubben promotions', async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('PageData/stores')) {
        return jsonResponse([
          { data: { storeName: 'City Gross Hyllie', siteId: '3377', url: '/butiker/hyllie' } }
        ]);
      }
      return jsonResponse({
        items: [
          {
            id: 'cg-member-milk',
            gtin: '07318690012345',
            name: 'Arla Ko Mellanmjolk 1,5%',
            brand: 'Arla Ko',
            superCategory: 'Skafferiet',
            category: 'Mjolk',
            descriptiveSize: '1 l',
            url: '/produkt/arla-ko-mellanmjolk-1-5-1-l',
            images: [{ url: '/globalassets/product/mjolk.jpg' }],
            productStoreDetails: {
              p_has_members_only_price: true,
              prices: {
                currentPrice: { price: 12.9, comparativePrice: 12.9, comparativePriceUnit: 'l' },
                ordinaryPrice: { price: 17.9 },
                hasPromotion: true,
                activePromotion: {
                  from: '2026-05-25',
                  to: '2026-05-31',
                  minQuantity: 2,
                  priceDetails: { price: 12.9, comparativePrice: 12.9, comparativePriceUnit: 'l' }
                }
              }
            }
          },
          {
            id: 'cg-public-bread',
            name: 'Public bread',
            superCategory: 'Brod & Bageri',
            productStoreDetails: {
              p_has_members_only_price: false,
              prices: { currentPrice: { price: 25 } }
            }
          }
        ]
      });
    };

    const rows = await fetchCityGrossKlubbenOffers({
      fetchImpl,
      maxStores: 1,
      maxRowsPerStore: 10,
      pageSize: 10,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.channel, 'citygross_klubben');
    assert.equal(rows[0]?.sourceType, 'member_offer');
    assert.equal(rows[0]?.priceType, 'member');
    assert.equal(rows[0]?.scanRequired, true);
    assert.equal(rows[0]?.memberOfferUrl, CITY_GROSS_KLUBBEN_OFFERS_URL);
    assert.deepEqual(rows[0]?.structuredPromotion, {
      kind: 'member_multi_buy',
      quantity: 2,
      totalPrice: 12.9,
      memberProgram: 'city_gross_klubben',
      sourceText: '2 for 12.90 SEK · 2026-05-25-2026-05-31 · regular 17.90 SEK'
    });
  });

  it('routes single member prices when no minimum quantity is present', () => {
    const product: CityGrossProduct = {
      code: 'cg-member-coffee',
      gtin: '07318690067890',
      name: 'Bryggkaffe',
      brand: 'Zoegas',
      superCategory: 'Skafferiet',
      category: 'Kaffe',
      packageText: '450 g',
      storeId: '3377',
      price: 49.9,
      regularPrice: 69.9,
      unitPrice: 110.89,
      unitPriceUnit: 'kg',
      hasDiscount: true,
      hasPromotion: true,
      isCurrentWeekDiscount: true,
      isLongTimeDiscount: false,
      isMembersOnlyPrice: true,
      is_member_price: true,
      promotionFrom: '2026-05-25',
      promotionTo: '2026-05-31',
      promotionMinQuantity: null,
      promotionPrice: null,
      promotionUnitPrice: null,
      promotionUnitPriceUnit: '',
      priceText: '49.90 SEK',
      productUrl: 'https://www.citygross.se/produkt/bryggkaffe',
      imageUrl: '',
      sourceUrl: 'https://www.citygross.se/api/v1/Loop54/products?siteId=3377',
      retrievedAt: RETRIEVED_AT
    };

    assert.deepEqual(cityGrossKlubbenOfferFromProduct(product)?.structuredPromotion, {
      kind: 'member_price',
      price: 49.9,
      memberProgram: 'city_gross_klubben',
      sourceText: '2026-05-25-2026-05-31 · regular 69.90 SEK'
    });
  });
});
