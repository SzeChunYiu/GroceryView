import { z } from 'zod';

export const idSchema = z.string().trim().min(1);
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const priceTypeSchema = z.enum(['shelf', 'member', 'promotion', 'estimated']);
export const confidenceSchema = z.enum(['high', 'medium', 'low', 'unverified']);
export const sourceTypeSchema = z.enum(['retailer_api', 'retailer_page', 'receipt_scan', 'manual_review', 'seed_stub']);
export const priceDomainSchema = z.enum(['grocery', 'fuel', 'pharmacy']);
export const fuelGradeSchema = z.enum(['95', '98', 'diesel', 'hvo100', 'e85']);
export const fuelPriceSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('operator_public_price_page'),
    operatorId: idSchema,
    operatorName: idSchema,
    sourceUrl: z.string().url(),
    capturedAt: isoDateTimeSchema,
    parserVersion: idSchema
  }),
  z.object({
    kind: z.literal('crowd_station_report'),
    reporterTrustTier: z.enum(['new', 'trusted', 'operator_verified']),
    stationId: idSchema,
    submittedAt: isoDateTimeSchema,
    evidenceType: z.enum(['receipt', 'pump_photo', 'manual_entry'])
  })
]);

export const provenanceSchema = z.object({
  sourceRunId: idSchema,
  sourceUrl: z.string().url().optional(),
  capturedAt: isoDateTimeSchema,
  parserVersion: idSchema,
  rawRecordId: idSchema.optional()
});

export const moneyAmountSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.literal('SEK')
});

export const storeSchema = z.object({
  id: idSchema,
  chainId: idSchema,
  name: idSchema,
  address: idSchema,
  municipality: idSchema,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

export const productSchema = z.object({
  id: idSchema,
  name: idSchema,
  brand: z.string().trim().optional(),
  categoryId: idSchema,
  gtin: z.string().trim().optional(),
  quantity: z.object({
    amount: z.number().positive(),
    unit: z.enum(['g', 'kg', 'ml', 'l', 'st'])
  })
});

export const priceObservationSchema = z.object({
  id: idSchema,
  domain: priceDomainSchema.default('grocery'),
  productId: idSchema,
  storeId: idSchema,
  price: moneyAmountSchema,
  unitPrice: moneyAmountSchema.optional(),
  priceType: priceTypeSchema,
  confidence: confidenceSchema,
  observedAt: isoDateTimeSchema,
  sourceType: sourceTypeSchema,
  provenance: provenanceSchema,
  memberOnly: z.boolean().default(false),
  promotion: z
    .object({
      label: idSchema,
      startsAt: isoDateTimeSchema.optional(),
      endsAt: isoDateTimeSchema.optional()
    })
    .optional()
});

export const fuelPriceObservationSchema = z.object({
  id: idSchema,
  domain: z.literal('fuel'),
  productId: idSchema,
  chainId: idSchema,
  storeId: idSchema.optional(),
  fuelGrade: fuelGradeSchema,
  pricePerLitre: moneyAmountSchema,
  observedAt: isoDateTimeSchema,
  source: fuelPriceSourceSchema,
  provenance: provenanceSchema
});

export const latestPriceSchema = priceObservationSchema.extend({
  supersedesObservationIds: z.array(idSchema).default([])
});

export const fuelPricesResponseSchema = z.object({
  domain: z.literal('fuel'),
  litreBasis: z.literal(1),
  grades: z.array(fuelGradeSchema),
  observations: z.array(fuelPriceObservationSchema),
  sources: z.array(fuelPriceSourceSchema)
});

export const watchlistSchema = z.object({
  id: idSchema,
  userId: idSchema,
  productId: idSchema,
  targetPrice: moneyAmountSchema.optional(),
  minimumDealScore: z.number().min(0).max(100).optional(),
  allowedPriceTypes: z.array(priceTypeSchema).default(['shelf']),
  favoriteStoresOnly: z.boolean().default(false)
});

export const basketItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().positive()
});

export const basketSchema = z.object({
  id: idSchema,
  userId: idSchema,
  items: z.array(basketItemSchema)
});

export const multiWeekStockUpConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const multiWeekStockUpRowSchema = z.object({
  rowId: idSchema,
  userId: idSchema,
  productId: idSchema,
  productName: idSchema,
  storeId: idSchema.optional(),
  storeName: idSchema,
  planningWeeks: z.number().int().positive().max(26),
  weeklyNeedUnits: z.number().positive(),
  packageUnits: z.number().positive(),
  comparableUnit: idSchema,
  currentUnitPrice: z.number().nonnegative(),
  historicalLowUnitPrice: z.number().nonnegative(),
  typicalUnitPrice: z.number().nonnegative(),
  confidence: multiWeekStockUpConfidenceSchema,
  historyWindowStart: isoDateTimeSchema,
  historyWindowEnd: isoDateTimeSchema,
  storageLimitWeeks: z.number().int().positive().max(26).optional(),
  noForecastReason: idSchema,
  reviewTrigger: idSchema,
  updatedAt: isoDateTimeSchema
});

