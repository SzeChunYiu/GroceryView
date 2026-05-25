import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ICA_REGION_ID,
  buildIcaStoreProductUrl,
  buildIcaStorePromotionsUrl,
  fetchIcaProducts,
  parseIcaStorePromotions
} from '../ica.js';

const RETRIEVED_AT = '2026-05-25T08:30:00.000Z';
const STORE_ACCOUNT_ID = '1004599';
const STORE_NAME = 'ICA Kvantum Kungsholmen';

const recordedIcaPromotionsFixture = {
  productGroups: [
    {
      type: 'Mejeri',
      name: 'Dairy fallback ignored when type exists',
      decoratedProducts: [
        {
          productId: 'prd-ica-yogurt-1kg',
          retailerProductId: '2033470',
          name: 'Turkisk Yoghurt 10%',
          brand: 'ICA',
          packSizeDescription: '1kg',
          countryOfOrigin: 'Sverige',
          price: { amount: 34.9, currency: 'SEK' },
          unitPrice: { price: { amount: 34.9, currency: 'SEK' }, unit: 'kr/kg' },
          promoPrice: { amount: 29.9, currency: 'SEK' },
          promoUnitPrice: { price: { amount: 29.9, currency: 'SEK' }, unit: 'kr/kg' },
          promotions: [{ description: 'Med ICA Stammis' }],
          image: { src: 'https://assets.icanet.se/t_product_large_v1,f_auto/7318690159115.jpg' }
        },
        {
          productId: 'prd-duplicate-yogurt',
          retailerProductId: '2033470',
          name: 'Duplicate should be ignored',
          price: { amount: 1, currency: 'SEK' }
        },
        {
          productId: 'prd-missing-name',
          retailerProductId: '2033471',
          price: { amount: 12, currency: 'SEK' }
        }
      ]
    },
    {
      name: 'Kött & chark',
      decoratedProducts: [
        {
          productId: 'prd-ica-loose-salmon',
          retailerProductId: '1500812',
          name: 'Färsk laxfilé manuell disk',
          brand: 'ICA Fisk',
          packSizeDescription: 'Lösvikt ca 500 g',
          countryOfOrigin: 'Norge',
          price: { amount: 149, currency: 'SEK' },
          unitPrice: { price: { amount: 299, currency: 'SEK' }, unit: 'kr/kg' },
          promotions: [],
          image: { src: 'https://assets.icanet.se/t_product_large_v1,f_auto/lax.jpg' }
        }
      ]
    },
    {
      type: 'Malformed',
      decoratedProducts: [{ productId: 'only-product-id' }, null, 'not-an-object']
    }
  ]
};

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

