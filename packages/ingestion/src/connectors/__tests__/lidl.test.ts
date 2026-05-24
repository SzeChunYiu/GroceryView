import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLidlOffers, normalizeLidlOffer } from '../lidl.js';

const retrievedAt = '2026-05-24T10:00:00.000Z';

function gridFixture(payload: unknown) {
  return `<article data-grid-data="${JSON.stringify(payload).replace(/"/g, '&quot;')}"></article>`;
}

function response(body: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body
  };
}

describe('lidl connector fixture parsing', () => {
  it('parses recorded offer grid fixture rows into stable public offer shape', async () => {
    const fixture = gridFixture({
      productId: '100123',
      fullTitle: 'Ekologiska bananer',
      canonicalUrl: '/p/ekologiska-bananer/p100123',
      brand: { name: 'Lidl' },
      imageList_V1: [{ image: 'https://img.example/banana.jpg' }],
      regions: ['SE'],
      regionsPrices: {
        SE: {
          currentPrice: {
            price: 19.9,
            oldPrice: 24.9,
            currencyCode: 'SEK',
            basePrice: { text: '19,90 kr/kg' },
            packaging: { text: '1 kg' },
            startDate: '2026-05-20',
            endDate: '2026-05-26',
            discount: { discountText: 'Veckans frukt & grönt' }
          }
        }
      }
    });
    const seenUrls: string[] = [];
    const rows = await fetchLidlOffers({
      offerPaths: ['/fixture-offers'],
      retrievedAt,
      fetchImpl: (async (url: RequestInfo | URL) => {
        seenUrls.push(String(url));
        return response(fixture) as Response;
      }) as typeof fetch
    });

    assert.deepEqual(seenUrls, ['https://www.lidl.se/fixture-offers']);
    assert.deepEqual(rows, [{
      code: '100123',
      name: 'Ekologiska bananer',
      brand: 'Lidl',
      packageText: '1 kg',
      category: 'lidl-public-offers',
      price: 19.9,
      regularPrice: 24.9,
      priceText: '19.90 SEK',
      unitPriceText: '19,90 kr/kg',
      promotionText: 'Veckans frukt & grönt',
      memberOnly: false,
      regions: ['SE'],
      validFrom: '2026-05-20',
      validTo: '2026-05-26',
      productUrl: 'https://www.lidl.se/p/ekologiska-bananer/p100123',
      imageUrl: 'https://img.example/banana.jpg',
      sourceUrl: 'https://www.lidl.se/fixture-offers',
      retrievedAt
    }]);
  });

  it('handles malformed edge rows by skipping missing prices', () => {
    assert.equal(normalizeLidlOffer({ productId: 'missing-price', fullTitle: 'No price' }, 'https://www.lidl.se/fixture', retrievedAt), null);
  });

  it('surfaces HTTP errors from the mocked offer endpoint', async () => {
    await assert.rejects(
      () => fetchLidlOffers({
        offerPaths: ['/blocked'],
        fetchImpl: (async () => response('blocked', 503) as Response) as typeof fetch
      }),
      /Lidl offer page request failed for \/blocked: 503/
    );
  });
});
