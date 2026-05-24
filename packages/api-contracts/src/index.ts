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

export const friendDealShareScopeSchema = z.enum(['household', 'friend']);
export const friendDealShareSignalKindSchema = z.enum(['spotted_deal', 'price_drop', 'coupon', 'expiry_markdown']);

export const friendDealShareSignalRequestSchema = z.object({
  productId: idSchema,
  scope: friendDealShareScopeSchema,
  signal: friendDealShareSignalKindSchema,
  consented: z.literal(true),
  sourceUserId: idSchema.optional(),
  sourceDisplayName: idSchema.optional(),
  note: z.string().trim().min(1).max(280).optional(),
  sharedAt: isoDateTimeSchema.optional(),
  expiresAt: isoDateTimeSchema.optional()
});

export const friendDealShareSignalSchema = z.object({
  id: idSchema,
  userId: idSchema,
  sourceUserId: idSchema,
  productId: idSchema,
  productName: idSchema,
  scope: friendDealShareScopeSchema,
  signal: friendDealShareSignalKindSchema,
  consented: z.literal(true),
  createdAt: isoDateTimeSchema,
  sourceDisplayName: idSchema.optional(),
  note: z.string().trim().min(1).max(280).optional(),
  expiresAt: isoDateTimeSchema.optional()
});

export const friendDealShareSignalResponseSchema = z.object({
  userId: idSchema,
  signalCount: z.number().int().nonnegative(),
  signals: z.array(friendDealShareSignalSchema),
  suggestionProductIds: z.array(idSchema),
  guardrails: z.array(idSchema)
});

export const productPricesResponseSchema = z.object({
  product: productSchema,
  prices: z.array(latestPriceSchema)
});

export const apiContractSchemas = {
  alert: alertSchema,
  basket: basketSchema,
  basketItem: basketItemSchema,
  latestPrice: latestPriceSchema,
  fuelPriceObservation: fuelPriceObservationSchema,
  fuelPriceSource: fuelPriceSourceSchema,
  fuelPricesResponse: fuelPricesResponseSchema,
  friendDealShareSignal: friendDealShareSignalSchema,
  friendDealShareSignalRequest: friendDealShareSignalRequestSchema,
  friendDealShareSignalResponse: friendDealShareSignalResponseSchema,
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
export type Confidence = z.infer<typeof confidenceSchema>;
export type FuelGrade = z.infer<typeof fuelGradeSchema>;
export type FuelPriceObservationDto = z.infer<typeof fuelPriceObservationSchema>;
export type FuelPriceSourceDto = z.infer<typeof fuelPriceSourceSchema>;
export type FuelPricesResponseDto = z.infer<typeof fuelPricesResponseSchema>;
export type FriendDealShareScopeDto = z.infer<typeof friendDealShareScopeSchema>;
export type FriendDealShareSignalDto = z.infer<typeof friendDealShareSignalSchema>;
export type FriendDealShareSignalKindDto = z.infer<typeof friendDealShareSignalKindSchema>;
export type FriendDealShareSignalRequestDto = z.infer<typeof friendDealShareSignalRequestSchema>;
export type FriendDealShareSignalResponseDto = z.infer<typeof friendDealShareSignalResponseSchema>;
export type LatestPriceDto = z.infer<typeof latestPriceSchema>;
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
  FriendDealShareSignal: {
    type: 'object',
    required: ['id', 'userId', 'sourceUserId', 'productId', 'productName', 'scope', 'signal', 'consented', 'createdAt'],
    properties: {
      id: { type: 'string' },
      userId: { type: 'string' },
      sourceUserId: { type: 'string' },
      productId: { type: 'string' },
      productName: { type: 'string' },
      scope: { type: 'string', enum: friendDealShareScopeSchema.options },
      signal: { type: 'string', enum: friendDealShareSignalKindSchema.options },
      consented: { type: 'boolean', const: true },
      createdAt: { type: 'string', format: 'date-time' },
      sourceDisplayName: { type: 'string' },
      note: { type: 'string', maxLength: 280 },
      expiresAt: { type: 'string', format: 'date-time' }
    }
  },
  FriendDealShareSignalRequest: {
    type: 'object',
    required: ['productId', 'scope', 'signal', 'consented'],
    properties: {
      productId: { type: 'string' },
      scope: { type: 'string', enum: friendDealShareScopeSchema.options },
      signal: { type: 'string', enum: friendDealShareSignalKindSchema.options },
      consented: { type: 'boolean', const: true },
      sourceUserId: { type: 'string' },
      sourceDisplayName: { type: 'string' },
      note: { type: 'string', maxLength: 280 },
      sharedAt: { type: 'string', format: 'date-time' },
      expiresAt: { type: 'string', format: 'date-time' }
    }
  },
  FriendDealShareSignalResponse: {
    type: 'object',
    required: ['userId', 'signalCount', 'signals', 'suggestionProductIds', 'guardrails'],
    properties: {
      userId: { type: 'string' },
      signalCount: { type: 'integer', minimum: 0 },
      signals: {
        type: 'array',
        items: { $ref: '#/components/schemas/FriendDealShareSignal' }
      },
      suggestionProductIds: {
        type: 'array',
        items: { type: 'string' }
      },
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
