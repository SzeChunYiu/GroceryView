import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchApotekHjartatProducts,
  normalizeApotekHjartatProduct,
  normalizeApotekHjartatProductRows,
  parseApotekHjartatProducts
} from '../apotek-hjartat-se.js';

const RETRIEVED_AT = '2026-05-25T10:15:00.000Z';
const SOURCE_URL = 'https://www.apotekhjartat.se/search?q=alvedon';

function apotekHjartatFixture(products: unknown[]): string {
  const initialData = JSON.stringify({
    search: {
      products
    }
  })
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

  return `<!doctype html>
<html lang="sv">
  <head><title>Recorded Apotek Hjärtat fixture</title></head>
  <body>
    <script>window.INITIAL_DATA = JSON.parse('${initialData}');</script>
  </body>
</html>`;
}

const RECORDED_APOTEK_HJARTAT_FIXTURE = apotekHjartatFixture([
  {
    url: '/produkt/alvedon-500mg-20-tabletter/',
    productName: 'Alvedon 500 mg 20 tabletter',
    sku: 'hjartat-alvedon-20',
    gtin: '7046260976108',
    price: { current: { inclVat: '52,50', vatPercent: '12' } },
    storePrice: '64,50',
    images: [{ url: '/assets/alvedon-hjartat.png' }],
    variant: { stockStatus: 'buyable' },
    brands: [{ title: 'Alvedon' }],
    isBuyableWithoutPrescription: true,
    belongsToPrescriptionProductGroup: false,
    isOtcMedicine: true,
    trackingProductInformation: {
      brand: 'Fallback brand',
      category: 'Värk och feber',
      ean: '7046260976108',
      stockStatus: 'in_stock'
    }
  },
  {
    url: 'https://www.apotekhjartat.se/produkt/la-roche-posay-anthelios-spf50/',
    productName: 'La Roche-Posay Anthelios SPF50',
    sku: 'hjartat-anthelios',
    gtin: '3337875585859',
    price: { current: { inclVat: 109.9, vatPercent: 25 } },
    campaignName: 'Klubb Hjärtat: 2 för 180 kr',
    isMemberPrice: true,
    swatchImage: { url: '/assets/anthelios-swatch.png' },
    isBuyableWithoutPrescription: true,
    belongsToPrescriptionProductGroup: false,
    isDietarySupplement: false,
    trackingProductInformation: {
      brand: 'La Roche-Posay',
      category: 'Hudvård och sol',
      ean: '3337875585859',
      stockStatus: 'few_left'
    }
  },
  {
    url: '/produkt/receptbelagt/',
    productName: 'Receptbelagd rad ska filtreras',
    sku: 'hjartat-prescription',
    gtin: '1234567890123',
    price: { current: { inclVat: 88, vatPercent: 12 } },
    isBuyableWithoutPrescription: false,
    belongsToPrescriptionProductGroup: true
  },
  {
    url: '/produkt/saknar-gtin/',
    productName: 'Saknar GTIN ska filtreras',
    sku: 'hjartat-missing-gtin',
    price: { current: { inclVat: 35, vatPercent: 12 } },
    isBuyableWithoutPrescription: true
  },
  {
    url: '/produkt/saknar-pris/',
    productName: 'Saknar pris ska filtreras',
    sku: 'hjartat-missing-price',
    gtin: '7310618542110',
    isBuyableWithoutPrescription: true
  },
  {
    url: '/produkt/alvedon-500mg-20-tabletter/',
    productName: 'Duplicerad Alvedon-rad',
    sku: 'hjartat-alvedon-20-duplicate',
    gtin: '7046260976108',
    price: { current: { inclVat: 52.5, vatPercent: 12 } },
    isBuyableWithoutPrescription: true,
    belongsToPrescriptionProductGroup: false
  }
]);

function response(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}

