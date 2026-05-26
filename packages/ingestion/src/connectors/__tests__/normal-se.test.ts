import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchNormalSeProducts,
  NORMAL_SE_PRODUCTS_URL,
  parseNormalSeProducts
} from '../normal-se.js';

const RETRIEVED_AT = '2026-05-25T17:30:00.000Z';

function normalSePage(products: unknown[]): string {
  return `<script>
    window.appData = {
      firstPage: {"content":{"blocks":[{"alias":"productsBlock","content":{"title":"Hudvard","products":${JSON.stringify(products)}}}]}},
      isPrerenderRequest: false
    };
  </script>`;
}

const PRODUCT_FIXTURE = [
  {
    product: {
      sku: '10012345',
      availabilityState: 'Default',
      image: { url: 'https://cdne-catalog-normal-prod.azureedge.net/catalog/packshot/serum.png' },
      pricePerUnit: '995 kr/l',
      displayName: 'Normal Beauty Serum 30 ml',
      brand: 'Normal Beauty',
      unitPrice: { value: 29, formatted: '29' },
      maxQuantityPerOrder: 3
    }
  },
  {
    product: {
      sku: '10012345',
      displayName: 'Duplicate Serum',
      unitPrice: { value: 39 }
    }
  },
  {
    product: {
      sku: '10099999',
      displayName: 'Missing price'
    }
  }
];

describe('Normal SE connector', () => {
  it('parses embedded Normal Sweden appData product rows', () => {
    const rows = parseNormalSeProducts(normalSePage(PRODUCT_FIXTURE), NORMAL_SE_PRODUCTS_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'SE',
      currency: 'SEK',
      chain: 'normal-se',
      retailerType: 'cosmetics',
      code: '10012345',
      name: 'Normal Beauty Serum 30 ml',
      brand: 'Normal Beauty',
      category: 'Hudvard',
      price: 29,
      priceText: '29 kr',
      pricePerUnit: '995 kr/l',
      available: true,
      maxQuantityPerOrder: 3,
      productUrl: 'https://www.normalstores.com/se/produkter/#sku-10012345',
      imageUrl: 'https://cdne-catalog-normal-prod.azureedge.net/catalog/packshot/serum.png',
      sourceUrl: NORMAL_SE_PRODUCTS_URL,
      retrievedAt: RETRIEVED_AT
    });
  });

  it('fetches, de-duplicates, caps rows, and handles blocked responses', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrls.push(String(input));
      return new Response(normalSePage(PRODUCT_FIXTURE));
    };

    const rows = await fetchNormalSeProducts({ fetchImpl, maxRows: 1, retrievedAt: RETRIEVED_AT });

    assert.deepEqual(requestedUrls, [NORMAL_SE_PRODUCTS_URL]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.code, '10012345');

    await assert.rejects(
      () => fetchNormalSeProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /Normal SE source blocked with HTTP 403\./
    );
  });
});