export const multiWeekStockUpCreateRowSchema = multiWeekStockUpRowSchema
  .omit({ rowId: true, userId: true, updatedAt: true })
  .extend({ rowId: idSchema.optional() });

export const multiWeekStockUpUpdateRowSchema = multiWeekStockUpCreateRowSchema.partial().refine((patch) => Object.keys(patch).length > 0, {
  message: 'At least one stock-up row field is required.'
});

export const multiWeekStockUpListResponseSchema = z.object({
  userId: idSchema,
  itemCount: z.number().int().nonnegative(),
  rows: z.array(multiWeekStockUpRowSchema),
  guardrails: z.array(idSchema),
  evidence: z.object({
    sourceTables: z.array(idSchema),
    noForecast: z.literal(true),
    historicalPriceFields: z.array(idSchema)
  })
});

export const alertSchema = z.object({
  id: idSchema,
  userId: idSchema,
  productId: idSchema,
  kind: z.enum(['target_price', 'deal_score', 'back_in_stock']),
  message: idSchema,
  triggeredAt: isoDateTimeSchema,
  price: priceObservationSchema.optional()
});

export const notificationInboxQueueItemSchema = z.object({
  id: idSchema,
  title: idSchema,
  channel: z.enum(['push', 'email', 'telegram']),
  status: z.enum(['delivered', 'held', 'suppressed']),
  reason: idSchema,
  action: idSchema,
  priority: z.enum(['normal', 'high']),
  sendAt: isoDateTimeSchema,
  productId: idSchema.optional()
});

export const notificationInboxSummarySchema = z.object({
  delivered: z.number().int().nonnegative(),
  held: z.number().int().nonnegative(),
  suppressed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative()
});

export const notificationInboxResponseSchema = z.object({
  userId: idSchema,
  generatedAt: isoDateTimeSchema,
  trackedItemCount: z.number().int().nonnegative(),
  activeAlertCount: z.number().int().nonnegative(),
  deliveredCount: z.number().int().nonnegative(),
  heldCount: z.number().int().nonnegative(),
  suppressedCount: z.number().int().nonnegative(),
  summary: notificationInboxSummarySchema,
  queue: z.array(notificationInboxQueueItemSchema),
  quietHoursWindow: idSchema,
  guardrails: z.array(idSchema)
});

export const productPricesResponseSchema = z.object({
  product: productSchema,
  prices: z.array(latestPriceSchema)
});

export const compareItemIdsSchema = z.array(idSchema);

export const comparePriceSnapshotSchema = z.object({
  price: moneyAmountSchema,
  unitPrice: moneyAmountSchema.optional(),
  priceType: priceTypeSchema,
  confidence: confidenceSchema,
  observedAt: isoDateTimeSchema
});

export const compareStoreItemPricesSchema = z.record(idSchema, comparePriceSnapshotSchema);
export const compareStoresSchema = z.record(idSchema, compareStoreItemPricesSchema);
export const compareMissingItemIdsSchema = z.array(idSchema);

export const compareResponseSchema = z.object({
  itemIds: compareItemIdsSchema,
  stores: compareStoresSchema,
  missingItemIds: compareMissingItemIdsSchema
});

export const apiContractSchemas = {
  alert: alertSchema,
  basket: basketSchema,
  basketItem: basketItemSchema,
  compareResponse: compareResponseSchema,
  latestPrice: latestPriceSchema,
  fuelPriceObservation: fuelPriceObservationSchema,
  fuelPriceSource: fuelPriceSourceSchema,
  fuelPricesResponse: fuelPricesResponseSchema,
  multiWeekStockUpCreateRow: multiWeekStockUpCreateRowSchema,
  multiWeekStockUpListResponse: multiWeekStockUpListResponseSchema,
  multiWeekStockUpRow: multiWeekStockUpRowSchema,
  multiWeekStockUpUpdateRow: multiWeekStockUpUpdateRowSchema,
  priceObservation: priceObservationSchema,
  product: productSchema,
  notificationInboxResponse: notificationInboxResponseSchema,
  productPricesResponse: productPricesResponseSchema,
  provenance: provenanceSchema,
  store: storeSchema,
  watchlist: watchlistSchema
} as const;

