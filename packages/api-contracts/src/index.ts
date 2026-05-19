import { z } from 'zod';

export const PRICE_TYPES = [
  'regular',
  'promotion',
  'member',
  'online',
  'flyer',
  'in_store',
  'receipt',
  'shelf_photo',
  'manual',
  'estimated',
  'clearance',
] as const;

export const SOURCE_TYPES = [
  'retailer_page',
  'retailer_api',
  'flyer',
  'receipt',
  'shelf_photo',
  'manual_admin',
  'open_data',
  'estimated',
] as const;

export const CONFIDENCE_LABELS = [
  'verified',
  'high',
  'medium',
  'low',
  'estimated',
] as const;

export const CurrencyCodeSchema = z.literal('SEK');
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const ApiDemoFlagSchema = z.literal(true);

export const PriceTypeSchema = z.enum(PRICE_TYPES);
export const SourceTypeSchema = z.enum(SOURCE_TYPES);
export const PriceConfidenceSchema = z.enum(CONFIDENCE_LABELS);

export const PriceProvenanceSchema = z
  .object({
    sourceType: SourceTypeSchema,
    sourceName: z.string().min(1),
    sourceUrl: z.string().url().nullable(),
    sourceRunId: z.string().min(1),
    rawRecordId: z.string().min(1),
    rawSnapshotRef: z.string().min(1).nullable(),
    fetchedAt: IsoDateTimeSchema,
    observedAt: IsoDateTimeSchema,
    parserVersion: z.string().min(1),
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
    unitPriceAmount: z.number().nonnegative().nullable(),
    unitPriceUnit: z.string().min(1).nullable(),
    priceType: PriceTypeSchema,
    observedAt: IsoDateTimeSchema,
    sourceType: SourceTypeSchema,
    confidence: z.number().min(0).max(1),
    confidenceLabel: PriceConfidenceSchema,
    provenance: PriceProvenanceSchema,
    memberOnly: z.boolean(),
    promotionLabel: z.string().min(1).nullable(),
    validFrom: IsoDateTimeSchema.nullable(),
    validTo: IsoDateTimeSchema.nullable(),
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const PriceSeriesPointSchema = z
  .object({
    timestamp: IsoDateTimeSchema,
    value: z.number().nonnegative(),
    priceType: PriceTypeSchema,
    confidence: z.number().min(0).max(1),
    confidenceLabel: PriceConfidenceSchema,
    style: z.enum(['solid', 'dotted']),
    sourceType: SourceTypeSchema,
    provenance: PriceProvenanceSchema,
  })
  .strict();

export const ProductPriceSeriesSchema = z
  .object({
    productSlug: z.string().min(1),
    range: z.enum(['7d', '30d', '90d', '1y']),
    currency: CurrencyCodeSchema,
    unit: z.string().min(1),
    series: z.array(PriceSeriesPointSchema),
    demo: ApiDemoFlagSchema,
  })
  .strict();

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

export const ProductDetailSchema = ProductSummarySchema.extend({
  description: z.string().min(1),
  equivalentProductSlugs: z.array(z.string().min(1)),
  watchedByDemoUser: z.boolean(),
}).strict();

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

export const StoreDetailSchema = StoreSummarySchema.extend({
  address: z.string().min(1),
  openingHours: z.array(z.string().min(1)),
  chainSlug: z.string().min(1),
}).strict();

export const LatestStorePriceSchema = z
  .object({
    productSlug: z.string().min(1),
    storeSlug: z.string().min(1),
    observedAt: IsoDateTimeSchema,
    price: PriceObservationSchema,
  })
  .strict();

export const DealScoreSchema = z
  .object({
    productSlug: z.string().min(1),
    score: z.number().int().min(0).max(100),
    verdict: z.enum(['stock_up', 'buy_now', 'compare', 'wait', 'not_a_real_deal']),
    historicalPercentile: z.number().min(0).max(100),
    priceChange7dPercent: z.number(),
    confidenceLabel: PriceConfidenceSchema,
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
    selectedPriceTypes: z.array(PriceTypeSchema).optional(),
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
    priceType: PriceTypeSchema.optional(),
    confidenceLabel: PriceConfidenceSchema.optional(),
    demo: ApiDemoFlagSchema,
  })
  .strict();

export const WeeklyBasketSchema = z
  .object({
    id: z.string().min(1),
    weekStartsOn: IsoDateSchema,
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

export const ApiContractSchemas = {
  Alert: AlertSchema,
  DealScore: DealScoreSchema,
  LatestStorePrice: LatestStorePriceSchema,
  PriceObservation: PriceObservationSchema,
  PriceProvenance: PriceProvenanceSchema,
  PriceSeriesPoint: PriceSeriesPointSchema,
  ProductDetail: ProductDetailSchema,
  ProductPriceSeries: ProductPriceSeriesSchema,
  ProductSummary: ProductSummarySchema,
  StoreDetail: StoreDetailSchema,
  StoreSummary: StoreSummarySchema,
  WatchlistItem: WatchlistItemSchema,
  WeeklyBasket: WeeklyBasketSchema,
  WeeklyBasketItem: WeeklyBasketItemSchema,
} satisfies Record<string, z.ZodType>;

export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;
export type PriceType = z.infer<typeof PriceTypeSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type PriceConfidence = z.infer<typeof PriceConfidenceSchema>;
export type PriceProvenance = z.infer<typeof PriceProvenanceSchema>;
export type PriceObservation = z.infer<typeof PriceObservationSchema>;
export type PriceSeriesPoint = z.infer<typeof PriceSeriesPointSchema>;
export type LatestStorePrice = z.infer<typeof LatestStorePriceSchema>;
export type ProductPriceSeries = z.infer<typeof ProductPriceSeriesSchema>;
export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
export type StoreSummary = z.infer<typeof StoreSummarySchema>;
export type StoreDetail = z.infer<typeof StoreDetailSchema>;
export type DealScore = z.infer<typeof DealScoreSchema>;
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export type WeeklyBasketItem = z.infer<typeof WeeklyBasketItemSchema>;
export type WeeklyBasket = z.infer<typeof WeeklyBasketSchema>;
export type Alert = z.infer<typeof AlertSchema>;

export type ProductSummaryDto = ProductSummary;
export type StoreSummaryDto = StoreSummary;
export type ProductDetailDto = ProductDetail;
export type StoreDetailDto = StoreDetail;
export type PriceObservationDto = PriceObservation;
export type LatestStorePriceDto = LatestStorePrice;
export type ProductPriceSeriesDto = ProductPriceSeries;
export type WatchlistItemDto = WatchlistItem;
export type WeeklyBasketDto = WeeklyBasket;
export type AlertDto = Alert;
