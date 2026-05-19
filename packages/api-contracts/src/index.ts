import { z } from 'zod';

export const CurrencyCodeSchema = z.literal('SEK');
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const ApiDemoFlagSchema = z.literal(true);

export const ProductSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    brand: z.string().min(1),
    category: z.string().min(1),
    unit: z.string().min(1),
    currency: CurrencyCodeSchema,
    currentBestPrice: z.number().nonnegative(),
    currentBestStore: z.string().min(1),
    dealScore: z.number().int().min(0).max(100),
    lastObservedAt: IsoDateTimeSchema,
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const StoreSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    chain: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    priceLevelIndex: z.number().nonnegative(),
    lastObservedAt: IsoDateTimeSchema,
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const PriceTypeSchema = z.enum([
  'regular',
  'promotion',
  'member',
  'online',
  'in_store',
  'flyer',
  'receipt',
  'shelf_photo',
  'manual',
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

export const PriceConfidenceSchema = z
  .object({
    score: z.number().min(0).max(1),
    label: z.enum(['high', 'medium', 'low', 'unverified']),
  })
  .strict();

export const PriceProvenanceSchema = z
  .object({
    sourceUrl: z.string().url().nullable(),
    sourceType: SourceTypeSchema,
    observedAt: IsoDateTimeSchema,
    parserVersion: z.string().min(1),
    rawSnapshotRef: z.string().min(1),
  })
  .strict();

export const PriceObservationSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    storeSlug: z.string().min(1),
    priceAmount: z.number().nonnegative(),
    currency: CurrencyCodeSchema,
    unit: z.string().min(1),
    priceType: PriceTypeSchema,
    observedAt: IsoDateTimeSchema,
    sourceType: SourceTypeSchema,
    confidence: PriceConfidenceSchema,
    provenance: PriceProvenanceSchema,
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const LatestPriceSchema = PriceObservationSchema.extend({
  validFrom: IsoDateTimeSchema,
  validTo: IsoDateTimeSchema.nullable(),
}).strict();

export const PromotionObservationSchema = PriceObservationSchema.extend({
  priceType: z.enum(['promotion', 'member', 'flyer']),
  promotionLabel: z.string().min(1),
  compareAtPriceAmount: z.number().nonnegative().nullable(),
  startsAt: IsoDateTimeSchema.nullable(),
  endsAt: IsoDateTimeSchema.nullable(),
}).strict();

export const DealScoreSchema = z
  .object({
    productSlug: z.string().min(1),
    score: z.number().int().min(0).max(100),
    verdict: z.enum(['stock_up', 'buy_now', 'compare', 'wait', 'not_a_real_deal']),
    historicalPercentile: z.number().min(0).max(100),
    priceChange7dPercent: z.number(),
    reasons: z.array(z.string().min(1)),
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const WatchlistItemSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    targetPrice: z.number().nonnegative().nullable(),
    currency: CurrencyCodeSchema,
    currentBestPrice: z.number().nonnegative(),
    alertEnabled: z.boolean(),
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const WeeklyBasketItemSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().int().min(1),
    unit: z.string().min(1),
    bestPrice: z.number().nonnegative(),
    bestStoreSlug: z.string().min(1),
    currency: CurrencyCodeSchema,
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const WeeklyBasketSchema = z
  .object({
    id: z.string().min(1),
    weekStartsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    currency: CurrencyCodeSchema,
    estimatedTotal: z.number().nonnegative(),
    savingsVsMedian: z.number(),
    items: z.array(WeeklyBasketItemSchema),
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const AlertSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['target_price', 'basket_drop']),
    title: z.string().min(1),
    productSlug: z.string().min(1).nullable(),
    thresholdAmount: z.number().nonnegative().nullable(),
    currency: CurrencyCodeSchema,
    active: z.boolean(),
    lastTriggeredAt: IsoDateTimeSchema.nullable(),
    demo: ApiDemoFlagSchema,
  })
  .strict();

export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type StoreSummary = z.infer<typeof StoreSummarySchema>;
export type PriceType = z.infer<typeof PriceTypeSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type PriceConfidence = z.infer<typeof PriceConfidenceSchema>;
export type PriceProvenance = z.infer<typeof PriceProvenanceSchema>;
export type PriceObservation = z.infer<typeof PriceObservationSchema>;
export type LatestPrice = z.infer<typeof LatestPriceSchema>;
export type PromotionObservation = z.infer<typeof PromotionObservationSchema>;
export type DealScore = z.infer<typeof DealScoreSchema>;
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export type WeeklyBasketItem = z.infer<typeof WeeklyBasketItemSchema>;
export type WeeklyBasket = z.infer<typeof WeeklyBasketSchema>;
export type Alert = z.infer<typeof AlertSchema>;
