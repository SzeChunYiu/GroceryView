import type { QueryExecutor } from '@groceryview/db';
import { formatIngestRowZodIssues, ingestRowSchema, type IngestRow } from './contract.js';

const DEFAULT_DAILY_PERSIST_BATCH_SIZE = 1000;

/**
 * Resolve the per-query batch size for chunked persistence. Large connectors
 * (e.g. ICA, ~97,800 rows) otherwise feed one unbounded array into a single
 * `jsonb_to_recordset(...)` query that plans/executes for many minutes and
 * effectively hangs. Bounding each query keeps behaviour identical while
 * avoiding the churn. Configurable via `GROCERYVIEW_DAILY_PERSIST_BATCH_SIZE`.
 */
function resolveDailyPersistBatchSize(): number {
  const raw = process.env.GROCERYVIEW_DAILY_PERSIST_BATCH_SIZE;
  if (raw === undefined || raw.trim() === '') return DEFAULT_DAILY_PERSIST_BATCH_SIZE;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_DAILY_PERSIST_BATCH_SIZE;
  return parsed;
}

/** Split an array into contiguous batches of at most `size` elements. */
function batchRows<T>(rows: readonly T[], size: number): T[][] {
  const safeSize = Number.isFinite(size) && size >= 1 ? Math.floor(size) : DEFAULT_DAILY_PERSIST_BATCH_SIZE;
  const batches: T[][] = [];
  for (let index = 0; index < rows.length; index += safeSize) {
    batches.push(rows.slice(index, index + safeSize));
  }
  return batches;
}

export type IngestPipelineStageId = 'fetch' | 'normalize' | 'match' | 'store';
export type IngestPipelineStageStatus = 'started' | 'retrying' | 'succeeded' | 'failed';

export type IngestPipelineEvent = {
  stage: IngestPipelineStageId;
  status: IngestPipelineStageStatus;
  attempt: number;
  rowCount?: number;
  chunkIndex?: number;
  durationMs?: number;
  error?: string;
};

export type IngestPipelineObserver = (event: IngestPipelineEvent) => void | Promise<void>;

export type IngestPipelineRetryPolicy = {
  attempts?: number;
  baseDelayMs?: number;
};

export type RawIngestPayload = {
  sourceRef: string;
  body: string | Uint8Array | unknown;
  contentType?: string;
  retrievedAt?: string;
};

export type CanonicalProductMatch = {
  canonical_id: string;
  score: number;
  method: 'ean' | 'brand+name' | 'fuzzy' | 'manual' | string;
};

export type MatchedIngestRow = IngestRow & {
  canonical_id: string;
  match: CanonicalProductMatch;
};

export type IngestPipelineStoreResult = {
  listingCount: number;
  observationCount: number;
  promotionCount: number;
};

export type IngestPipelineInput = {
  fetchRaw: () => RawIngestPayload[] | Promise<RawIngestPayload[]>;
  normalize?: (payload: RawIngestPayload) => IngestRow[] | Promise<IngestRow[]>;
  match: (row: IngestRow) => CanonicalProductMatch | Promise<CanonicalProductMatch>;
  storeChunk: (rows: MatchedIngestRow[], chunkIndex: number) => IngestPipelineStoreResult | Promise<IngestPipelineStoreResult>;
  chunkSize?: number;
  retry?: Partial<Record<IngestPipelineStageId, IngestPipelineRetryPolicy>>;
  observe?: IngestPipelineObserver;
};

export type IngestPipelineResult = {
  fetchedPayloads: number;
  normalizedRows: number;
  matchedRows: number;
  listingCount: number;
  observationCount: number;
  promotionCount: number;
};

export type PostgresIngestPipelineStoreInput = {
  executor: QueryExecutor;
  rows: MatchedIngestRow[];
};

