import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  fetchApotekHjartatProducts,
  parseApotekHjartatProducts
} from '../apohem.js';

const fixtureUrl = new URL('../../../src/connectors/__tests__/fixtures/apotek-hjartat-search.html', import.meta.url);
const APOTEK_HJARTAT_FIXTURE = readFileSync(fixtureUrl, 'utf8');
const SOURCE_URL = 'https://www.apotekhjartat.se/search?q=la%20roche';
const RETRIEVED_AT = '2026-05-24T08:15:00.000Z';

describe('Apotek Hjärtat connector fixture', () => {
  it('parses recorded search HTML into public, non-prescription product rows', () => {
    const rows = parseApotekHjartatProducts(APOTEK_HJARTAT_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      chain: 'apotek-hjartat',
      code: 'hjartat-alvedon-20',
      ean: '7046260976108',
      name: 'Alvedon 500 mg 20 tabletter',
      brand: 'Alvedon',
      category: 'otc',
      price: 52.5,
      priceText: '52.50 SEK',
      originalPrice: 64.5,
      originalPriceText: '64.50 SEK',
      vatPercent: 12,
      stockStatus: 'buyable',
      productUrl: 'https://www.apotekhjartat.se/produkt/alvedon-500mg-20-tabletter/',
      imageUrl: 'https://www.apotekhjartat.se/assets/alvedon-hjartat.png',
      isOtc: true,
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(rows[1], {
      chain: 'apotek-hjartat',
      code: 'hjartat-lrp-spf50',
      ean: '3337875546430',
      name: 'La Roche-Posay Anthelios SPF50',
      brand: 'La Roche-Posay',
      category: 'beauty',
      price: 189,
      priceText: '189.00 SEK',
      originalPrice: null,
      originalPriceText: '',
      vatPercent: 25,
      stockStatus: 'out_of_stock',
      productUrl: 'https://www.apotekhjartat.se/produkt/la-roche-posay-anthelios/',
      imageUrl: 'https://images.apotekhjartat.se/lrp.png',
      isOtc: false,
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows.some((row) => row.code === 'hjartat-prescription'), false);
    assert.equal(rows.some((row) => row.code === 'hjartat-missing-ean'), false);
  });

  it('fetches a mocked Apotek Hjärtat page and preserves request provenance', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchApotekHjartatProducts({
      apotekHjartatUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(APOTEK_HJARTAT_FIXTURE, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' }
        });
      }
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows.map((row) => row.sourceUrl), [SOURCE_URL, SOURCE_URL]);
  });

  it('raises useful errors for failed HTTP and missing initial data', async () => {
    await assert.rejects(
      fetchApotekHjartatProducts({
        apotekHjartatUrls: [SOURCE_URL],
        fetchImpl: async () => new Response('blocked', { status: 503 })
      }),
      /Apotek Hjärtat request failed.*503/
    );

    assert.throws(
      () => parseApotekHjartatProducts('<html></html>', SOURCE_URL, RETRIEVED_AT),
      /window\.INITIAL_DATA/
    );
  });
});