export type AlertDto = z.infer<typeof alertSchema>;
export type BasketDto = z.infer<typeof basketSchema>;
export type BasketItemDto = z.infer<typeof basketItemSchema>;
export type ComparePriceSnapshotDto = z.infer<typeof comparePriceSnapshotSchema>;
export type CompareResponseDto = z.infer<typeof compareResponseSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type FuelGrade = z.infer<typeof fuelGradeSchema>;
export type FuelPriceObservationDto = z.infer<typeof fuelPriceObservationSchema>;
export type FuelPriceSourceDto = z.infer<typeof fuelPriceSourceSchema>;
export type FuelPricesResponseDto = z.infer<typeof fuelPricesResponseSchema>;
export type LatestPriceDto = z.infer<typeof latestPriceSchema>;
export type MultiWeekStockUpConfidence = z.infer<typeof multiWeekStockUpConfidenceSchema>;
export type MultiWeekStockUpCreateRowDto = z.infer<typeof multiWeekStockUpCreateRowSchema>;
export type MultiWeekStockUpListResponseDto = z.infer<typeof multiWeekStockUpListResponseSchema>;
export type MultiWeekStockUpRowDto = z.infer<typeof multiWeekStockUpRowSchema>;
export type MultiWeekStockUpUpdateRowDto = z.infer<typeof multiWeekStockUpUpdateRowSchema>;
export type NotificationInboxQueueItemDto = z.infer<typeof notificationInboxQueueItemSchema>;
export type NotificationInboxResponseDto = z.infer<typeof notificationInboxResponseSchema>;
export type NotificationInboxSummaryDto = z.infer<typeof notificationInboxSummarySchema>;
export type PriceDomain = z.infer<typeof priceDomainSchema>;
export type PriceObservationDto = z.infer<typeof priceObservationSchema>;
export type PriceType = z.infer<typeof priceTypeSchema>;
export type ProductDto = z.infer<typeof productSchema>;
export type ProductPricesResponseDto = z.infer<typeof productPricesResponseSchema>;
export type ProvenanceDto = z.infer<typeof provenanceSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type StoreDto = z.infer<typeof storeSchema>;
export type WatchlistDto = z.infer<typeof watchlistSchema>;

