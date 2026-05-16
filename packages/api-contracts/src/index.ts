import { z } from 'zod';

export const CurrencyCodeSchema = z.enum(['SEK']);
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const DemoDataSchema = z.literal(true).describe('True when the response contains seed/demo data rather than live retailer data.');

export const PriceTypeSchema = z.enum([
  'regular',
  'promotion',
  'member',
  'online',
  'in_store',
  'clearance',
  'estimated',
]);

export const SourceTypeSchema = z.enum([
  'retailer_page',
  'retailer_api',
  'flyer',
  'receipt',
  'shelf_photo',
  'manual_admin',
  'open_data',
  'estimated',
]);

export const ConfidenceBandSchema = z.enum(['verified', 'high', 'medium', 'low', 'estimated']);

export const ProductSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    brand: z.string().min(1).nullable(),
    category: z.string().min(1),
    quantity: z.number().positive().nullable(),
    unit: z.string().min(1),
    currency: CurrencyCodeSchema,
    currentBestPrice: z.number().nonnegative().nullable(),
    currentBestStoreSlug: z.string().min(1).nullable(),
    currentBestStoreName: z.string().min(1).nullable(),
    lastObservedAt: IsoDateTimeSchema.nullable(),
    confidenceBand: ConfidenceBandSchema,
    demo: DemoDataSchema,
  })
  .strict();

export const StoreSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    chain: z.string().min(1),
    format: z.string().min(1).nullable(),
    city: z.string().min(1),
    district: z.string().min(1).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    lastObservedAt: IsoDateTimeSchema.nullable(),
    demo: DemoDataSchema,
  })
  .strict();

export const PriceObservationSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().min(1),
    productSlug: z.string().min(1),
    storeId: z.string().min(1).nullable(),
    storeSlug: z.string().min(1).nullable(),
    observedAt: IsoDateTimeSchema,
    validFrom: IsoDateTimeSchema.nullable(),
    validTo: IsoDateTimeSchema.nullable(),
    price: z.number().nonnegative(),
    unitPrice: z.number().nonnegative().nullable(),
    currency: CurrencyCodeSchema,
    unit: z.string().min(1),
    priceType: PriceTypeSchema,
    sourceType: SourceTypeSchema,
    sourceUrl: z.string().url().nullable(),
    confidenceScore: z.number().min(0).max(1),
    confidenceBand: ConfidenceBandSchema,
    demo: DemoDataSchema,
  })
  .strict();

export const DealScoreSchema = z
  .object({
    productId: z.string().min(1),
    productSlug: z.string().min(1),
    score: z.number().int().min(0).max(100),
    band: z.enum(['excellent', 'good', 'fair', 'weak', 'unknown']),
    verdict: z.enum(['stock_up', 'buy_now', 'compare', 'wait', 'not_a_real_deal', 'unknown']),
    discountVsMedianPercent: z.number().nullable(),
    historicalPercentile: z.number().min(0).max(100).nullable(),
    confidenceBand: ConfidenceBandSchema,
    reasons: z.array(z.string().min(1)),
    demo: DemoDataSchema,
  })
  .strict();

export const WatchlistItemSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().min(1),
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    targetPrice: z.number().nonnegative().nullable(),
    percentDropThreshold: z.number().min(0).max(100).nullable(),
    acceptedPriceTypes: z.array(PriceTypeSchema).min(1),
    currentBestPrice: z.number().nonnegative().nullable(),
    currency: CurrencyCodeSchema,
    alertEnabled: z.boolean(),
    createdAt: IsoDateTimeSchema,
    demo: DemoDataSchema,
  })
  .strict();

export const WeeklyBasketItemSchema = z
  .object({
    id: z.string().min(1),
    productId: z.string().min(1),
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    estimatedPrice: z.number().nonnegative().nullable(),
    bestStoreSlug: z.string().min(1).nullable(),
    priceMissing: z.boolean(),
  })
  .strict();

export const WeeklyBasketSchema = z
  .object({
    id: z.string().min(1),
    weekStartsOn: IsoDateSchema,
    currency: CurrencyCodeSchema,
    estimatedTotal: z.number().nonnegative(),
    selectedStoreSlugs: z.array(z.string().min(1)),
    items: z.array(WeeklyBasketItemSchema),
    missingPriceCount: z.number().int().nonnegative(),
    demo: DemoDataSchema,
  })
  .strict();

export const AlertSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['target_price', 'percent_drop', 'basket_drop', 'back_in_stock']),
    title: z.string().min(1),
    productId: z.string().min(1).nullable(),
    productSlug: z.string().min(1).nullable(),
    thresholdPrice: z.number().nonnegative().nullable(),
    thresholdPercent: z.number().min(0).max(100).nullable(),
    currency: CurrencyCodeSchema,
    status: z.enum(['active', 'paused', 'triggered', 'expired']),
    lastTriggeredAt: IsoDateTimeSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    demo: DemoDataSchema,
  })
  .strict();

export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;
export type PriceType = z.infer<typeof PriceTypeSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type ConfidenceBand = z.infer<typeof ConfidenceBandSchema>;
export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type StoreSummary = z.infer<typeof StoreSummarySchema>;
export type PriceObservation = z.infer<typeof PriceObservationSchema>;
export type DealScore = z.infer<typeof DealScoreSchema>;
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export type WeeklyBasketItem = z.infer<typeof WeeklyBasketItemSchema>;
export type WeeklyBasket = z.infer<typeof WeeklyBasketSchema>;
export type Alert = z.infer<typeof AlertSchema>;
