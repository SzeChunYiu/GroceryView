import { z } from 'zod';

export const idSchema = z.string().trim().min(1);
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const priceTypeSchema = z.enum(['shelf', 'member', 'promotion', 'estimated']);
export const confidenceSchema = z.enum(['high', 'medium', 'low', 'unverified']);
export const sourceTypeSchema = z.enum(['retailer_api', 'retailer_page', 'receipt_scan', 'manual_review', 'seed_stub']);

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

export const latestPriceSchema = priceObservationSchema.extend({
  supersedesObservationIds: z.array(idSchema).default([])
});

export const watchlistSchema = z.object({
  id: idSchema,
  userId: idSchema,
  productId: idSchema,
  targetPrice: moneyAmountSchema.optional(),
  minimumDealScore: z.number().min(0).max(100).optional(),
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

export const productPricesResponseSchema = z.object({
  product: productSchema,
  prices: z.array(latestPriceSchema)
});

export const apiContractSchemas = {
  alert: alertSchema,
  basket: basketSchema,
  basketItem: basketItemSchema,
  latestPrice: latestPriceSchema,
  priceObservation: priceObservationSchema,
  product: productSchema,
  productPricesResponse: productPricesResponseSchema,
  provenance: provenanceSchema,
  store: storeSchema,
  watchlist: watchlistSchema
} as const;

export type AlertDto = z.infer<typeof alertSchema>;
export type BasketDto = z.infer<typeof basketSchema>;
export type BasketItemDto = z.infer<typeof basketItemSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type LatestPriceDto = z.infer<typeof latestPriceSchema>;
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
