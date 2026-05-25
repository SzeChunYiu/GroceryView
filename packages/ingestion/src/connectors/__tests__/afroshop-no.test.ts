import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AFROSHOP_NO_CHAIN_STATUS,
  AFROSHOP_NO_MAMABRIDGET_PRODUCTS_URL,
  fetchAfroshopNoProducts,
  parseAfroshopNoProducts,
  verifyAfroshopNoChainStatus
} from '../afroshop-no.js';

const RETRIEVED_AT = '2026-05-25T11:50:00.000Z';
const SHOPIFY_FIXTURE = {
  products: [{
    id: 15135048597883,
    handle: 'mama-bridget-white-garri-5kg',
    title: 'Mama Bridget White Garri 5kg',
    vendor: 'Mama Bridget',
    product_type: 'Food Cupboard',
    tags: 'garri, cassava, Nigerian food',
    images: [{ src: 'https://mamabridget.com/cdn/shop/files/garri.jpg' }],
    variants: [{
      id: 49124681961787,
      sku: 'MB-GARRI-WHITE-5KG',
      title: 'Default Title',
      price: '179.00',
      compare_at_price: '199.00',
      available: true
    }]
  }, {
    handle: 'afro-hair-cream',
    title: 'African Beauty Cream',
    vendor: 'Africa Best',
    product_type: '',
    tags: ['beauty'],
    variants: [{ id: 49124681961788, price: '89,50', available: false }]
  }]
};

describe('AfroShop NO connector', () => {
  it('documents verified chain status without inventing a Norway-wide AfroShop chain', () => {
    const status = verifyAfroshopNoChainStatus();

    assert.equal(status, AFROSHOP_NO_CHAIN_STATUS);
    assert.equal(status.chainId, 'mamabridget-no');
    assert.equal(status.status, 'verified_single_store_with_online_delivery');
    assert.equal(status.retailerType, 'ethnic_african');
    assert.equal(status.qualifiesForNationalChain, false);
    assert.equal(status.qualifiesForOnlineConnector, true);
    assert.match(status.caveat, /No source-backed evidence/);
    assert.equal(status.evidence.some((entry) => entry.city === 'Oslo'), true);
    assert.equal(status.evidence.some((entry) => entry.city === 'Bergen'), true);
  });

  it('parses Mama Bridget Shopify product rows as source-backed Norwegian Afro-Caribbean grocery items', () => {
    const rows = parseAfroshopNoProducts(SHOPIFY_FIXTURE, AFROSHOP_NO_MAMABRIDGET_PRODUCTS_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'mamabridget-no',
      retailerType: 'ethnic_african',
      code: 'MB-GARRI-WHITE-5KG',
      name: 'Mama Bridget White Garri 5kg',
      brand: 'Mama Bridget',
      category: 'Food Cupboard',
      tags: ['garri', 'cassava', 'Nigerian food'],
      price: 179,
      priceText: '179.00 NOK',
      compareAtPrice: 199,
      available: true,
      productUrl: 'https://mamabridget.com/products/mama-bridget-white-garri-5kg',
      imageUrl: 'https://mamabridget.com/cdn/shop/files/garri.jpg',
      sourceUrl: AFROSHOP_NO_MAMABRIDGET_PRODUCTS_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1].category, 'afro-caribbean-specialty');
    assert.equal(rows[1].available, false);
    assert.equal(rows[1].price, 89.5);
  });

  it('fetches with source-specific headers, maxRows, and fail-closed blocked response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchAfroshopNoProducts({
      fetchImpl: async (_url, init) => {
        headers.push(init?.headers ?? {});
        return Response.json(SHOPIFY_FIXTURE);
      },
      maxRows: 1,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('afroshop-no-connector'), true);
    await assert.rejects(
      () => fetchAfroshopNoProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
