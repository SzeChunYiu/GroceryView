import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchIcaStammisOffers,
  icaStammisOfferFromProduct,
  ICA_STAMMIS_OFFERS_URL
} from '../ica-stammis-offers-se.js';
import type { IcaProduct } from '../ica.js';

const RETRIEVED_AT = '2026-05-25T08:30:00.000Z';

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

describe('ICA Stammis offer connector', () => {
  it('emits only Stammis rows with structured member promotions and weekday restrictions', async () => {
    const fixture = {
      productGroups: [
        {
          type: 'Mejeri',
          decoratedProducts: [
            {
              productId: 'prd-ica-yogurt-1kg',
              retailerProductId: '2033470',
              name: 'Turkisk Yoghurt 10%',
              brand: 'ICA',
              packSizeDescription: '1kg',
              price: { amount: 34.9, currency: 'SEK' },
              unitPrice: { price: { amount: 34.9, currency: 'SEK' }, unit: 'kr/kg' },
              promoPrice: { amount: 29.9, currency: 'SEK' },
              promoUnitPrice: { price: { amount: 29.9, currency: 'SEK' }, unit: 'kr/kg' },
              promotions: [{ description: 'Med ICA Stammis tisdag' }],
              image: { src: 'https://assets.icanet.se/yoghurt.jpg' }
            },
            {
              productId: 'prd-public',
              retailerProductId: '2033471',
              name: 'Public coffee',
              price: { amount: 49.9, currency: 'SEK' },
              promotions: [{ description: 'Veckans pris' }]
            }
          ]
        }
      ]
    };
    const fetchImpl: typeof fetch = async () => jsonResponse(fixture);

    const rows = await fetchIcaStammisOffers({
      fetchImpl,
      stores: [{ storeAccountId: '1004599', storeName: 'ICA Kvantum Kungsholmen', regionId: 'region-1' }],
      maxRows: 10,
      maxPageSize: 10,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.channel, 'ica_stammis');
    assert.equal(rows[0]?.sourceType, 'member_offer');
    assert.equal(rows[0]?.priceType, 'member');
    assert.equal(rows[0]?.scanRequired, true);
    assert.equal(rows[0]?.memberOfferUrl, ICA_STAMMIS_OFFERS_URL);
    assert.deepEqual(rows[0]?.structuredPromotion, {
      kind: 'member',
      price: 29.9,
      memberProgram: 'ica_stammis',
      dayOfWeekRestriction: ['tuesday'],
      sourceText: 'Med ICA Stammis tisdag'
    });
  });

  it('keeps Stammis member prices structured even when no weekday is present', () => {
    const product: IcaProduct = {
      chain: 'ica',
      ica_format: 'kvantum',
      code: '2033470',
      productId: 'prd-ica-yogurt-1kg',
      retailerProductId: '2033470',
      name: 'Turkisk Yoghurt 10%',
      brand: 'ICA',
      categories: ['Mejeri'],
      imageUrl: 'https://assets.icanet.se/yoghurt.jpg',
      productUrl: 'https://handlaprivatkund.ica.se/stores/1004599/products/2033470/details',
      packageSize: '1kg',
      countryOfOrigin: 'Sverige',
      price: 34.9,
      priceCurrency: 'SEK',
      unitPrice: 34.9,
      unitPriceCurrency: 'SEK',
      unitPriceUnit: 'kr/kg',
      promoPrice: null,
      promoPriceCurrency: '',
      promoUnitPrice: null,
      promoUnitPriceCurrency: '',
      promoUnitPriceUnit: '',
      promotionDescription: 'Med ICA Stammis',
      storeAccountId: '1004599',
      storeName: 'ICA Kvantum Kungsholmen',
      regionId: 'region-1',
      sourceUrl: 'https://handlaprivatkund.ica.se/stores/1004599/api/product-listing-pages/v1/pages/promotions',
      retrievedAt: RETRIEVED_AT
    };

    assert.deepEqual(icaStammisOfferFromProduct(product)?.structuredPromotion, {
      kind: 'member',
      price: 34.9,
      memberProgram: 'ica_stammis',
      dayOfWeekRestriction: [],
      sourceText: 'Med ICA Stammis'
    });
  });
});
