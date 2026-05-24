import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchIcaProducts, parseIcaStorePromotions } from '../ica.js';

const recordedFixture = {
  productGroups: [{
    type: 'promotions',
    decoratedProducts: [{
      productId: 'prod-001',
      retailerProductId: '2383471000006',
      name: 'ICA Smör 500g',
      brand: 'ICA',
      price: { amount: 54.9, currency: 'SEK' },
      unitPrice: { price: { amount: 109.8, currency: 'SEK' }, unit: 'kg' },
      promoPrice: { amount: 45, currency: 'SEK' },
      promoUnitPrice: { price: { amount: 90, currency: 'SEK' }, unit: 'kg' },
      promotions: [{ description: 'Veckans pris' }],
      image: { src: 'https://assets.ica.se/smor.png' },
      packSizeDescription: '500 g',
      countryOfOrigin: 'Sverige'
    }, {
      productId: 'prod-duplicate',
      retailerProductId: '2383471000006',
      name: 'Duplicate should be ignored'
    }, {
      productId: 'missing-name',
      retailerProductId: 'missing-name'
    }]
  }]
};

const parseOptions = {
  sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions',
  retrievedAt: '2026-05-24T10:00:00.000Z',
  storeAccountId: '1004599',
  storeName: 'ICA Testbutik',
  regionId: 'region-1'
};

describe('ICA connector fixture parsing', () => {
  it('parses the recorded promotion fixture into the expected row shape', () => {
    const rows = parseIcaStorePromotions(recordedFixture, parseOptions);

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0] && {
      code: rows[0].code,
      productId: rows[0].productId,
      name: rows[0].name,
      brand: rows[0].brand,
      category: rows[0].categories[0],
      price: rows[0].price,
      unitPrice: rows[0].unitPrice,
      promoPrice: rows[0].promoPrice,
      promotionDescription: rows[0].promotionDescription,
      storeAccountId: rows[0].storeAccountId,
      sourceUrl: rows[0].sourceUrl
    }, {
      code: '2383471000006',
      productId: 'prod-001',
      name: 'ICA Smör 500g',
      brand: 'ICA',
      category: 'promotions',
      price: 54.9,
      unitPrice: 109.8,
      promoPrice: 45,
      promotionDescription: 'Veckans pris',
      storeAccountId: '1004599',
      sourceUrl: parseOptions.sourceUrl
    });
  });

  it('handles edge cases by skipping duplicates, invalid rows, and honoring maxRows', () => {
    const rows = parseIcaStorePromotions(recordedFixture, { ...parseOptions, maxRows: 1 });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.retailerProductId, '2383471000006');
    assert.equal(parseIcaStorePromotions(null, parseOptions).length, 0);
  });

  it('mocks HTTP fetches and throws on upstream errors', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchIcaProducts({
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(JSON.stringify(recordedFixture), {
          headers: { 'content-type': 'application/json' },
          status: 200
        });
      },
      retrievedAt: parseOptions.retrievedAt,
      storeAccountId: parseOptions.storeAccountId,
      storeName: parseOptions.storeName,
      regionId: parseOptions.regionId,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.match(requestedUrls[0] ?? '', /\/stores\/1004599\/api\/product-listing-pages\/v1\/pages\/promotions/);

    await assert.rejects(
      fetchIcaProducts({
        fetchImpl: async () => new Response('service unavailable', { status: 503 }),
        storeAccountId: parseOptions.storeAccountId,
        storeName: parseOptions.storeName,
        regionId: parseOptions.regionId
      }),
      /ICA store promotions request failed for 1004599: 503/
    );
  });
});
