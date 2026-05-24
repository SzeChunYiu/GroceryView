import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCoopSearchUrl,
  fetchCoopProducts,
  normalizeCoopProduct,
  type CoopProduct
} from '../coop.js';

const retrievedAt = '2026-05-24T10:15:00.000Z';
const sourceUrl = buildCoopSearchUrl('251300', 'desktop', 'v1', 'https://recorded.coop.example/personalization');

const recordedSearchFixture = {
  results: {
    count: 4,
    items: [
      {
        id: '7310865005168',
        ean: '7310865005168',
        name: 'Svenskt Smör Normalsaltat',
        manufacturerName: 'Arla',
        packageSizeInformation: '500 g',
        imageUrl: 'https://assets.coop.se/7310865005168.jpg',
        availableOnline: true,
        salesPriceData: { b2cPrice: 52.9 },
        comparativePriceData: { b2cPrice: 105.8 },
        comparativePriceText: 'kr/kg',
        navCategories: [
          {
            name: 'Smör & margarin',
            superCategories: [{ name: 'Mejeri' }, { name: 'Mat' }]
          }
        ],
        onlinePromotions: [
          {
            id: 'promo-123',
            message: 'Medlemspris 45:- /st',
            priceData: { b2cPrice: 45 },
            comparativePrice: { b2cPrice: 90 },
            medMeraRequired: true
          }
        ]
      },
      {
        id: '2317342100007',
        ean: '2317342100007',
        name: 'Mini vattenmelon',
        manufacturerName: '',
        packageSizeInformation: 'ca 1 kg',
        availableOnline: false,
        salesPriceData: { b2cPrice: '20' },
        comparativePriceText: 'kr/kg',
        navCategories: [{ name: 'Melon' }]
      },
      {
        id: '7310865005168',
        ean: '7310865005168',
        name: 'Svenskt Smör Normalsaltat duplicate',
        salesPriceData: { b2cPrice: 53.9 }
      },
      {
        id: 'missing-price',
        ean: 'missing-price',
        name: 'Missing price should be skipped'
      }
    ]
  }
} as const;

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    async json() {
      return body;
    }
  } as Response;
}

describe('coop connector fixture parsing', () => {
  it('parses recorded Coop search rows into the expected normalized product shape', async () => {
    const requests: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      requests.push({ input, init });
      return jsonResponse(recordedSearchFixture);
    };

    const rows = await fetchCoopProducts({
      fetchImpl: fetchImpl as typeof fetch,
      query: 'smör',
      maxRows: 10,
      storeId: '251300',
      personalizationApiUrl: 'https://recorded.coop.example/personalization',
      subscriptionKey: 'recorded-key',
      apiVersion: 'v1',
      retrievedAt
    });

    assert.equal(requests.length, 1);
    assert.equal(String(requests[0]!.input), sourceUrl);
    assert.equal(requests[0]!.init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[0]!.init?.body)), {
      query: 'smör',
      resultsOptions: { skip: 0, take: 10, sortBy: [], facets: [] },
      relatedResultsOptions: { skip: 0, take: 16 }
    });
    assert.equal((requests[0]!.init?.headers as Record<string, string>)['ocp-apim-subscription-key'], 'recorded-key');

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      code: '7310865005168',
      ean: '7310865005168',
      name: 'Svenskt Smör Normalsaltat',
      brand: 'Arla',
      packageText: '500 g',
      category: 'Smör & margarin',
      price: 52.9,
      priceText: '52.90 SEK',
      unitPrice: 105.8,
      unitPriceText: '105.80 kr/kg',
      unitPriceUnit: 'kr/kg',
      promotionText: 'Medlemspris 45:- /st',
      promotionPrice: 45,
      medMeraRequired: true,
      availableOnline: true,
      sourceUrl,
      productUrl: 'https://www.coop.se/handla/varor/mat/mejeri/smor-margarin/svenskt-smor-normalsaltat-7310865005168/',
      imageUrl: 'https://assets.coop.se/7310865005168.jpg',
      retrievedAt
    } satisfies CoopProduct);
    assert.equal(rows[1]!.code, '2317342100007');
    assert.equal(rows[1]!.unitPrice, null);
    assert.equal(rows[1]!.unitPriceText, '');
    assert.equal(rows[1]!.availableOnline, false);
  });

  it('covers edge cases by rejecting incomplete rows and falling back from id to ean', () => {
    assert.equal(normalizeCoopProduct({ id: 'no-price', name: 'No price' }, sourceUrl, retrievedAt), null);
    assert.equal(normalizeCoopProduct({ id: 'no-name', salesPriceData: { b2cPrice: 1 } }, sourceUrl, retrievedAt), null);

    const row = normalizeCoopProduct({
      ean: 'fallback-ean',
      name: 'Fallback EAN product',
      salesPriceData: { b2cPrice: '12.50' },
      comparativePriceData: { b2cPrice: '25.00' },
      comparativePriceText: 'kr/liter'
    }, sourceUrl, retrievedAt);

    assert.equal(row?.code, 'fallback-ean');
    assert.equal(row?.ean, 'fallback-ean');
    assert.equal(row?.price, 12.5);
    assert.equal(row?.unitPriceText, '25.00 kr/liter');
    assert.equal(row?.promotionPrice, null);
    assert.equal(row?.medMeraRequired, false);
  });

  it('surfaces Coop HTTP failures with status context', async () => {
    const fetchImpl = async (): Promise<Response> => jsonResponse({}, { ok: false, status: 503 });

    await assert.rejects(
      fetchCoopProducts({
        fetchImpl: fetchImpl as typeof fetch,
        subscriptionKey: 'recorded-key',
        personalizationApiUrl: 'https://recorded.coop.example/personalization'
      }),
      /Coop personalization search request failed: 503/
    );
  });
});
