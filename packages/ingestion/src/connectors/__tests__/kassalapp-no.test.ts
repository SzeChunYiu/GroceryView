import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildKassalappPricesBulkUrl,
  buildKassalappProductsUrl,
  fetchKassalappNoCatalog,
  KASSALAPP_API_TERMS_URL,
  parseKassalappNoPriceHistory,
  parseKassalappNoProducts,
  type KassalappNoSourceAttribution
} from '../kassalapp-no.js';

const RETRIEVED_AT = '2026-05-25T12:00:00.000Z';

type MockResponse = {
  ok: boolean;
  status: number;
  headers: Headers;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

function jsonResponse(payload: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => payload,
    text: async () => JSON.stringify(payload)
  } as MockResponse as Response;
}

function source(sourceUrl = buildKassalappProductsUrl({ search: 'pepsi', page: 1, size: 100 })): KassalappNoSourceAttribution {
  return {
    sourceType: 'official_api',
    provider: 'Kassalapp',
    market: 'NO',
    baseUrl: 'https://kassal.app',
    sourceUrl,
    endpoint: '/api/v1/products',
    retrievedAt: RETRIEVED_AT,
    apiTermsUrl: KASSALAPP_API_TERMS_URL,
    termsAccepted: true,
    commercialUseAllowed: false,
    rateLimit: {
      plan: 'hobby',
      requestsPerMinute: 60,
      observedRemaining: 58,
      observedResetAt: null
    }
  };
}