const DEFAULT_CHUNK_SIZE = 500;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function emit(observe: IngestPipelineObserver | undefined, event: IngestPipelineEvent): Promise<void> {
  await observe?.(event);
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRetryableStage<T>(
  stage: IngestPipelineStageId,
  retry: IngestPipelineRetryPolicy | undefined,
  observe: IngestPipelineObserver | undefined,
  operation: (attempt: number) => T | Promise<T>,
  event: Partial<Pick<IngestPipelineEvent, 'rowCount' | 'chunkIndex'>> = {}
): Promise<T> {
  const attempts = Math.max(1, retry?.attempts ?? 1);
  const baseDelayMs = Math.max(0, retry?.baseDelayMs ?? 0);
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await emit(observe, { stage, status: attempt === 1 ? 'started' : 'retrying', attempt, ...event });
    try {
      const result = await operation(attempt);
      await emit(observe, { stage, status: 'succeeded', attempt, durationMs: Date.now() - startedAt, ...event });
      return result;
    } catch (error) {
      if (attempt >= attempts) {
        await emit(observe, {
          stage,
          status: 'failed',
          attempt,
          durationMs: Date.now() - startedAt,
          error: errorMessage(error),
          ...event
        });
        throw error;
      }
      await emit(observe, {
        stage,
        status: 'retrying',
        attempt,
        durationMs: Date.now() - startedAt,
        error: errorMessage(error),
        ...event
      });
      await wait(baseDelayMs * attempt);
    }
  }

  throw new Error(`Ingest pipeline stage retry loop exhausted: ${stage}`);
}

function unknownRowsFromPayload(payload: RawIngestPayload): unknown[] {
  const raw = payload.body instanceof Uint8Array ? new TextDecoder().decode(payload.body) : payload.body;
  const value = typeof raw === 'string' && (/json/i.test(payload.contentType ?? '') || /^[\s]*[\[{]/.test(raw))
    ? JSON.parse(raw) as unknown
    : raw;

  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['rows', 'items', 'data', 'products']) {
      const rows = record[key];
      if (Array.isArray(rows)) return rows;
    }
  }
  throw new Error(`Raw ingest payload did not contain an array of rows: ${payload.sourceRef}`);
}

export function normalizeIngestPayload(payload: RawIngestPayload): IngestRow[] {
  return unknownRowsFromPayload(payload).map((row, index) => {
    const result = ingestRowSchema.safeParse(row);
    if (!result.success) {
      throw new Error(`Invalid IngestRow at ${payload.sourceRef}[${index}]: ${formatIngestRowZodIssues(result.error.issues)}`);
    }
    return result.data;
  });
}

export async function matchIngestRows(
  rows: readonly IngestRow[],
  match: IngestPipelineInput['match']
): Promise<MatchedIngestRow[]> {
  const matched: MatchedIngestRow[] = [];
  for (const row of rows) {
    const productMatch = await match(row);
    if (!productMatch.canonical_id.trim()) throw new Error(`match() did not attach canonical_id for ${row.rawName}`);
    matched.push({ ...row, canonical_id: productMatch.canonical_id, match: productMatch });
  }
  return matched;
}

