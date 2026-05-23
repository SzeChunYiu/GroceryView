import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiContractOpenApiComponents,
  apiContractSchemas,
  fuelPriceObservationSchema,
  priceObservationSchema,
  type PriceObservationDto
} from '../index.js';

const validPrice: PriceObservationDto = {
  id: 'obs-1',
  domain: 'grocery',
  productId: 'coffee',
  storeId: 'willys-odenplan',
  price: { amount: 49.9, currency: 'SEK' },
  unitPrice: { amount: 110.89, currency: 'SEK' },
  priceType: 'promotion',
  confidence: 'high',
  observedAt: '2026-05-19T10:00:00.000Z',
  sourceType: 'retailer_page',
  provenance: {
    sourceRunId: 'run-1',
    sourceUrl: 'https://example.test/products/coffee',
    capturedAt: '2026-05-19T10:01:00.000Z',
    parserVersion: 'retailer-stub-v1',
    rawRecordId: 'raw-1'
  },
  memberOnly: false,
  promotion: {
    label: 'Veckans pris',
    endsAt: '2026-05-26T21:59:59.000Z'
  }
};

describe('api contract schemas', () => {
  it('exports DTO schemas for the Phase 1 API resources', () => {
    assert.deepEqual(Object.keys(apiContractSchemas).sort(), [
      'alert',
      'basket',
      'basketItem',
      'fuelPriceObservation',
      'fuelPriceSource',
      'fuelPricesResponse',
      'latestPrice',
      'priceObservation',
      'product',
      'productPricesResponse',
      'provenance',
      'store',
      'watchlist'
    ]);
  });

  it('accepts price observations only when provenance fields are present', () => {
    assert.equal(priceObservationSchema.parse(validPrice).priceType, 'promotion');

    const result = priceObservationSchema.safeParse({
      ...validPrice,
      confidence: undefined,
      observedAt: undefined,
      sourceType: undefined,
      provenance: undefined
    });

    assert.equal(result.success, false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path.join('.')).sort();
      assert.deepEqual(fields, ['confidence', 'observedAt', 'provenance', 'sourceType']);
    }
  });

  it('models fuel price observations by grade and source kind', () => {
    const parsed = fuelPriceObservationSchema.parse({
      id: 'okq8-fuel-95-e10-2026-05-22',
      domain: 'fuel',
      productId: 'fuel-95-e10',
      chainId: 'okq8',
      fuelGrade: '95',
      pricePerLitre: { amount: 18.89, currency: 'SEK' },
      observedAt: '2026-05-22T00:00:00.000Z',
      source: {
        kind: 'operator_public_price_page',
        operatorId: 'okq8',
        operatorName: 'OKQ8',
        sourceUrl: 'https://www.okq8.se/foretag/priser/',
        capturedAt: '2026-05-23T08:35:34.000Z',
        parserVersion: 'okq8-fuel-prices-v1'
      },
      provenance: {
        sourceRunId: 'source-run:okq8:fuel:2026-05-23',
        sourceUrl: 'https://www.okq8.se/foretag/priser/',
        capturedAt: '2026-05-23T08:35:34.000Z',
        parserVersion: 'okq8-fuel-prices-v1'
      }
    });

    assert.equal(parsed.domain, 'fuel');
    assert.equal(parsed.source.kind, 'operator_public_price_page');
    assert.equal(parsed.pricePerLitre.amount, 18.89);

    assert.equal(fuelPriceObservationSchema.safeParse({
      ...parsed,
      domain: 'grocery'
    }).success, false);
  });

  it('captures watchlist price-type preferences for trusted alerts', () => {
    assert.deepEqual(
      apiContractSchemas.watchlist.parse({
        id: 'watch-1',
        userId: 'user-1',
        productId: 'coffee'
      }).allowedPriceTypes,
      ['shelf']
    );
    assert.deepEqual(
      apiContractSchemas.watchlist.parse({
        id: 'watch-2',
        userId: 'user-1',
        productId: 'coffee',
        allowedPriceTypes: ['shelf', 'promotion']
      }).allowedPriceTypes,
      ['shelf', 'promotion']
    );
    assert.equal(
      apiContractSchemas.watchlist.safeParse({
        id: 'watch-3',
        userId: 'user-1',
        productId: 'coffee',
        allowedPriceTypes: ['scraped']
      }).success,
      false
    );
  });

  it('publishes OpenAPI-compatible component metadata for price provenance', () => {
    const price = apiContractOpenApiComponents.PriceObservation;
    const fuel = apiContractOpenApiComponents.FuelPriceObservation;
    assert.ok(fuel.required.includes('domain'));
    assert.ok(fuel.required.includes('fuelGrade'));
    assert.ok(fuel.required.includes('pricePerLitre'));
    assert.ok(price.required.includes('priceType'));
    assert.ok(price.required.includes('confidence'));
    assert.ok(price.required.includes('observedAt'));
    assert.ok(price.required.includes('sourceType'));
    assert.ok(price.required.includes('provenance'));
    assert.deepEqual(price.properties.priceType.enum, ['shelf', 'member', 'promotion', 'estimated']);
    assert.deepEqual(apiContractOpenApiComponents.FuelPriceObservation.properties.fuelGrade.enum, ['95', '98', 'diesel', 'hvo100', 'e85']);
  });
});