export const apiContractOpenApiComponents = {
  PriceObservation: {
    type: 'object',
    required: ['id', 'productId', 'storeId', 'price', 'priceType', 'confidence', 'observedAt', 'sourceType', 'provenance'],
    properties: {
      id: { type: 'string' },
      domain: { type: 'string', enum: priceDomainSchema.options },
      productId: { type: 'string' },
      storeId: { type: 'string' },
      price: { $ref: '#/components/schemas/MoneyAmount' },
      unitPrice: { $ref: '#/components/schemas/MoneyAmount' },
      priceType: { type: 'string', enum: priceTypeSchema.options },
      confidence: { type: 'string', enum: confidenceSchema.options },
      observedAt: { type: 'string', format: 'date-time' },
      sourceType: { type: 'string', enum: sourceTypeSchema.options },
      provenance: { $ref: '#/components/schemas/Provenance' },
      memberOnly: { type: 'boolean' },
      promotion: { $ref: '#/components/schemas/Promotion' }
    }
  },
  FuelPriceObservation: {
    type: 'object',
    required: ['id', 'domain', 'productId', 'chainId', 'fuelGrade', 'pricePerLitre', 'observedAt', 'source', 'provenance'],
    properties: {
      id: { type: 'string' },
      domain: { type: 'string', enum: ['fuel'] },
      productId: { type: 'string' },
      chainId: { type: 'string' },
      storeId: { type: 'string' },
      fuelGrade: { type: 'string', enum: fuelGradeSchema.options },
      pricePerLitre: { $ref: '#/components/schemas/MoneyAmount' },
      observedAt: { type: 'string', format: 'date-time' },
      source: { $ref: '#/components/schemas/FuelPriceSource' },
      provenance: { $ref: '#/components/schemas/Provenance' }
    }
  },
  FuelPriceSource: {
    oneOf: [
      {
        type: 'object',
        required: ['kind', 'operatorId', 'operatorName', 'sourceUrl', 'capturedAt', 'parserVersion'],
        properties: {
          kind: { type: 'string', enum: ['operator_public_price_page'] },
          operatorId: { type: 'string' },
          operatorName: { type: 'string' },
          sourceUrl: { type: 'string', format: 'uri' },
          capturedAt: { type: 'string', format: 'date-time' },
          parserVersion: { type: 'string' }
        }
      },
      {
        type: 'object',
        required: ['kind', 'reporterTrustTier', 'stationId', 'submittedAt', 'evidenceType'],
        properties: {
          kind: { type: 'string', enum: ['crowd_station_report'] },
          reporterTrustTier: { type: 'string', enum: ['new', 'trusted', 'operator_verified'] },
          stationId: { type: 'string' },
          submittedAt: { type: 'string', format: 'date-time' },
          evidenceType: { type: 'string', enum: ['receipt', 'pump_photo', 'manual_entry'] }
        }
      }
    ]
  },
  MultiWeekStockUpRow: {
    type: 'object',
    required: [
      'rowId',
      'userId',
      'productId',
      'productName',
      'storeName',
      'planningWeeks',
      'weeklyNeedUnits',
      'packageUnits',
      'comparableUnit',
      'currentUnitPrice',
      'historicalLowUnitPrice',
      'typicalUnitPrice',
      'confidence',
      'historyWindowStart',
      'historyWindowEnd',
      'noForecastReason',
      'reviewTrigger',
      'updatedAt'
    ],
    properties: {
      rowId: { type: 'string' },
      userId: { type: 'string' },
      productId: { type: 'string' },
      productName: { type: 'string' },
      storeId: { type: 'string' },
      storeName: { type: 'string' },
      planningWeeks: { type: 'integer', minimum: 1, maximum: 26 },
      weeklyNeedUnits: { type: 'number', minimum: 0 },
      packageUnits: { type: 'number', minimum: 0 },
      comparableUnit: { type: 'string' },
      currentUnitPrice: { type: 'number', minimum: 0 },
      historicalLowUnitPrice: { type: 'number', minimum: 0 },
      typicalUnitPrice: { type: 'number', minimum: 0 },
      confidence: { type: 'string', enum: multiWeekStockUpConfidenceSchema.options },
      historyWindowStart: { type: 'string', format: 'date-time' },
      historyWindowEnd: { type: 'string', format: 'date-time' },
      storageLimitWeeks: { type: 'integer', minimum: 1, maximum: 26 },
      noForecastReason: { type: 'string' },
      reviewTrigger: { type: 'string' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  MultiWeekStockUpListResponse: {
    type: 'object',
    required: ['userId', 'itemCount', 'rows', 'guardrails', 'evidence'],
    properties: {
      userId: { type: 'string' },
      itemCount: { type: 'integer', minimum: 0 },
      rows: {
        type: 'array',
        items: { $ref: '#/components/schemas/MultiWeekStockUpRow' }
      },
      guardrails: {
        type: 'array',
        items: { type: 'string' }
      },
      evidence: {
        type: 'object',
        required: ['sourceTables', 'noForecast', 'historicalPriceFields'],
        properties: {
          sourceTables: {
            type: 'array',
            items: { type: 'string' }
          },
          noForecast: { type: 'boolean', enum: [true] },
          historicalPriceFields: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  },
  NotificationInboxQueueItem: {
    type: 'object',
    required: ['id', 'title', 'channel', 'status', 'reason', 'action', 'priority', 'sendAt'],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      channel: { type: 'string', enum: ['push', 'email', 'telegram'] },
      status: { type: 'string', enum: ['delivered', 'held', 'suppressed'] },
      reason: { type: 'string' },
      action: { type: 'string' },
      priority: { type: 'string', enum: ['normal', 'high'] },
      sendAt: { type: 'string', format: 'date-time' },
      productId: { type: 'string' }
    }
  },
  NotificationInboxSummary: {
    type: 'object',
    required: ['delivered', 'held', 'suppressed', 'total'],
    properties: {
      delivered: { type: 'integer', minimum: 0 },
      held: { type: 'integer', minimum: 0 },
      suppressed: { type: 'integer', minimum: 0 },
      total: { type: 'integer', minimum: 0 }
    }
  },
  NotificationInboxResponse: {
    type: 'object',
    required: [
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
    ],
    properties: {
      userId: { type: 'string' },
      generatedAt: { type: 'string', format: 'date-time' },
      trackedItemCount: { type: 'integer', minimum: 0 },
      activeAlertCount: { type: 'integer', minimum: 0 },
      deliveredCount: { type: 'integer', minimum: 0 },
      heldCount: { type: 'integer', minimum: 0 },
      suppressedCount: { type: 'integer', minimum: 0 },
      summary: { $ref: '#/components/schemas/NotificationInboxSummary' },
      queue: {
        type: 'array',
        items: { $ref: '#/components/schemas/NotificationInboxQueueItem' }
      },
      quietHoursWindow: { type: 'string' },
      guardrails: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  },
  Provenance: {
    type: 'object',
    required: ['sourceRunId', 'capturedAt', 'parserVersion'],
    properties: {
      sourceRunId: { type: 'string' },
      sourceUrl: { type: 'string', format: 'uri' },
      capturedAt: { type: 'string', format: 'date-time' },
      parserVersion: { type: 'string' },
      rawRecordId: { type: 'string' }
    }
  },
  MoneyAmount: {
    type: 'object',
    required: ['amount', 'currency'],
    properties: {
      amount: { type: 'number', minimum: 0 },
      currency: { type: 'string', enum: ['SEK'] }
    }
  },
  Promotion: {
    type: 'object',
    required: ['label'],
    properties: {
      label: { type: 'string' },
      startsAt: { type: 'string', format: 'date-time' },
      endsAt: { type: 'string', format: 'date-time' }
    }
  }
} as const;
