import { z } from 'zod';

const parseableDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'must be a parseable date');

export const IngestRow = z.object({
  sourceType: z.enum(['official_api', 'retailer_online_page', 'receipt_scan', 'shelf_photo', 'flyer_campaign', 'manual_user_report', 'estimated']),
  observedAt: parseableDate,
  parserVersion: z.string().min(1),
  rawSnapshotRef: z.string().min(1),
  sourceRunId: z.string().min(1).optional(),
  chainId: z.string().min(1),
  storeId: z.string().min(1).optional(),
  retailerProductId: z.string().min(1).optional(),
  rawName: z.string().min(1),
  canonicalName: z.string().min(1),
  productId: z.string().min(1),
  categoryId: z.string().min(1),
  barcode: z.string().min(1).optional(),
  productKind: z.enum(['branded', 'commodity']).optional(),
  commodityId: z.string().min(1).optional(),
  fuelGradeId: z.string().min(1).optional(),
  fuelSource: z.object({
    sourceKind: z.enum(['operator', 'crowd']),
    fuelGradeId: z.string().min(1),
    originalPriceText: z.string().min(1),
    originalEffectiveDate: z.string().min(1).optional()
  }).optional(),
  brand: z.string().min(1).optional(),
  variant: z.string().min(1).optional(),
  isOrganic: z.boolean().optional(),
  originCountry: z.string().regex(/^[A-Za-z]{2}$/).optional(),
  soldByWeight: z.boolean().optional(),
  packageSize: z.number().positive(),
  packageUnit: z.string().min(1),
  price: z.number().nonnegative(),
  regularPrice: z.number().nonnegative().optional(),
  promoText: z.string().min(1).optional(),
  memberOnly: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  validFrom: parseableDate.optional(),
  validUntil: parseableDate.optional(),
  sourceUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional()
}).strict();

export type IngestRow = z.infer<typeof IngestRow>;

export type IngestRowValidationError = {
  row: unknown;
  reason: string;
};

export function validateIngestRow(row: unknown, logError: (message: string) => void = console.error): IngestRow | null {
  const parsed = IngestRow.safeParse(row);
  if (parsed.success) return parsed.data;

  const reason = parsed.error.issues.map((issue) => `${issue.path.join('.') || '<row>'}: ${issue.message}`).join('; ');
  logError(`Rejected malformed ingest row: ${reason}`);
  return null;
}
