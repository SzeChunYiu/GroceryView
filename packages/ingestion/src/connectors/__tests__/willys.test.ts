import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWillysSearchUrl,
  fetchWillysProducts,
  fetchWillysWeeklyDiscounts
} from '../willys.js';

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

describe('Willys connector fixture parsing', () => {
  it('builds search URLs with query and optional store context', () => {
    const url = new URL(buildWillysSearchUrl('kaffe brygg', '2110'));

    assert.equal(url.origin + url.pathname, 'https://www.willys.se/search');
    assert.equal(url.searchParams.get('q'), 'kaffe brygg');
    assert.equal(url.searchParams.get('store'), '2110');
  });

  it('parses product search rows, skips malformed rows, and de-duplicates by product code', async () => {
    const requestedUrls: string[] = [];
    const fixture = {
      results: [
        {
          code: '101234567',
          name: 'Bryggkaffe Mellanrost',
          manufacturer: 'Garant',
          productLine2: '450 g',
          pickupProductLine2: 'ignored when productLine2 exists',
          googleAnalyticsCategory: 'Skafferi/Kaffe',
          priceValue: 49.9,
          price: '49:90',
          comparePrice: '110:89/kg',
          comparePriceUnit: 'kg',
          image: { url: 'https://assets.willys.se/images/101234567.jpg' },
          labels: ['Ekologisk', 7, 'Sverige'],
          online: true,
          outOfStock: false
        },
        {
          code: '101234567',
          name: 'Duplicate coffee',
          priceValue: 99
        },
        {
          code: 'missing-price',
          name: 'Malformed without price'
        }
      ]
    };
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrls.push(String(input));
      return jsonResponse(fixture);
    };

    const rows = await fetchWillysProducts({
      fetchImpl,
      queries: ['kaffe'],
      storeId: '2110',
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [buildWillysSearchUrl('kaffe', '2110')]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      code: '101234567',
      name: 'Bryggkaffe Mellanrost',
      brand: 'Garant',
      packageText: '450 g',
      category: 'Skafferi/Kaffe',
      price: 49.9,
      priceText: '49:90',
      unitPriceText: '110:89/kg',
      unitPriceUnit: 'kg',
      imageUrl: 'https://assets.willys.se/images/101234567.jpg',
      labels: ['Ekologisk', 'Sverige'],
      online: true,
      outOfStock: false,
      sourceUrl: buildWillysSearchUrl('kaffe', '2110'),
      retrievedAt: RETRIEVED_AT
    });
  });

  it('propagates non-OK product search responses with query context', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ message: 'rate limited' }, 429);

    await assert.rejects(
      fetchWillysProducts({ fetchImpl, queries: ['mjolk'], retrievedAt: RETRIEVED_AT }),
      /Willys search request failed for mjolk: 429/
    );
  });

  it('parses weekly discount fixtures with promotion edge cases and store scoping', async () => {
    const requestedUrls: string[] = [];
    const validUntil = 1_797_984_000_000;
    const fixture = {
      results: [
        {
          manufacturer: 'Arla',
          name: 'Mjölk 3%',
          priceNoUnit: '18:95',
          googleAnalyticsCategory: 'Mejeri/Mjölk',
          displayVolume: '1 l',
          image: { url: 'https://assets.willys.se/images/milk.jpg' },
          labels: ['Från Sverige'],
          potentialPromotions: [
            {
              code: 'promo-2110-1',
              mainProductCode: '2001',
              name: 'Mjölk 3% 1 l',
              brands: ['Arla Ko'],
              campaignType: 'WEEKLY',
              promotionType: 'DISCOUNT',
              price: 12.9,
              cartLabel: '12:90',
              rewardLabel: 'ignored when cartLabel exists',
              comparePrice: '12:90/l',
              savePrice: 'Spara 6:05',
              weightVolume: '1 liter',
              conditionLabel: 'Max 2 köp/hushåll',
              redeemLimitLabel: 'Gäller Willys Plus',
              startDate: '2026-05-25',
              endDate: '2026-05-31',
              validUntil
            },
            {
              code: 'malformed-without-price',
              mainProductCode: '2002',
              name: 'Missing price'
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

    const rows = await fetchWillysWeeklyDiscounts({
      fetchImpl,
      storeIds: ['2110'],
      pageSize: 25,
      maxRows: 25,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(requestedUrls.length, 1);
    assert.match(requestedUrls[0]!, /^https:\/\/www\.willys\.se\/search\/campaigns\/offline\?/);
    assert.equal(new URL(requestedUrls[0]!).searchParams.get('q'), '2110');
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      code: 'promo-2110-1',
      productCode: '2001',
      name: 'Mjölk 3% 1 l',
      brand: 'Arla Ko',
      storeId: '2110',
      storeName: '',
      city: '',
      campaignType: 'WEEKLY',
      promotionType: 'DISCOUNT',
      price: 12.9,
      priceText: '12:90',
      comparePriceText: '12:90/l',
      regularPriceText: '18:95',
      savePriceText: 'Spara 6:05',
      packageText: '1 liter',
      conditionText: 'Max 2 köp/hushåll',
      redeemLimitText: 'Gäller Willys Plus',
      startDate: '2026-05-25',
      endDate: '2026-05-31',
      validUntil: new Date(validUntil).toISOString(),
      category: 'Mejeri/Mjölk',
      imageUrl: 'https://assets.willys.se/images/milk.jpg',
      labels: ['Från Sverige'],
      sourceUrl: requestedUrls[0]!,
      retrievedAt: RETRIEVED_AT
    });
  });

  it('propagates non-OK weekly discount responses with store context', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ message: 'unavailable' }, 503);

    await assert.rejects(
      fetchWillysWeeklyDiscounts({ fetchImpl, storeIds: ['2110'], retrievedAt: RETRIEVED_AT }),
      /Willys weekly discounts request failed for 2110: 503/
    );
  });
});