describe('ICA connector fixture parsing', () => {
  it('builds store promotion and product-detail URLs with store, region, and page-size context', () => {
    const url = new URL(buildIcaStorePromotionsUrl(STORE_ACCOUNT_ID, DEFAULT_ICA_REGION_ID, 42));

    assert.equal(url.origin + url.pathname, `https://handlaprivatkund.ica.se/stores/${STORE_ACCOUNT_ID}/api/product-listing-pages/v1/pages/promotions`);
    assert.equal(url.searchParams.get('regionId'), DEFAULT_ICA_REGION_ID);
    assert.equal(url.searchParams.get('includeAdditionalPageInfo'), 'true');
    assert.equal(url.searchParams.get('maxProductsToDecorate'), '42');
    assert.equal(url.searchParams.get('maxPageSize'), '42');
    assert.equal(
      buildIcaStoreProductUrl(STORE_ACCOUNT_ID, '2033470'),
      `https://handlaprivatkund.ica.se/stores/${STORE_ACCOUNT_ID}/products/2033470/details`
    );
  });

  it('mocks HTTP with a recorded promotions fixture and parses stable product rows', async () => {
    const requested: Array<{ url: string; headers: HeadersInit | undefined }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      requested.push({ url: String(input), headers: init?.headers });
      return jsonResponse(recordedIcaPromotionsFixture);
    };

    const rows = await fetchIcaProducts({
      fetchImpl,
      storeAccountId: STORE_ACCOUNT_ID,
      storeName: STORE_NAME,
      regionId: DEFAULT_ICA_REGION_ID,
      maxRows: 10,
      maxPageSize: 42,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requested, [{
      url: buildIcaStorePromotionsUrl(STORE_ACCOUNT_ID, DEFAULT_ICA_REGION_ID, 42),
      headers: {
        accept: 'application/json, text/plain, */*',
        referer: `https://handlaprivatkund.ica.se/stores/${STORE_ACCOUNT_ID}`,
        'client-route-id': 'PROMOTIONS',
        'ecom-request-source': 'web',
        'user-agent': 'GroceryView/0.1'
      }
    }]);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      code: '2033470',
      productId: 'prd-ica-yogurt-1kg',
      retailerProductId: '2033470',
      name: 'Turkisk Yoghurt 10%',
      brand: 'ICA',
      categories: ['Mejeri'],
      imageUrl: 'https://assets.icanet.se/t_product_large_v1,f_auto/7318690159115.jpg',
      productUrl: buildIcaStoreProductUrl(STORE_ACCOUNT_ID, '2033470'),
      packageSize: '1kg',
      countryOfOrigin: 'Sverige',
      price: 34.9,
      priceCurrency: 'SEK',
      unitPrice: 34.9,
      unitPriceCurrency: 'SEK',
      unitPriceUnit: 'kr/kg',
      promoPrice: 29.9,
      promoPriceCurrency: 'SEK',
      promoUnitPrice: 29.9,
      promoUnitPriceCurrency: 'SEK',
      promoUnitPriceUnit: 'kr/kg',
      promotionDescription: 'Med ICA Stammis',
      storeAccountId: STORE_ACCOUNT_ID,
      storeName: STORE_NAME,
      regionId: DEFAULT_ICA_REGION_ID,
      sourceUrl: requested[0]!.url,
      retrievedAt: RETRIEVED_AT
    });
  });

  it('covers parser edge cases: malformed payloads, duplicate products, max rows, and counter-price evidence', () => {
    const sourceUrl = buildIcaStorePromotionsUrl(STORE_ACCOUNT_ID, DEFAULT_ICA_REGION_ID, 2);
    const options = {
      sourceUrl,
      retrievedAt: RETRIEVED_AT,
      storeAccountId: STORE_ACCOUNT_ID,
      storeName: STORE_NAME,
      regionId: DEFAULT_ICA_REGION_ID
    };

    assert.deepEqual(parseIcaStorePromotions(null, options), []);
    assert.deepEqual(parseIcaStorePromotions({ productGroups: 'not an array' }, options), []);

    const rows = parseIcaStorePromotions(recordedIcaPromotionsFixture, { ...options, maxRows: 1 });
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.retailerProductId, '2033470');

    const allRows = parseIcaStorePromotions(recordedIcaPromotionsFixture, options);
    assert.deepEqual(allRows.map((row) => row.retailerProductId), ['2033470', '1500812']);
    assert.deepEqual(allRows[1], {
      code: '1500812',
      productId: 'prd-ica-loose-salmon',
      retailerProductId: '1500812',
      name: 'Färsk laxfilé manuell disk',
      brand: 'ICA Fisk',
      categories: ['Kött & chark'],
      imageUrl: 'https://assets.icanet.se/t_product_large_v1,f_auto/lax.jpg',
      productUrl: buildIcaStoreProductUrl(STORE_ACCOUNT_ID, '1500812'),
      packageSize: 'Lösvikt ca 500 g',
      countryOfOrigin: 'Norge',
      price: 149,
      priceCurrency: 'SEK',
      unitPrice: 299,
      unitPriceCurrency: 'SEK',
      unitPriceUnit: 'kr/kg',
      promoPrice: null,
      promoPriceCurrency: '',
      promoUnitPrice: null,
      promoUnitPriceCurrency: '',
      promoUnitPriceUnit: '',
      promotionDescription: '',
      soldByWeight: true,
      storeAccountId: STORE_ACCOUNT_ID,
      storeName: STORE_NAME,
      regionId: DEFAULT_ICA_REGION_ID,
      sourceUrl,
      retrievedAt: RETRIEVED_AT
    });
  });

  it('propagates non-OK promotion responses with store context', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ message: 'blocked' }, 503);

    await assert.rejects(
      fetchIcaProducts({ fetchImpl, storeAccountId: STORE_ACCOUNT_ID, retrievedAt: RETRIEVED_AT }),
      /ICA store promotions request failed for 1004599: 503/
    );
  });
});
