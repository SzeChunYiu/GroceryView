import { z } from 'zod';

const nonEmptyString = z.string().trim().min(1);

export const IngestRowSchema = z.object({
  source: nonEmptyString,
  connector: nonEmptyString,
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).default('SE'),
  observedAt: z.string().datetime(),
  chainId: nonEmptyString.optional(),
  chainName: nonEmptyString.optional(),
  storeId: nonEmptyString.optional(),
  storeName: nonEmptyString.optional(),
  productId: nonEmptyString.optional(),
  productName: nonEmptyString,
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  price: z.number().nonnegative(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('SEK'),
  unitPrice: z.number().nonnegative().optional(),
  unitPriceUnit: nonEmptyString.optional(),
  quantity: z.number().positive().optional(),
  availability: z.enum(['in_stock', 'out_of_stock', 'unknown']).default('unknown'),
  priceType: z.enum(['shelf', 'promotion', 'member', 'online', 'counter', 'unknown']).default('unknown'),
  url: z.string().url().optional(),
  raw: z.record(z.unknown()).optional()
}).strict();

export type IngestRow = z.infer<typeof IngestRowSchema>;

export type IngestContractLogger = Pick<Console, 'error'>;

export function validateIngestRow(row: unknown, logger: IngestContractLogger = console): IngestRow | null {
  const parsed = IngestRowSchema.safeParse(row);
  if (parsed.success) return parsed.data;

  logger.error('Rejected malformed ingest row', parsed.error.flatten());
  return null;
}

export function validateIngestRows(rows: unknown[], logger: IngestContractLogger = console): IngestRow[] {
  return rows.flatMap((row) => {
    const parsed = validateIngestRow(row, logger);
    return parsed ? [parsed] : [];
  });
}
