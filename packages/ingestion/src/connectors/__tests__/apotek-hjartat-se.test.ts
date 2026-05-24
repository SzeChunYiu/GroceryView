import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchApotekHjartatProducts, normalizeApotekHjartatProduct, parseApotekHjartatProducts } from '../apohem.js';

const fixtureData = {
  search: {
    hits: [
      {
        url: '/produkt/cetirizin-hjartat-10mg-10-tabletter/',
        productName: 'Cetirizin Hjärtat 10mg 10 tabletter',
        sku: 'AH-1001',
        gtin: '07350000001001',
        price: { current: { inclVat: '39.90', vatPercent: 12 } },
        storePrice: '49.90',
        images: [{ url: '/images/cetirizin.png' }],
        variant: { stockStatus: 'InStock' },
        brands: [{ title: 'Apotek Hjärtat' }],
        isBuyableWithoutPrescription: true,
        belongsToPrescriptionProductGroup: false,
        isOtcMedicine: true,
        trackingProductInformation: {
          brand: 'Apotek Hjärtat',
          category: 'Receptfritt',
          stockStatus: 'InStock'
        }
      },
      {
        url: 'https://www.apotekhjartat.se/produkt/d-vitamin-hjartat-100-tabletter/',
        productName: 'D-vitamin Hjärtat 100 tabletter',
        sku: 'AH-1002',
        gtin: '07350000001018',
        price: { current: { inclVat: 79, vatPercent: 12 } },
        swatchImage: { url: '/images/vitamin.png' },
        brands: [{ name: 'Hjärtat' }],
        isBuyableWithoutPrescription: true,
        isDietarySupplement: true,
        trackingProductInformation: {
          category: 'Vitaminer',
          ean: '07350000001018',
          stockStatus: 'BackOrder'
        }
      },
      {
        productName: 'Prescription only row',
        sku: 'AH-RX',
        gtin: '07350000001025',
        price: { current: { inclVat: 10 } },
        belongsToPrescriptionProductGroup: true
      },
      {
        productName: 'Missing price row',
        sku: 'AH-MISSING',
        gtin: '07350000001032'
      }
    ]
  }
};

function recordedFixture(data = fixtureData) {
  const escaped = JSON.stringify(data).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `<html><script>window.INITIAL_DATA = JSON.parse('${escaped}');</script></html>`;
}

describe('Apotek Hjärtat connector fixture tests', () => {
  it('parses a recorded fixture into normalized pharmacy rows', () => {
    const rows = parseApotekHjartatProducts(
      recordedFixture(),
      'https://www.apotekhjartat.se/search?q=vitamin',
      '2026-05-24T09:30:00.000Z'
    );

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      chain: 'apotek-hjartat',
      code: 'AH-1001',
      ean: '07350000001001',
      name: 'Cetirizin Hjärtat 10mg 10 tabletter',
      brand: 'Apotek Hjärtat',
      category: 'otc',
      price: 39.9,
      priceText: '39.90 SEK',
      originalPrice: 49.9,
      originalPriceText: '49.90 SEK',
      vatPercent: 12,
      stockStatus: 'InStock',
      productUrl: 'https://www.apotekhjartat.se/produkt/cetirizin-hjartat-10mg-10-tabletter/',
      imageUrl: 'https://www.apotekhjartat.se/images/cetirizin.png',
      isOtc: true,
      sourceUrl: 'https://www.apotekhjartat.se/search?q=vitamin',
      retrievedAt: '2026-05-24T09:30:00.000Z'
    });
    assert.equal(rows[1]?.category, 'supplement');
    assert.equal(rows[1]?.imageUrl, 'https://www.apotekhjartat.se/images/vitamin.png');
  });

  it('normalizes edge cases and filters prescription-only products', () => {
    assert.equal(
      normalizeApotekHjartatProduct(
        {
          productName: 'Prescription only row',
          sku: 'AH-RX',
          gtin: '07350000001025',
          price: { current: { inclVat: 10 } },
          belongsToPrescriptionProductGroup: true
        },
        'https://www.apotekhjartat.se/search?q=rx',
        '2026-05-24T09:30:00.000Z'
      ),
      null
    );
    assert.equal(
      normalizeApotekHjartatProduct(
        { productName: 'No EAN', sku: 'AH-NO-EAN', price: { current: { inclVat: 10 } } },
        'https://www.apotekhjartat.se/search?q=rx',
        '2026-05-24T09:30:00.000Z'
      ),
      null
    );
  });

  it('fetches through injected HTTP and fails closed on bad sources', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchApotekHjartatProducts({
      apotekHjartatUrls: ['https://www.apotekhjartat.se/search?q=vitamin'],
      retrievedAt: '2026-05-24T09:30:00.000Z',
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(recordedFixture(), { status: 200, headers: { 'content-type': 'text/html' } });
      }
    });

    assert.deepEqual(requestedUrls, ['https://www.apotekhjartat.se/search?q=vitamin']);
    assert.equal(rows.length, 2);

    await assert.rejects(
      () => fetchApotekHjartatProducts({ apotekHjartatUrls: ['https://www.apotekhjartat.se/search?q=vitamin'], fetchImpl: async () => new Response('Forbidden', { status: 403 }) }),
      /Apotek Hjärtat request failed.*403/
    );
    assert.throws(
      () => parseApotekHjartatProducts('<html>No initial data</html>', 'https://www.apotekhjartat.se/search?q=x', '2026-05-24T09:30:00.000Z'),
      /Apotek Hjärtat page did not include window.INITIAL_DATA/
    );
  });
});
