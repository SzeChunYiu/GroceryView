import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCityGrossProductsUrl,
  buildCityGrossStoresUrl,
  fetchCityGrossProducts,
  fetchCityGrossStores,
  normalizeCityGrossProduct
} from '../citygross.js';

const RETRIEVED_AT = '2026-05-25T12:55:00.000Z';

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

describe('City Gross connector fixture parsing', () => {
  it('builds deterministic store and product API URLs', () => {
    assert.equal(buildCityGrossStoresUrl(), 'https://www.citygross.se/api/v1/PageData/stores');

    const url = new URL(buildCityGrossProductsUrl({ siteId: '3377', query: 'kaffe brygg', take: 25, skip: 50 }));
    assert.equal(url.origin + url.pathname, 'https://www.citygross.se/api/v1/Loop54/products');
    assert.equal(url.searchParams.get('Q'), 'kaffe brygg');
    assert.equal(url.searchParams.get('skip'), '50');
    assert.equal(url.searchParams.get('take'), '25');
    assert.equal(url.searchParams.get('siteId'), '3377');
  });

  it('parses recorded store fixtures, skips malformed rows, and de-duplicates store ids', async () => {
    const rows = await fetchCityGrossStores({
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async () => jsonResponse([
        {
          data: {
            storeName: 'City Gross Hyllie',
            siteId: '3377',
            url: '/butiker/hyllie',
            storeLocation: { coordinates: '55.5621, 12.9762' }
          }
        },
        { data: { storeName: 'Duplicate Hyllie', siteId: '3377' } },
        { data: { storeName: '', siteId: 'missing-name' } }
      ])
    });

    assert.deepEqual(rows, [
      {
        storeId: '3377',
        name: 'City Gross Hyllie',
        address: '',
        city: 'Hyllie',
        latitude: 55.5621,
        longitude: 12.9762,
        url: 'https://www.citygross.se/butiker/hyllie',
        sourceUrl: buildCityGrossStoresUrl(),
        retrievedAt: RETRIEVED_AT
      }
    ]);
  });

  it('parses product fixtures with promotion edge cases and grocery filtering', async () => {
    const requestedUrls: string[] = [];
    const fixture = {
      items: [
        {
          id: 'cg-1001',
          gtin: '07318690012345',
          name: 'Arla Ko Mellanmjölk 1,5%',
          brand: 'Arla Ko',
          superCategory: 'Mejeri, ost & ägg',
          category: 'Mjölk',
          descriptiveSize: '1 l',
          url: '/produkt/arla-ko-mellanmjolk-1-5-1-l',
          images: [{ url: '/globalassets/product/mjolk.jpg' }],
          productStoreDetails: {
            p_has_current_week_only_discount: true,
            p_has_long_time_discount: 'false',
            p_has_members_only_price: 'true',
            prices: {
              currentPrice: { price: 12.9, comparativePrice: '12.90', comparativePriceUnit: 'l' },
              ordinaryPrice: { price: '17.90' },
              hasDiscount: true,
              activePromotion: {
                from: '2026-05-25',
                to: '2026-05-31',
                minQuantity: '2',
                priceDetails: { price: '12.90', comparativePrice: 12.9, comparativePriceUnit: 'l' }
              }
            }
          }
        },
        {
          id: 'cg-1001',
          name: 'Duplicate milk',
          superCategory: 'Mejeri, ost & ägg',
          productStoreDetails: { prices: { currentPrice: { price: 99 } } }
        },
        {
          id: 'cg-toy',
          name: 'Non grocery row',
          superCategory: 'Hem & fritid',
          productStoreDetails: { prices: { currentPrice: { price: 49 } } }
        },
        {
          id: 'missing-price',
          name: 'Malformed without price',
          superCategory: 'Skafferiet',
          productStoreDetails: { prices: {} }
        }
      ],
      totalCount: 4
    };
    const fetchImpl: typeof fetch = async (input) => {
      requestedUrls.push(String(input));
      return jsonResponse(fixture);
    };

    const rows = await fetchCityGrossProducts({
      fetchImpl,
      siteId: '3377',
      query: 'mjölk',
      pageSize: 10,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [buildCityGrossProductsUrl({ siteId: '3377', query: 'mjölk', take: 10, skip: 0 })]);
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0]!, {
      code: 'cg-1001',
      gtin: '07318690012345',
      name: 'Arla Ko Mellanmjölk 1,5%',
      brand: 'Arla Ko',
      superCategory: 'Mejeri, ost & ägg',
      category: 'Mjölk',
      packageText: '1 l',
      storeId: '3377',
      price: 12.9,
      regularPrice: 17.9,
      unitPrice: 12.9,
      unitPriceUnit: 'l',
      hasDiscount: true,
      hasPromotion: true,
      isCurrentWeekDiscount: true,
      isLongTimeDiscount: false,
      isMembersOnlyPrice: true,
      promotionFrom: '2026-05-25',
      promotionTo: '2026-05-31',
      promotionMinQuantity: 2,
      promotionPrice: 12.9,
      promotionUnitPrice: 12.9,
      promotionUnitPriceUnit: 'l',
      priceText: '12.90 SEK',
      productUrl: 'https://www.citygross.se/produkt/arla-ko-mellanmjolk-1-5-1-l',
      imageUrl: 'https://www.citygross.se/globalassets/product/mjolk.jpg',
      sourceUrl: requestedUrls[0]!,
      retrievedAt: RETRIEVED_AT
    });
  });

  it('normalizes edge cases without emitting malformed product rows', () => {
    assert.equal(
      normalizeCityGrossProduct({ id: 'cg-1', name: 'Kaffe', superCategory: 'Skafferiet' }, '3377', 'source', RETRIEVED_AT),
      null
    );
    assert.equal(
      normalizeCityGrossProduct(
        {
          id: 'cg-2',
          name: 'Leksak',
          superCategory: 'Hem & fritid',
          productStoreDetails: { prices: { currentPrice: { price: 10 } } }
        },
        '3377',
        'source',
        RETRIEVED_AT
      ),
      null
    );
  });

  it('propagates non-OK product and store responses with context', async () => {
    await assert.rejects(
      fetchCityGrossStores({ fetchImpl: async () => jsonResponse({ message: 'bad gateway' }, 502) }),
      /City Gross stores request failed: 502/
    );
    await assert.rejects(
      fetchCityGrossProducts({ siteId: '3377', fetchImpl: async () => jsonResponse({ message: 'rate limited' }, 429) }),
      /City Gross products request failed for site 3377: 429/
    );
  });
});
