import { z } from 'zod';

export const CurrencyCodeSchema = z.literal('SEK');
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const PriceTypeSchema = z.enum([
  'online',
  'flyer',
  'member',
  'in_store',
  'receipt',
  'shelf_photo',
  'manual',
  'estimated'
]);

export const SourceTypeSchema = z.enum([
  'retailer_page',
  'retailer_api',
  'flyer',
  'receipt',
  'shelf_photo',
  'manual_admin',
  'open_data',
  'estimated'
]);

export const ConfidenceSchema = z.object({
  score: z.number().min(0).max(1),
  label: z.enum(['high', 'medium', 'low', 'unverified'])
});

export const PriceProvenanceSchema = z.object({
  sourceType: SourceTypeSchema,
  sourceUrl: z.string().url().nullable(),
  observedAt: IsoDateTimeSchema,
  parserVersion: z.string().min(1),
  rawSnapshotRef: z.string().min(1)
});

export const ProductSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1).nullable(),
  category: z.string().min(1),
  unit: z.string().min(1)
});

export const StoreSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  chain: z.string().min(1),
  city: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const PriceObservationSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  storeId: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: CurrencyCodeSchema,
  unitPrice: z.number().nonnegative().nullable(),
  unit: z.string().min(1),
  priceType: PriceTypeSchema,
  confidence: ConfidenceSchema,
  observedAt: IsoDateTimeSchema,
  sourceType: SourceTypeSchema,
  provenance: PriceProvenanceSchema
});

export const WatchlistItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  targetPrice: z.number().nonnegative().nullable(),
  priceTypes: z.array(PriceTypeSchema).min(1),
  active: z.boolean()
});

export const BasketItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  preferredStoreIds: z.array(z.string().min(1))
});

export const AlertSchema = z.object({
  id: z.string().min(1),
  watchlistItemId: z.string().min(1),
  triggeredAt: IsoDateTimeSchema,
  price: PriceObservationSchema
});

export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;
export type PriceType = z.infer<typeof PriceTypeSchema>;
export type SourceType = z.infer<typeof SourceTypeSchema>;
export type Confidence = z.infer<typeof ConfidenceSchema>;
export type PriceProvenance = z.infer<typeof PriceProvenanceSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Store = z.infer<typeof StoreSchema>;
export type PriceObservation = z.infer<typeof PriceObservationSchema>;
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;
export type BasketItem = z.infer<typeof BasketItemSchema>;
export type Alert = z.infer<typeof AlertSchema>;