function chunks<T>(values: readonly T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

export async function runIngestPipeline(input: IngestPipelineInput): Promise<IngestPipelineResult> {
  const chunkSize = Math.max(1, input.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const fetched = await runRetryableStage('fetch', input.retry?.fetch, input.observe, input.fetchRaw);

  const normalized = (await Promise.all(fetched.map((payload) =>
    runRetryableStage('normalize', input.retry?.normalize, input.observe, () =>
      (input.normalize ?? normalizeIngestPayload)(payload)
    )
  ))).flat();

  const matched = await runRetryableStage(
    'match',
    input.retry?.match,
    input.observe,
    () => matchIngestRows(normalized, input.match),
    { rowCount: normalized.length }
  );

  const stored = {
    listingCount: 0,
    observationCount: 0,
    promotionCount: 0
  };

  for (const [chunkIndex, chunk] of chunks(matched, chunkSize).entries()) {
    const result = await runRetryableStage(
      'store',
      input.retry?.store,
      input.observe,
      () => input.storeChunk(chunk, chunkIndex),
      { rowCount: chunk.length, chunkIndex }
    );
    stored.listingCount += result.listingCount;
    stored.observationCount += result.observationCount;
    stored.promotionCount += result.promotionCount;
  }

  return {
    fetchedPayloads: fetched.length,
    normalizedRows: normalized.length,
    matchedRows: matched.length,
    ...stored
  };
}

function numericPackage(row: IngestRow, unit: string): number | null {
  return row.packageUnit.toLowerCase() === unit ? row.packageSize : null;
}

export async function storeMatchedIngestRowsPostgres(input: PostgresIngestPipelineStoreInput): Promise<IngestPipelineStoreResult> {
  const { executor, rows } = input;
  if (rows.length === 0) return { listingCount: 0, observationCount: 0, promotionCount: 0 };

  const listingRows = rows.map((row, ordinal) => ({
    ordinal,
    chain: row.chainId,
    chain_sku_id: row.retailerProductId ?? row.productId,
    canonical_id: row.canonical_id,
    name: row.rawName,
    brand: row.brand ?? null,
    weight_grams: numericPackage(row, 'g') ?? numericPackage(row, 'gram'),
    volume_ml: numericPackage(row, 'ml'),
    unit_count: numericPackage(row, 'st') ?? numericPackage(row, 'pcs'),
    image_url: row.imageUrl ?? null,
    source_url: row.sourceUrl ?? null,
    last_seen_at: row.observedAt
  }));

  const matchRows = rows.map((row, ordinal) => ({
    ordinal,
    canonical_id: row.canonical_id,
    score: row.match.score,
    method: row.match.method
  }));

  const observationRows = rows.map((row, ordinal) => ({
    ordinal,
    store_id: row.storeId ?? null,
    price_amount: row.price,
    currency: 'SEK',
    country: row.originCountry ?? 'SE',
    unit: row.packageUnit,
    is_list_price: row.regularPrice === undefined || row.regularPrice === row.price,
    observed_at: row.observedAt,
    source_run_id: row.sourceRunId ?? null,
    source_url: row.sourceUrl ?? null
  }));

  const promotionRows = rows
    .map((row, ordinal) => ({ row, ordinal }))
    .filter(({ row }) => row.regularPrice !== undefined && row.regularPrice > row.price)
    .map(({ row, ordinal }) => ({
      ordinal,
      product_id: row.canonical_id,
      chain_id: row.chainId,
      store_id: row.storeId ?? null,
      promo_start: row.validFrom?.slice(0, 10) ?? null,
      promo_end: row.validUntil?.slice(0, 10) ?? null,
      promo_price: row.price,
      regular_price_claimed: row.regularPrice ?? null,
      promo_text: row.promoText ?? null,
      member_only: row.memberOnly ?? false,
      source_type: row.sourceType,
      confidence_score: row.match.score
    }));

  const batchSize = resolveDailyPersistBatchSize();

  await executor.query('begin');
  try {
    // Listings carry their own `ordinal` field, so batching preserves the
    // ordinal -> id mapping without any offset bookkeeping.
    const listingIds = new Map<number, string>();
    for (const listingBatch of batchRows(listingRows, batchSize)) {
      const listings = await executor.query<{ ordinal: number; id: string }>(
        `with input as (
           select *
           from jsonb_to_recordset($1::jsonb) as x(
             ordinal int,
             chain text,
             chain_sku_id text,
             canonical_id uuid,
             name text,
             brand text,
             weight_grams numeric,
             volume_ml numeric,
             unit_count int,
             image_url text,
             source_url text,
             last_seen_at timestamptz
           )
         ),
         upserted as (
           insert into product_listing(
             chain,
             chain_sku_id,
             canonical_id,
             name,
             brand,
             weight_grams,
             volume_ml,
             unit_count,
             image_url,
             source_url,
             last_seen_at
           )
           select chain, chain_sku_id, canonical_id, name, brand, weight_grams, volume_ml, unit_count, image_url, source_url, last_seen_at
           from input
           on conflict (chain, chain_sku_id) do update set
             canonical_id = excluded.canonical_id,
             name = excluded.name,
             brand = excluded.brand,
             weight_grams = excluded.weight_grams,
             volume_ml = excluded.volume_ml,
             unit_count = excluded.unit_count,
             image_url = excluded.image_url,
             source_url = excluded.source_url,
             last_seen_at = greatest(product_listing.last_seen_at, excluded.last_seen_at)
           returning id, chain, chain_sku_id
         )
         select input.ordinal, upserted.id
         from input
         join upserted on upserted.chain = input.chain and upserted.chain_sku_id = input.chain_sku_id
         order by input.ordinal`,
        [JSON.stringify(listingBatch)]
      );
      for (const row of listings) listingIds.set(Number(row.ordinal), row.id);
    }

    const matchInsertRows = matchRows.map((row) => ({
      canonical_id: row.canonical_id,
      listing_id: listingIds.get(row.ordinal),
      score: row.score,
      method: row.method
    }));
    for (const matchBatch of batchRows(matchInsertRows, batchSize)) {
      await executor.query(
        `insert into product_match(canonical_id, listing_id, score, method)
         select input.canonical_id, input.listing_id, input.score, input.method
         from jsonb_to_recordset($1::jsonb) as input(
           canonical_id uuid,
           listing_id uuid,
           score numeric,
           method text
         )`,
        [JSON.stringify(matchBatch)]
      );
    }

    const observationInsertRows = observationRows.map((row) => ({
      listing_id: listingIds.get(row.ordinal),
      store_id: row.store_id,
      price_amount: row.price_amount,
      currency: row.currency,
      country: row.country,
      unit: row.unit,
      is_list_price: row.is_list_price,
      observed_at: row.observed_at,
      source_run_id: row.source_run_id,
      source_url: row.source_url
    }));
    for (const observationBatch of batchRows(observationInsertRows, batchSize)) {
      await executor.query(
        `insert into price_observation(
           listing_id,
           store_id,
           price_amount,
           currency,
           country,
           unit,
           is_list_price,
           observed_at,
           source_run_id,
           source_url
         )
         select listing_id, store_id, price_amount, currency, country, unit, is_list_price, observed_at, source_run_id, source_url
         from jsonb_to_recordset($1::jsonb) as input(
           listing_id uuid,
           store_id uuid,
           price_amount numeric,
           currency char(3),
           country char(2),
           unit text,
           is_list_price boolean,
           observed_at timestamptz,
           source_run_id uuid,
           source_url text
         )`,
        [JSON.stringify(observationBatch)]
      );
    }

    for (const promotionBatch of batchRows(promotionRows, batchSize)) {
      await executor.query(
        `insert into promotion_observations(
           product_id,
           chain_id,
           store_id,
           promo_start,
           promo_end,
           promo_price,
           regular_price_claimed,
           promo_text,
           member_only,
           source_type,
           confidence_score
         )
         select product_id, chain_id, store_id, promo_start, promo_end, promo_price, regular_price_claimed, promo_text, member_only, source_type, confidence_score
         from jsonb_to_recordset($1::jsonb) as input(
           product_id text,
           chain_id text,
           store_id text,
           promo_start date,
           promo_end date,
           promo_price numeric,
           regular_price_claimed numeric,
           promo_text text,
           member_only boolean,
           source_type text,
           confidence_score numeric
         )`,
        [JSON.stringify(promotionBatch)]
      );
    }

    await executor.query('commit');
    return {
      listingCount: rows.length,
      observationCount: rows.length,
      promotionCount: promotionRows.length
    };
  } catch (error) {
    await executor.query('rollback');
    throw error;
  }
}

export const INGEST_PIPELINE_DAG = [
  { stage: 'fetch', dependsOn: [] },
  { stage: 'normalize', dependsOn: ['fetch'] },
  { stage: 'match', dependsOn: ['normalize'] },
  { stage: 'store', dependsOn: ['match'] }
] as const;
