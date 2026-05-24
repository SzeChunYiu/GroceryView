import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHemkopSearchUrl,
  fetchHemkopProducts,
  fetchHemkopStores,
  fetchHemkopWeeklyDiscounts,
  normalizeHemkopProduct
} from '../hemkop.js';

const retrievedAt = '2026-05-24T00:00:00.000Z';

const productFixture = {
  results: [
    {
      code: '101010',
      name: 'Hemköp Mellanmjölk 1,5%',
      manufacturer: 'Hemköp',
      productLine2: '1 l',
      googleAnalyticsCategory: 'Mejeri/Mjölk',
      priceValue: 15.95,
      price: '15:95',
      comparePrice: '15:95 /l',
      comparePriceUnit: 'l',
      image: { url: 'https://assets.hemkop.se/mjolk.jpg' },
      labels: ['eko', 'svenskt'],
      online: true,
      outOfStock: false
    },
    {
      code: 'missing-price',
      name: 'Filtered row without priceValue'
    }
  ],
  pagination: { numberOfPages: 1, currentPage: 0 }
};

const storeFixture = [
  {
    storeId: '4003',
    name: 'Hemköp Stockholm City',
    address: {
      line1: 'Klarabergsgatan 50',
      town: 'Stockholm',
      postalCode: '111 21',
      country: { isocode: 'SE' }
    },
    geoPoint: { latitude: 59.331, longitude: 18.061 },
    onlineStore: true,
    clickAndCollect: true,
    flyerURL: 'https://www.hemkop.se/reklamblad'
  },
  {
    storeId: 'bad-store',
    name: 'Missing address'
  }
];

const weeklyDiscountFixture = {
  results: [
    {
      manufacturer: 'Garant',
      name: 'Garant Pasta',
      priceNoUnit: '24:95',
      googleAnalyticsCategory: 'Skafferi/Pasta',
      displayVolume: '500 g',
      image: { url: 'https://assets.hemkop.se/pasta.jpg' },
      labels: ['veckans'],
      potentialPromotions: [
        {
          code: 'promo-1',
          mainProductCode: 'pasta-1',
          name: 'Garant Pasta 500 g',
          brands: ['Garant'],
          campaignType: 'WEEKLY',
          promotionType: 'PRICE',
          price: 12.5,
          cartLabel: '12:50',
          comparePrice: '25:00 /kg',
          savePrice: 'Spara 12:45',
          weightVolume: '500 g',
          conditionLabel: 'Gäller denna vecka',
          redeemLimitLabel: 'Max 2 köp/hushåll',
          startDate: '2026-05-20',
          endDate: '2026-05-26',
          validUntil: 1779753600000
        },
        {
          code: 'missing-price',
          mainProductCode: 'pasta-2',
          name: 'Invalid promo'
        }
      ]
    }
  ],
  pagination: { numberOfPages: 1, currentPage: 0 }
};

describe('Hemköp connector fixture tests', () => {
  it('parses product rows from a recorded search fixture and filters unusable rows', async () => {
    const calls: string[] = [];
    const rows = await fetchHemkopProducts({
      queries: ['mjolk'],
      pageSize: 2,
      maxRows: 5,
      retrievedAt,
      fetchImpl: async (url) => {
        calls.push(String(url));
        return jsonResponse(productFixture);
      }
    });

    assert.equal(calls[0], buildHemkopSearchUrl('mjolk', 2, 0));
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      code: '101010',
      name: 'Hemköp Mellanmjölk 1,5%',
      brand: 'Hemköp',
      packageText: '1 l',
      category: 'Mejeri/Mjölk',
      price: 15.95,
      priceText: '15:95',
      unitPriceText: '15:95 /l',
      unitPriceUnit: 'l',
      imageUrl: 'https://assets.hemkop.se/mjolk.jpg',
      labels: ['eko', 'svenskt'],
      online: true,
      outOfStock: false,
      sourceUrl: buildHemkopSearchUrl('mjolk', 2, 0),
      retrievedAt
    });
  });

  it('parses stores and weekly campaign rows from recorded fixtures', async () => {
    const stores = await fetchHemkopStores({
      retrievedAt,
      fetchImpl: async () => jsonResponse(storeFixture)
    });
    assert.deepEqual(stores.map((store) => store.storeId), ['4003']);
    assert.equal(stores[0]?.latitude, 59.331);
    assert.equal(stores[0]?.onlineStore, true);

    const discounts = await fetchHemkopWeeklyDiscounts({
      storeIds: ['4003'],
      pageSize: 2,
      maxRows: 5,
      retrievedAt,
      fetchImpl: async () => jsonResponse(weeklyDiscountFixture)
    });
    assert.equal(discounts.length, 1);
    assert.equal(discounts[0]?.code, 'promo-1');
    assert.equal(discounts[0]?.storeId, '4003');
    assert.equal(discounts[0]?.price, 12.5);
    assert.equal(discounts[0]?.validUntil, '2026-05-26T00:00:00.000Z');
  });

  it('returns null for malformed product rows and surfaces HTTP failures', async () => {
    assert.equal(normalizeHemkopProduct({ code: 'x', name: 'No price' }, 'fixture://hemkop', retrievedAt), null);

    await assert.rejects(
      fetchHemkopProducts({
        queries: ['mjolk'],
        retrievedAt,
        fetchImpl: async () => new Response('blocked', { status: 503 })
      }),
      /Hemkop search request failed for mjolk: 503/
    );
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
}
