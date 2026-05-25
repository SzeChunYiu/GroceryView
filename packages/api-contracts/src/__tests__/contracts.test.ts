import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiContractOpenApiComponents,
  apiContractSchemas,
  compareResponseSchema,
  currencyCodeSchema,
  fuelPriceObservationSchema,
  marketPriceContextSchema,
  multiWeekStockUpListResponseSchema,
  multiWeekStockUpUpdateRowSchema,
  notificationInboxResponseSchema,
  priceBreakdownSchema,
  priceObservationSchema,
  type CompareResponseDto,
  type MultiWeekStockUpListResponseDto,
  type NotificationInboxResponseDto,
  type PriceObservationDto
} from '../index.js';

const validPrice: PriceObservationDto = {
  id: 'obs-1',
  domain: 'grocery',
  productId: 'coffee',
  storeId: 'willys-odenplan',
  market: { market: 'SE', currency: 'SEK' },
  price: { amount: 49.9, currency: 'SEK' },
  unitPrice: { amount: 110.89, currency: 'SEK' },
  priceBreakdown: {
    vatIncluded: true,
    vatRatePercent: 12,
    taxIncluded: true,
    deposit: { amount: { amount: 1, currency: 'SEK' }, label: 'pant', includedInDisplayedPrice: false },
    memberPrice: { amount: { amount: 44.9, currency: 'SEK' }, memberOnly: true, loyaltyProgramId: 'willys-plus' },
    onlineFees: [
      { type: 'delivery', amount: { amount: 49, currency: 'SEK' }, label: 'online delivery fee', includedInDisplayedPrice: false, appliesTo: 'order' }
    ]
  },
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

const validNotificationInbox: NotificationInboxResponseDto = {
  userId: 'user-1',
  generatedAt: '2026-05-20T08:00:00.000Z',
  trackedItemCount: 1,
  activeAlertCount: 1,
  deliveredCount: 0,
  heldCount: 1,
  suppressedCount: 0,
  summary: {
    delivered: 0,
    held: 1,
    suppressed: 0,
    total: 1
  },
  queue: [
    {
      id: 'receipt-review-quiet-hours',
      title: 'Receipt review reminder',
      channel: 'push',
      status: 'held',
      reason: 'Quiet hours 21:00-07:00',
      action: 'Send in morning digest',
      priority: 'normal',
      sendAt: '2026-05-20T07:00:00.000Z'
    }
  ],
  quietHoursWindow: '21:00-07:00',
  guardrails: ['Quiet-hours holds wait for the morning digest unless the alert is critical.']
};


const validStockUpList: MultiWeekStockUpListResponseDto = {
  userId: 'user-1',
  itemCount: 1,
  rows: [
    {
      rowId: 'coffee-stock-up',
      userId: 'user-1',
      productId: 'coffee',
      productName: 'Zoégas Coffee 450g',
      storeName: 'Willys Odenplan',
      planningWeeks: 4,
      weeklyNeedUnits: 1,
      packageUnits: 0.45,
      comparableUnit: 'kg',
      currentUnitPrice: 110.89,
      historicalLowUnitPrice: 99.9,
      typicalUnitPrice: 133.11,
      confidence: 'high',
      historyWindowStart: '2026-04-01T00:00:00.000Z',
      historyWindowEnd: '2026-05-21T00:00:00.000Z',
      noForecastReason: 'Historical low and typical prices are observed facts only; no future shelf price is predicted.',
      reviewTrigger: 'Re-check observed prices before restocking.',
      updatedAt: '2026-05-21T09:00:00.000Z'
    }
  ],
  guardrails: ['Rows are account-owned and signed-in.', 'No forecast is stored.'],
  evidence: {
    sourceTables: ['multi_week_stock_up_rows', 'app_users'],
    noForecast: true,
    historicalPriceFields: ['historicalLowUnitPrice', 'typicalUnitPrice', 'confidence', 'historyWindowStart', 'historyWindowEnd']
  }
};

const validCompareResponse: CompareResponseDto = {
  market: { market: 'SE', currency: 'SEK' },
  itemIds: ['coffee', 'milk'],
  stores: {
    'willys-odenplan': {
      coffee: {
        price: { amount: 49.9, currency: 'SEK' },
        unitPrice: { amount: 110.89, currency: 'SEK' },
        priceType: 'promotion',
        confidence: 'high',
        observedAt: '2026-05-21T09:00:00.000Z'
      }
    },
    'lidl-sveavagen': {
      coffee: {
        price: { amount: 54.9, currency: 'SEK' },
        priceType: 'shelf',
        confidence: 'medium',
        observedAt: '2026-05-21T08:00:00.000Z'
      },
      milk: {
        price: { amount: 13.9, currency: 'SEK' },
        priceType: 'shelf',
        confidence: 'high',
        observedAt: '2026-05-21T07:00:00.000Z'
      }
    }
  },
  missingItemIds: ['butter']
};

describe('api contract schemas', () => {
  it('exports DTO schemas for the Phase 1 API resources', () => {
    assert.deepEqual(Object.keys(apiContractSchemas).sort(), [
      'alert',
      'basket',
      'basketItem',
      'compareResponse',
      'currencyCode',
      'fuelPriceObservation',
      'fuelPriceSource',
      'fuelPricesResponse',
      'latestPrice',
      'marketPriceContext',
      'multiWeekStockUpCreateRow',
      'multiWeekStockUpListResponse',
      'multiWeekStockUpRow',
      'multiWeekStockUpUpdateRow',
      'notificationInboxResponse',
      'priceBreakdown',
      'priceComponent',
      'priceObservation',
      'product',
      'productPricesResponse',
      'provenance',
      'store',
      'watchlist'
    ]);
  });

  it('models compare responses by requested item ids and store/item price snapshots', () => {
    const parsed = compareResponseSchema.parse(validCompareResponse);

    assert.deepEqual(parsed.itemIds, ['coffee', 'milk']);
    assert.equal(parsed.stores['willys-odenplan']?.coffee?.price.amount, 49.9);
    assert.equal(parsed.stores['lidl-sveavagen']?.milk?.confidence, 'high');
    assert.deepEqual(parsed.missingItemIds, ['butter']);

    assert.equal(
      compareResponseSchema.safeParse({
        ...validCompareResponse,
        stores: {
          'willys-odenplan': {
            coffee: {
              ...validCompareResponse.stores['willys-odenplan']!.coffee!,
              observedAt: undefined
            }
          }
        }
      }).success,
      false
    );
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

  it('models multi-currency market price components without mixing currencies', () => {
    assert.deepEqual(currencyCodeSchema.options, ['SEK', 'NOK', 'ISK', 'DKK', 'EUR']);
    assert.deepEqual(marketPriceContextSchema.parse({ market: 'IS', currency: 'ISK' }), { market: 'IS', currency: 'ISK' });
    assert.equal(marketPriceContextSchema.safeParse({ market: 'NO', currency: 'SEK' }).success, false);

    const parsedBreakdown = priceBreakdownSchema.parse({
      vatIncluded: true,
      vatRatePercent: 15,
      deposit: { amount: { amount: 25, currency: 'ISK' }, label: 'Iceland bottle deposit', includedInDisplayedPrice: false },
      memberPrice: { amount: { amount: 399, currency: 'ISK' }, memberOnly: true },
      onlineFees: [
        { type: 'pickup', amount: { amount: 0, currency: 'ISK' }, label: 'pickup fee', includedInDisplayedPrice: true }
      ]
    });
    assert.equal(parsedBreakdown.onlineFees[0]?.appliesTo, 'order');

    assert.equal(priceObservationSchema.parse({
      ...validPrice,
      market: { market: 'NO', currency: 'NOK' },
      price: { amount: 49.9, currency: 'NOK' },
      unitPrice: { amount: 110.89, currency: 'NOK' },
      priceBreakdown: {
        vatIncluded: true,
        vatRatePercent: 15,
        memberPrice: { amount: { amount: 44.9, currency: 'NOK' }, memberOnly: true },
        onlineFees: [
          { type: 'delivery', amount: { amount: 59, currency: 'NOK' }, label: 'delivery fee' }
        ]
      }
    }).market?.currency, 'NOK');

    assert.equal(priceObservationSchema.safeParse({
      ...validPrice,
      priceBreakdown: {
        vatIncluded: true,
        vatRatePercent: 12,
        deposit: { amount: { amount: 1, currency: 'NOK' }, label: 'wrong currency deposit' }
      }
    }).success, false);
  });

  it('rejects compare responses that mix currencies across markets', () => {
    assert.equal(compareResponseSchema.safeParse({
      ...validCompareResponse,
      stores: {
        ...validCompareResponse.stores,
        'bonus-reykjavik': {
          coffee: {
            price: { amount: 399, currency: 'ISK' },
            priceType: 'shelf',
            confidence: 'low',
            observedAt: '2026-05-21T09:00:00.000Z'
          }
        }
      }
    }).success, false);

    assert.equal(compareResponseSchema.parse({
      ...validCompareResponse,
      market: { market: 'IS', currency: 'ISK' },
      stores: {
        'bonus-reykjavik': {
          coffee: {
            price: { amount: 399, currency: 'ISK' },
            unitPrice: { amount: 798, currency: 'ISK' },
            priceType: 'shelf',
            confidence: 'low',
            observedAt: '2026-05-21T09:00:00.000Z'
          }
        }
      }
    }).market?.currency, 'ISK');
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

  it('requires notification inbox timing fields for API and server contracts', () => {
    const parsed = notificationInboxResponseSchema.parse(validNotificationInbox);

    assert.equal(parsed.generatedAt, '2026-05-20T08:00:00.000Z');
    assert.equal(parsed.queue[0]?.sendAt, '2026-05-20T07:00:00.000Z');
    assert.equal(
      notificationInboxResponseSchema.safeParse({
        ...validNotificationInbox,
        generatedAt: undefined,
        queue: validNotificationInbox.queue.map(({ sendAt: _sendAt, ...item }) => item)
      }).success,
      false
    );
  });


  it('models signed-in multi-week stock-up rows as observed historical facts, not forecasts', () => {
    const parsed = multiWeekStockUpListResponseSchema.parse(validStockUpList);

    assert.equal(parsed.rows[0]?.planningWeeks, 4);
    assert.equal(parsed.rows[0]?.confidence, 'high');
    assert.equal(parsed.evidence.noForecast, true);
    assert.deepEqual(parsed.evidence.sourceTables, ['multi_week_stock_up_rows', 'app_users']);
    assert.equal(
      multiWeekStockUpListResponseSchema.safeParse({
        ...validStockUpList,
        evidence: { ...validStockUpList.evidence, noForecast: false }
      }).success,
      false
    );
    assert.equal(multiWeekStockUpUpdateRowSchema.safeParse({}).success, false);
    assert.equal(multiWeekStockUpUpdateRowSchema.parse({ planningWeeks: 6 }).planningWeeks, 6);
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
    assert.deepEqual(apiContractOpenApiComponents.MoneyAmount.properties.currency.enum, ['SEK', 'NOK', 'ISK', 'DKK', 'EUR']);
    assert.equal(apiContractOpenApiComponents.PriceObservation.properties.priceBreakdown.$ref, '#/components/schemas/PriceBreakdown');
    assert.deepEqual(apiContractOpenApiComponents.NotificationInboxResponse.properties.queue.items, {
      $ref: '#/components/schemas/NotificationInboxQueueItem'
    });
    assert.deepEqual(apiContractOpenApiComponents.NotificationInboxResponse.required, [
      'userId',
      'generatedAt',
      'trackedItemCount',
      'activeAlertCount',
      'deliveredCount',
      'heldCount',
      'suppressedCount',
      'summary',
      'queue',
      'quietHoursWindow',
      'guardrails'
    ]);
    assert.equal(apiContractOpenApiComponents.NotificationInboxQueueItem.properties.sendAt.format, 'date-time');
    assert.deepEqual(apiContractOpenApiComponents.MultiWeekStockUpListResponse.properties.rows.items, {
      $ref: '#/components/schemas/MultiWeekStockUpRow'
    });
    assert.equal(apiContractOpenApiComponents.MultiWeekStockUpListResponse.properties.evidence.properties.noForecast.enum[0], true);
  });
});
