import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildWillysSearchUrl, fetchWillysProducts, normalizeWillysProduct } from '../willys.js';

const retrievedAt = '2026-05-24T16:00:00.000Z';
const sourceUrl = buildWillysSearchUrl('kaffe');
const recordedFixture = {
  code: '101234567_ST',
  name: 'Zoégas Skånerost Bryggkaffe 450g',
  manufacturer: 'Zoégas',
  productLine2: '450 g',
  googleAnalyticsCategory: 'Dryck/Kaffe/Bryggkaffe',
  priceValue: 48.9,
  price: '48,90 kr',
  comparePrice: '108,67 kr/kg',
  comparePriceUnit: 'kr/kg',
  image: { url: 'https://assets.willys.se/101234567.jpg' },
  labels: ['Jämförpris'],
  online: true,
  outOfStock: false
};

describe('Willys connector', () => {
  it('parses recorded fixture row shape', () => {
    const row = normalizeWillysProduct(recordedFixture, sourceUrl, retrievedAt);

    assert.deepEqual(row, {
      code: '101234567_ST',
      name: 'Zoégas Skånerost Bryggkaffe 450g',
      brand: 'Zoégas',
      packageText: '450 g',
      category: 'Dryck/Kaffe/Bryggkaffe',
      price: 48.9,
      priceText: '48,90 kr',
      unitPriceText: '108,67 kr/kg',
      unitPriceUnit: 'kr/kg',
      imageUrl: 'https://assets.willys.se/101234567.jpg',
      labels: ['Jämförpris'],
      online: true,
      outOfStock: false,
      sourceUrl,
      retrievedAt
    });
  });

  it('drops edge-case rows without required code/name/price', () => {
    assert.equal(normalizeWillysProduct({ ...recordedFixture, code: '' }, sourceUrl, retrievedAt), null);
    assert.equal(normalizeWillysProduct({ ...recordedFixture, name: '' }, sourceUrl, retrievedAt), null);
    assert.equal(normalizeWillysProduct({ ...recordedFixture, priceValue: null }, sourceUrl, retrievedAt), null);
  });

  it('surfaces HTTP errors from mocked search requests', async () => {
    const fetchImpl: typeof fetch = async () => new Response('rate limited', { status: 429 });

    await assert.rejects(
      () => fetchWillysProducts({ fetchImpl, queries: ['kaffe'], retrievedAt }),
      /Willys search request failed for kaffe: 429/
    );
  });
});