describe('Apotek Hjärtat connector fixture parsing', () => {
  it('parses a recorded HTML fixture into normalized product rows', () => {
    const rows = parseApotekHjartatProducts(RECORDED_APOTEK_HJARTAT_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 4);
    assert.deepEqual(rows[0], {
      chain: 'apotek-hjartat',
      code: 'hjartat-alvedon-20',
      ean: '7046260976108',
      name: 'Alvedon 500 mg 20 tabletter',
      brand: 'Alvedon',
      category: 'otc',
      price: 52.5,
      priceText: '52.50 SEK',
      originalPrice: null,
      originalPriceText: '',
      vatPercent: 12,
      stockStatus: 'buyable',
      productUrl: 'https://www.apotekhjartat.se/produkt/alvedon-500mg-20-tabletter/',
      imageUrl: 'https://www.apotekhjartat.se/assets/alvedon-hjartat.png',
      isOtc: true,
      channel: 'online',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(
      rows.map((row) => ({
        code: row.code,
        ean: row.ean,
        name: row.name,
        brand: row.brand,
        category: row.category,
        price: row.price,
        channel: row.channel,
        stockStatus: row.stockStatus,
        imageUrl: row.imageUrl,
        member: row.is_member_price,
        multiBuy: row.multi_buy
      })),
      [
        {
          code: 'hjartat-alvedon-20',
          ean: '7046260976108',
          name: 'Alvedon 500 mg 20 tabletter',
          brand: 'Alvedon',
          category: 'otc',
          price: 52.5,
          channel: 'online',
          stockStatus: 'buyable',
          imageUrl: 'https://www.apotekhjartat.se/assets/alvedon-hjartat.png',
          member: undefined,
          multiBuy: undefined
        },
        {
          code: 'hjartat-alvedon-20:store',
          ean: '7046260976108',
          name: 'Alvedon 500 mg 20 tabletter',
          brand: 'Alvedon',
          category: 'otc',
          price: 64.5,
          channel: 'store',
          stockStatus: 'buyable',
          imageUrl: 'https://www.apotekhjartat.se/assets/alvedon-hjartat.png',
          member: undefined,
          multiBuy: undefined
        },
        {
          code: 'hjartat-anthelios',
          ean: '3337875585859',
          name: 'La Roche-Posay Anthelios SPF50',
          brand: 'La Roche-Posay',
          category: 'beauty',
          price: 109.9,
          channel: 'online',
          stockStatus: 'few_left',
          imageUrl: 'https://www.apotekhjartat.se/assets/anthelios-swatch.png',
          member: true,
          multiBuy: 'Klubb Hjärtat: 2 för 180 kr'
        },
        {
          code: 'hjartat-alvedon-20-duplicate',
          ean: '7046260976108',
          name: 'Duplicerad Alvedon-rad',
          brand: '',
          category: 'supplement',
          price: 52.5,
          channel: 'online',
          stockStatus: '',
          imageUrl: '',
          member: undefined,
          multiBuy: undefined
        }
      ]
    );
  });

  it('normalizes edge cases without emitting unsafe pharmacy rows', () => {
    assert.equal(
      normalizeApotekHjartatProduct(
        {
          productName: 'C-vitamin 100 tabletter',
          sku: 'hjartat-c-vitamin',
          price: { current: { inclVat: '79,90', vatPercent: '12' } },
          isBuyableWithoutPrescription: true,
          isDietarySupplement: true,
          trackingProductInformation: { ean: '7310618542110' }
        },
        SOURCE_URL,
        RETRIEVED_AT
      )?.category,
      'supplement'
    );
    assert.equal(
      normalizeApotekHjartatProduct(
        {
          productName: 'Receptbelagd',
          gtin: '1234567890123',
          price: { current: { inclVat: 25 } },
          belongsToPrescriptionProductGroup: true
        },
        SOURCE_URL,
        RETRIEVED_AT
      ),
      null
    );
    assert.equal(
      normalizeApotekHjartatProduct(
        {
          productName: 'Ej receptfri',
          gtin: '1234567890123',
          price: { current: { inclVat: 25 } },
          isBuyableWithoutPrescription: false
        },
        SOURCE_URL,
        RETRIEVED_AT
      ),
      null
    );
    assert.equal(normalizeApotekHjartatProduct({ productName: 'Saknar pris', gtin: '1234567890123' }, SOURCE_URL, RETRIEVED_AT), null);
    assert.deepEqual(
      normalizeApotekHjartatProductRows(
        {
          productName: 'ICA-rabatt',
          sku: 'hjartat-ica',
          gtin: '7310618542110',
          price: { current: { inclVat: 49 } },
          campaignLabel: 'ICA Stammis 20% med rabattkod',
          requiresCoupon: true
        },
        SOURCE_URL,
        RETRIEVED_AT
      ).map((row) => ({ member: row.is_member_price, coupon: row.is_coupon_price })),
      [{ member: true, coupon: true }]
    );
  });

  it('mocks HTTP with the fixture, de-duplicates EANs, passes crawler headers, and honors maxRows', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchApotekHjartatProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_APOTEK_HJARTAT_FIXTURE);
      },
      apotekHjartatUrls: [SOURCE_URL, 'https://www.apotekhjartat.se/search?q=solskydd'],
      maxRows: 2,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(
      rows.map((row) => row.name),
      ['Alvedon 500 mg 20 tabletter', 'Alvedon 500 mg 20 tabletter']
    );
    assert.equal(rows.every((row) => row.chain === 'apotek-hjartat' && row.sourceUrl === SOURCE_URL), true);
    assert.equal(rows.every((row) => row.retrievedAt === RETRIEVED_AT), true);
  });

  it('fails closed for HTTP errors and malformed fixture pages', async () => {
    await assert.rejects(
      () =>
        fetchApotekHjartatProducts({
          fetchImpl: async () => response('Forbidden', 403),
          apotekHjartatUrls: [SOURCE_URL],
          retrievedAt: RETRIEVED_AT
        }),
      /Apotek Hjärtat request failed for https:\/\/www\.apotekhjartat\.se\/search\?q=alvedon: 403/
    );

    assert.throws(
      () => parseApotekHjartatProducts('<html><body>No INITIAL_DATA payload</body></html>', SOURCE_URL, RETRIEVED_AT),
      /Apotek Hjärtat page did not include window\.INITIAL_DATA/
    );
  });
});
