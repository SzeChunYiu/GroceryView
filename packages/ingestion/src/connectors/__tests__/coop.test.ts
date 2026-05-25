import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCoopSearchUrl,
  fetchCoopProducts,
  normalizeCoopProduct,
  normalizeCoopProductPriceRows
} from '../coop.js';

const RETRIEVED_AT = '2026-05-25T11:30:00.000Z';
const PERSONALIZATION_API_URL = 'https://fixture.coop.test/personalization';
const SOURCE_URL = buildCoopSearchUrl('251300', 'desktop', 'v1', PERSONALIZATION_API_URL);

const RECORDED_COOP_FIXTURE = {
  results: {
    count: 5,
    items: [
      {
        id: '7340011455014',
        ean: '7340011455014',
        name: 'Arla Ko Mellanmjölk 1,5% 1 l',
        manufacturerName: 'Arla Ko',
        packageSizeInformation: '1 l',
        imageUrl: 'https://assets.coop.se/mellanmjolk.jpg',
        availableOnline: true,
        salesPriceData: { b2cPrice: 17.9 },
        comparativePriceData: { b2cPrice: 17.9 },
        comparativePriceText: 'kr/l',
        navCategories: [{ name: 'Mjölk', superCategories: [{ name: 'Mejeri' }] }],
        onlinePromotions: [
          {
            id: 'promo-milk',
            message: 'Medlemspris',
            priceData: { b2cPrice: 15.9 },
            medMeraRequired: true
          }
        ]
      },
      {
        id: '7340011455014',
        name: 'Duplicate milk row',
        salesPriceData: { b2cPrice: 99 }
      },
      {
        id: '2365029200001',
        ean: '2365029200001',
        name: 'Laxfilé bit',
        manufacturerName: 'Coop',
        packageSizeInformation: 'ca 500 g',
        salesPriceData: { b2cPrice: 149 },
        comparativePriceData: { b2cPrice: 298 },
        comparativePriceText: 'kr/kg',
        navCategories: [{ name: 'Fisk', superCategories: [{ name: 'Kött, fisk & fågel' }] }]
      },
      {
        id: 'missing-price',
        name: 'Malformed without price'
      },
      {
        id: 'missing-name',
        salesPriceData: { b2cPrice: 10 }
      }
    ]
  }
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

describe('Coop connector fixture parsing', () => {
  it('parses a recorded personalization fixture into normalized Coop product rows', async () => {
    const requestedUrls: string[] = [];
    const requestedBodies: unknown[] = [];

    const rows = await fetchCoopProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedBodies.push(JSON.parse(String(init?.body ?? '{}')));
        return jsonResponse(RECORDED_COOP_FIXTURE);
      },
      maxRows: 10,
      personalizationApiUrl: PERSONALIZATION_API_URL,
      query: 'mjölk',
      retrievedAt: RETRIEVED_AT,
      storeId: '251300',
      subscriptionKey: 'fixture-key'
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.deepEqual(requestedBodies[0], {
      query: 'mjölk',
      resultsOptions: { skip: 0, take: 10, sortBy: [], facets: [] },
      relatedResultsOptions: { skip: 0, take: 16 }
    });
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      code: '7340011455014',
      ean: '7340011455014',
      name: 'Arla Ko Mellanmjölk 1,5% 1 l',
      brand: 'Arla Ko',
      packageText: '1 l',
      category: 'Mjölk',
      price: 17.9,
      priceText: '17.90 SEK',
      unitPrice: 17.9,
      unitPriceText: '17.90 kr/l',
      unitPriceUnit: 'kr/l',
      promotionText: 'Medlemspris',
      promotionPrice: 15.9,
      medMeraRequired: false,
      is_member_price: false,
      availableOnline: true,
      sourceUrl: SOURCE_URL,
      productUrl: 'https://www.coop.se/handla/varor/mejeri/mjolk/arla-ko-mellanmjolk-1-5-1-l-7340011455014/',
      imageUrl: 'https://assets.coop.se/mellanmjolk.jpg',
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(rows[1], {
      ...rows[0]!,
      code: '7340011455014:member',
      price: 15.9,
      priceText: '15.90 SEK',
      promotionPrice: 15.9,
      medMeraRequired: true,
      is_member_price: true,
      listPrice: 17.9
    });
    assert.equal(rows[2]?.soldByWeight, true);
    assert.deepEqual(rows.map((row) => row.code), ['7340011455014', '7340011455014:member', '2365029200001']);
  });

  it('normalizes edge cases without emitting malformed product rows', () => {
    assert.equal(normalizeCoopProduct({ id: 'missing-price', name: 'No price' }, SOURCE_URL, RETRIEVED_AT), null);
    assert.equal(normalizeCoopProduct({ id: 'missing-name', salesPriceData: { b2cPrice: 10 } }, SOURCE_URL, RETRIEVED_AT), null);
    assert.equal(
      normalizeCoopProduct({ id: 'string-price', name: 'String price', salesPriceData: { b2cPrice: '12.50' } }, SOURCE_URL, RETRIEVED_AT)?.price,
      12.5
    );
    assert.deepEqual(
      normalizeCoopProductPriceRows({
        id: 'member-cheese',
        name: 'Member cheese',
        salesPriceData: { b2cPrice: 79 },
        onlinePromotions: [{ message: 'Medlemspris', priceData: { b2cPrice: 59 }, medMeraRequired: true }]
      }, SOURCE_URL, RETRIEVED_AT).map((row) => ({ code: row.code, price: row.price, is_member_price: row.is_member_price, memberOnly: row.medMeraRequired })),
      [
        { code: 'member-cheese', price: 79, is_member_price: false, memberOnly: false },
        { code: 'member-cheese:member', price: 59, is_member_price: true, memberOnly: true }
      ]
    );
  });

  it('propagates non-OK fixture responses with search context', async () => {
    await assert.rejects(
      () =>
        fetchCoopProducts({
          fetchImpl: async () => jsonResponse({ message: 'blocked' }, 503),
          personalizationApiUrl: PERSONALIZATION_API_URL,
          query: 'kaffe',
          subscriptionKey: 'fixture-key'
        }),
      /Coop personalization search request failed: 503/
    );
  });
});
