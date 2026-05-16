import { z } from 'zod';

export const CurrencySchema = z.enum(['SEK']);

export const PriceTypeSchema = z.enum([
  'regular',
  'promotion',
  'member',
  'online',
  'estimated',
]);

export const SourceTypeSchema = z.enum([
  'retailer_page',
  'flyer',
  'receipt',
  'shelf_photo',
  'manual',
  'seed/demo',
]);

export const ProductSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    brand: z.string().min(1).nullable(),
    category: z.string().min(1),
    unit: z.string().min(1),
    currency: CurrencySchema,
    currentBestPrice: z.number().nonnegative().nullable(),
    currentBestStoreSlug: z.string().min(1).nullable(),
    dealScore: z.number().int().min(0).max(100).nullable(),
    lastObservedAt: z.string().datetime({ offset: true }).nullable(),
    demo: z.boolean().optional(),
  })
  .strict();

export const StoreSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    chain: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1).nullable(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    priceLevelIndex: z.number().nonnegative().nullable(),
    lastObservedAt: z.string().datetime({ offset: true }).nullable(),
    demo: z.boolean().optional(),
  })
  .strict();

export const PriceObservationSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    storeSlug: z.string().min(1),
    priceAmount: z.number().nonnegative(),
    currency: CurrencySchema,
    unit: z.string().min(1),
    priceType: PriceTypeSchema,
    observedAt: z.string().datetime({ offset: true }),
    lastVerifiedAt: z.string().datetime({ offset: true }).nullable(),
    sourceType: SourceTypeSchema,
    confidenceScore: z.number().min(0).max(1),
    demo: z.boolean().optional(),
  })
  .strict();

export const DealScoreSchema = z
  .object({
    productSlug: z.string().min(1),
    score: z.number().int().min(0).max(100),
    band: z.enum(['stock_up', 'buy', 'compare', 'wait', 'not_a_deal']),
    verdict: z.string().min(1),
    discountVsMedianPercent: z.number(),
    historicalPercentile: z.number().min(0).max(100),
    confidenceScore: z.number().min(0).max(1),
    reasons: z.array(z.string().min(1)),
    demo: z.boolean().optional(),
  })
  .strict();

export const WatchlistItemSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    targetPrice: z.number().nonnegative().nullable(),
    targetPercentDrop: z.number().min(0).max(100).nullable(),
    priceTypes: z.array(PriceTypeSchema),
    currency: CurrencySchema,
    currentBestPrice: z.number().nonnegative().nullable(),
    alertEnabled: z.boolean(),
    demo: z.boolean().optional(),
  })
  .strict();

export const WeeklyBasketItemSchema = z
  .object({
    id: z.string().min(1),
    productSlug: z.string().min(1),
    productName: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    bestPrice: z.number().nonnegative().nullable(),
    bestStoreSlug: z.string().min(1).nullable(),
    currency: CurrencySchema,
    estimated: z.boolean(),
  })
  .strict();

export const WeeklyBasketSchema = z
  .object({
    id: z.string().min(1),
    weekStartsOn: z.string().date(),
    currency: CurrencySchema,
    estimatedTotal: z.number().nonnegative(),
    savingsVsMedian: z.number(),
    selectedStoreSlugs: z.array(z.string().min(1)),
    items: z.array(WeeklyBasketItemSchema),
    demo: z.boolean().optional(),
  })
  .strict();

export const AlertSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(['target_price', 'percent_drop', 'basket_drop', 'index_move']),
    title: z.string().min(1),
    productSlug: z.string().min(1).nullable(),
    thresholdAmount: z.number().nonnegative().nullable(),
    thresholdPercent: z.number().min(0).max(100).nullable(),
    currency: CurrencySchema.nullable(),
    active: z.boolean(),
    lastTriggeredAt: z.string().datetime({ offset: true }).nullable(),
    demo: z.boolean().optional(),
  })
  .strict();

export type Currency = z.infer<typeof CurrencySchema>;
export type PriceType = z.infer<typeof PriceTypeSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type StoreSummary = z.infer<typeof StoreSummarySchema>;
export type PriceObservation = z.infer<typeof PriceObservationSchema>;
export type DealScore = z.infer<typeof DealScoreSchema>;
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export type WeeklyBasketItem = z.infer<typeof WeeklyBasketItemSchema>;
export type WeeklyBasket = z.infer<typeof WeeklyBasketSchema>;
export type Alert = z.infer<typeof AlertSchema>;