describe('Kassalapp Norway API adapter', () => {
  it('builds documented product and price-history endpoints', () => {
    const productsUrl = new URL(buildKassalappProductsUrl({
      search: 'grandiosa pizza',
      page: 2,
      size: 250,
      unique: true,
      excludeWithoutEan: true
    }));

    assert.equal(productsUrl.origin + productsUrl.pathname, 'https://kassal.app/api/v1/products');
    assert.equal(productsUrl.searchParams.get('search'), 'grandiosa pizza');
    assert.equal(productsUrl.searchParams.get('page'), '2');
    assert.equal(productsUrl.searchParams.get('size'), '100');
    assert.equal(productsUrl.searchParams.get('unique'), 'true');
    assert.equal(productsUrl.searchParams.get('exclude_without_ean'), 'true');
    assert.equal(buildKassalappPricesBulkUrl(), 'https://kassal.app/api/v1/products/prices-bulk');
  });

  it('normalizes products, prices, nutrition, images, history, and source attribution from fixtures', () => {
    const rows = parseKassalappNoProducts({
      data: [
        {
          id: 1,
          name: 'Pepsi Max 1,5lx4 flaske',
          brand: 'Pepsi',
          vendor: 'Ringnes as',
          ean: '7044618874687',
          url: 'https://spar.no/nettbutikk/varer/drikke/brus/pepsi-max-7044618874687',
          image: 'https://bilder.ngdata.no/7044618874687/kmh/large.jpg',
          description: 'Cola uten sukker',
          ingredients: 'Kullsyreholdig vann',
          current_price: 89.9,
          current_unit_price: 14.98,
          weight: 6000,
          weight_unit: 'ml',
          store: { name: 'SPAR', code: 'SPAR_NO' },
          price_history: [{ price: 89.9, date: '2023-09-06T00:56:48.000000Z' }],
          allergens: [{ code: 'melk', display_name: 'Melk', contains: 'NO' }],
          nutrition: [{ code: 'energi_kcal', display_name: 'Kalorier', amount: 0.3, unit: 'kcal' }],
          created_at: '2023-09-07T02:51:38.000000Z',
          updated_at: '2023-09-07T02:51:38.000000Z'
        },
        { id: null, name: 'malformed' }
      ]
    }, source());

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      sourceProductId: '1',
      name: 'Pepsi Max 1,5lx4 flaske',
      brand: 'Pepsi',
      vendor: 'Ringnes as',
      ean: '7044618874687',
      productUrl: 'https://spar.no/nettbutikk/varer/drikke/brus/pepsi-max-7044618874687',
      imageUrl: 'https://bilder.ngdata.no/7044618874687/kmh/large.jpg',
      description: 'Cola uten sukker',
      ingredients: 'Kullsyreholdig vann',
      currentPrice: 89.9,
      currentUnitPrice: 14.98,
      weight: 6000,
      weightUnit: 'ml',
      storeCode: 'SPAR_NO',
      storeName: 'SPAR',
      priceHistory: [{
        price: 89.9,
        date: '2023-09-06T00:56:48.000000Z',
        storeCode: 'SPAR_NO',
        storeName: 'SPAR',
        source: source()
      }],
      nutrition: [{ code: 'energi_kcal', displayName: 'Kalorier', amount: 0.3, unit: 'kcal' }],
      allergens: [{ code: 'melk', displayName: 'Melk', contains: 'NO' }],
      createdAt: '2023-09-07T02:51:38.000000Z',
      updatedAt: '2023-09-07T02:51:38.000000Z',
      source: source()
    });
  });

  it('normalizes bulk price history with store names and endpoint attribution', () => {
    const bulkSource = source(buildKassalappPricesBulkUrl());
    const history = parseKassalappNoPriceHistory({
      data: [{
        ean: '7039010019828',
        stores: [{ store: 'MENY_NO', name: 'Meny' }],
        price_history: [{ price: 72.9, date: '2024-08-07T17:55:24.000000Z', store: 'MENY_NO' }]
      }]
    }, bulkSource);

    assert.deepEqual(history, [{
      price: 72.9,
      date: '2024-08-07T17:55:24.000000Z',
      storeCode: 'MENY_NO',
      storeName: 'Meny',
      source: bulkSource
    }]);
  });

  it('fails closed when credentials or terms are missing', async () => {
    await assert.rejects(
      fetchKassalappNoCatalog({ apiKey: '', termsAccepted: true, queries: ['melk'] }),
      /KASSALAPP_API_KEY/
    );
    await assert.rejects(
      fetchKassalappNoCatalog({ apiKey: 'test-key', termsAccepted: false, queries: ['melk'] }),
      /terms are explicitly accepted/
    );
  });

  it('fetches product pages and optional bulk history with API key headers and rate metadata', async () => {
    const requested: Array<{ url: string; method: string; body?: string | null; authorization?: string | null }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      requested.push({
        url,
        method: init?.method ?? 'GET',
        body: init?.body?.toString() ?? null,
        authorization: headers.get('authorization')
      });
      if (url.endsWith('/prices-bulk')) {
        return jsonResponse({
          data: [{
            ean: '7044618874687',
            stores: [{ store: 'SPAR_NO', name: 'SPAR' }],
            price_history: [{ price: 88.9, date: '2024-08-07T17:55:24.000000Z', store: 'SPAR_NO' }]
          }]
        }, 200, { 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '57' });
      }
      return jsonResponse({
        data: [{
          id: 1,
          name: 'Pepsi Max 1,5lx4 flaske',
          ean: '7044618874687',
          current_price: 89.9,
          store: { name: 'SPAR', code: 'SPAR_NO' }
        }]
      }, 200, { 'x-ratelimit-limit': '60', 'x-ratelimit-remaining': '58' });
    };

    const catalog = await fetchKassalappNoCatalog({
      fetchImpl,
      apiKey: 'test-key',
      termsAccepted: true,
      commercialUseAllowed: false,
      queries: ['pepsi'],
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(requested.length, 2);
    assert.equal(requested[0]?.authorization, 'Bearer test-key');
    assert.equal(requested[1]?.method, 'POST');
    assert.match(requested[1]?.body ?? '', /7044618874687/);
    assert.equal(catalog.products.length, 1);
    assert.equal(catalog.priceHistory[0]?.price, 88.9);
    assert.equal(catalog.source.rateLimit.requestsPerMinute, 60);
    assert.equal(catalog.source.rateLimit.observedRemaining, 57);
    assert.equal(catalog.source.termsAccepted, true);
  });
});
