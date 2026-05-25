import { z } from 'zod';

const sourceTypes = [
  'official_api',
  'retailer_online_page',
  'receipt_scan',
  'shelf_photo',
  'flyer_campaign',
  'manual_user_report',
  'estimated'
] as const;

const productKinds = ['branded', 'commodity'] as const;

const fuelSourceKinds = ['operator_public_price_page', 'crowd_station_report'] as const;

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = nonEmptyString.optional();
const nonNegativeNumber = z.number().finite().min(0);
const positiveNumber = z.number().finite().positive();

function isParseableDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

const optionalIsoDateString = nonEmptyString.refine(isParseableDate, 'must be a parseable ISO date').optional();

export const ingestRowSchema = z.object({
  sourceType: z.enum(sourceTypes),
  observedAt: nonEmptyString.refine(isParseableDate, 'must be a parseable ISO date'),
  parserVersion: nonEmptyString,
  rawSnapshotRef: nonEmptyString,
  sourceRunId: optionalNonEmptyString,
  chainId: nonEmptyString,
  storeId: optionalNonEmptyString,
  retailerProductId: optionalNonEmptyString,
  rawName: nonEmptyString,
  canonicalName: nonEmptyString,
  productId: nonEmptyString,
  categoryId: nonEmptyString,
  barcode: optionalNonEmptyString,
  productKind: z.enum(productKinds).optional(),
  commodityId: optionalNonEmptyString,
  fuelGradeId: optionalNonEmptyString,
  fuelSource: z.object({
    sourceKind: z.enum(fuelSourceKinds),
    fuelGradeId: nonEmptyString,
    originalPriceText: nonEmptyString,
    originalEffectiveDate: optionalIsoDateString
  }).strict().optional(),
  brand: optionalNonEmptyString,
  variant: optionalNonEmptyString,
  isOrganic: z.boolean().optional(),
  originCountry: nonEmptyString.regex(/^[A-Za-z]{2}$/, 'must be an ISO-3166 alpha-2 code').transform((value) => value.toUpperCase()).optional(),
  soldByWeight: z.boolean().optional(),
  packageSize: positiveNumber,
  packageUnit: nonEmptyString,
  price: nonNegativeNumber,
  regularPrice: nonNegativeNumber.optional(),
  promoText: optionalNonEmptyString,
  memberOnly: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  validFrom: optionalIsoDateString,
  validUntil: optionalIsoDateString,
  sourceUrl: optionalNonEmptyString,
  imageUrl: optionalNonEmptyString
}).strict().superRefine((row, ctx) => {
  if (row.validFrom && row.validUntil && Date.parse(row.validFrom) > Date.parse(row.validUntil)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['validUntil'],
      message: 'validUntil must be greater than or equal to validFrom'
    });
  }
});

export type IngestRow = z.infer<typeof ingestRowSchema>;

export function formatIngestRowZodIssues(issues: readonly z.ZodIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'row';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
