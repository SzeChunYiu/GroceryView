import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchKarmaSeSurplusDeals,
  KARMA_SE_SURPLUS_INFO_URL,
  normalizeKarmaSeSurplusDeal,
  parseKarmaSeSurplusDeals
} from '../karma-se.js';

const RETRIEVED_AT = '2026-05-25T12:15:00.000Z';
const SOURCE_URL = 'https://fixture.karma.life/se/surplus.json';

const KARMA_FIXTURE = {
  deals: [
    {
      id: 'karma-stockholm-bakery-1',
      title: 'Surprise bakery bag',
      merchant: { name: 'Gateau Stockholm' },
      category: 'bakery',
      price: '49 SEK',
      original_price: '98 SEK',
      quantity_available: 3,
      pickup_starts_at: '2026-05-25T15:00:00+02:00',
      pickup_ends_at: '2026-05-25T18:00:00+02:00',
      deep_link: 'karma://deal/karma-stockholm-bakery-1'
    },
    {
      uuid: 'karma-ica-liljeholmen-salad',
      name: 'Organic salad clearance',
      store_name: 'ICA Kvantum Liljeholmen',
      discount_price: 35,
      regular_price: 59,
      available_quantity: '4'
    },
    {
      id: 'missing-price',
      title: 'Malformed row',
      merchant_name: 'Unknown'
    }
  ]
};

describe('Karma SE surplus connector', () => {
  it('parses source-backed Swedish surplus deal rows with is_surplus=true', () => {
    const rows = parseKarmaSeSurplusDeals(KARMA_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'karma-se',
      retailerType: 'surplus_marketplace',
      is_surplus: true,
      code: 'karma-stockholm-bakery-1',
      name: 'Surprise bakery bag',
      merchantName: 'Gateau Stockholm',
      category: 'bakery',
      price: 49,
      originalPrice: 98,
      discountPercent: 50,
      quantityAvailable: 3,
      pickupStartsAt: '2026-05-25T13:00:00.000Z',
      pickupEndsAt: '2026-05-25T16:00:00.000Z',
      productUrl: 'karma://deal/karma-stockholm-bakery-1',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: {
        parserVersion: 'karma-se-surplus-v1',
        publicEvidenceUrl: KARMA_SE_SURPLUS_INFO_URL,
        appStoreEvidenceUrl: 'https://play.google.com/store/apps/details?id=com.karma.life'
      }
    });
    assert.equal(rows[1].is_surplus, true);
    assert.equal(rows[1].discountPercent, 41);
  });

  it('drops malformed rows instead of inventing surplus offers', () => {
    assert.deepEqual(normalizeKarmaSeSurplusDeal({ id: 'missing-name', price: 10 }, SOURCE_URL, RETRIEVED_AT), []);
    assert.deepEqual(normalizeKarmaSeSurplusDeal({ id: 'missing-price', title: 'Bag', merchant_name: 'Shop' }, SOURCE_URL, RETRIEVED_AT), []);
  });

  it('fetches fixture JSON with Karma-specific headers and blocked-source handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchKarmaSeSurplusDeals({
      fetchImpl: async (_url, init) => {
        headers.push(init?.headers ?? {});
        return Response.json(KARMA_FIXTURE);
      },
      maxRows: 1,
      retrievedAt: RETRIEVED_AT,
      sourceUrl: SOURCE_URL
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('karma-se-surplus-connector'), true);
    await assert.rejects(
      () => fetchKarmaSeSurplusDeals({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
