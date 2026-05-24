export type IngestRow = {
  currency?: string;
  name: string;
  observedAt: string;
  price?: number;
  promotion?: unknown;
  retailer: string;
  sku: string;
  source: string;
};

export type MatchedIngestRow = IngestRow & {
  canonical_id: string | null;
};

export type IngestPipelineStage = 'fetch' | 'normalize' | 'match' | 'store';

export type IngestPipelineEvent = {
  attempt?: number;
  chunkIndex?: number;
  rows?: number;
  stage: IngestPipelineStage;
  status: 'start' | 'success' | 'retry' | 'error';
};

export type IngestStoreTransaction = {
  bulkUpsertListings(rows: MatchedIngestRow[]): Promise<void>;
  bulkUpsertObservations(rows: MatchedIngestRow[]): Promise<void>;
  bulkUpsertPromotions(rows: MatchedIngestRow[]): Promise<void>;
};

export type IngestPipelineOptions<RawPayload> = {
  chunkSize?: number;
  fetch(): Promise<RawPayload>;
  match(row: IngestRow): Promise<string | null> | string | null;
  normalize(raw: RawPayload): Promise<IngestRow[]> | IngestRow[];
  observe?(event: IngestPipelineEvent): void;
  retries?: number;
  store: {
    transaction<T>(run: (tx: IngestStoreTransaction) => Promise<T>): Promise<T>;
  };
};

export type IngestPipelineResult = {
  fetched: boolean;
  matched: number;
  normalized: number;
  stored: number;
};

const DEFAULT_CHUNK_SIZE = 500;

export async function runIngestPipeline<RawPayload>(options: IngestPipelineOptions<RawPayload>): Promise<IngestPipelineResult> {
  const raw = await runStage(options, 'fetch', () => options.fetch());
  const normalized = await runStage(options, 'normalize', () => Promise.resolve(options.normalize(raw)));
  const matched = await runStage(options, 'match', async () => {
    const rows: MatchedIngestRow[] = [];
    for (const row of normalized) {
      rows.push({ ...row, canonical_id: await options.match(row) });
    }
    return rows;
  });

  const stored = await runStage(options, 'store', async () => {
    let count = 0;
    const chunks = chunkRows(matched, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
    for (const [chunkIndex, rows] of chunks.entries()) {
      options.observe?.({ chunkIndex, rows: rows.length, stage: 'store', status: 'start' });
      await options.store.transaction(async (tx) => {
        await tx.bulkUpsertListings(rows);
        await tx.bulkUpsertObservations(rows);
        await tx.bulkUpsertPromotions(rows.filter((row) => row.promotion !== undefined));
      });
      count += rows.length;
      options.observe?.({ chunkIndex, rows: rows.length, stage: 'store', status: 'success' });
    }
    return count;
  });

  return {
    fetched: true,
    matched: matched.length,
    normalized: normalized.length,
    stored
  };
}

async function runStage<T, RawPayload>(
  options: Pick<IngestPipelineOptions<RawPayload>, 'observe' | 'retries'>,
  stage: IngestPipelineStage,
  run: () => Promise<T>
): Promise<T> {
  const maxAttempts = (options.retries ?? 0) + 1;
  let attempt = 1;

  while (true) {
    options.observe?.({ attempt, stage, status: 'start' });
    try {
      const result = await run();
      options.observe?.({ attempt, stage, status: 'success' });
      return result;
    } catch (error) {
      if (attempt >= maxAttempts) {
        options.observe?.({ attempt, stage, status: 'error' });
        throw error;
      }
      options.observe?.({ attempt, stage, status: 'retry' });
      attempt += 1;
    }
  }
}

function chunkRows<T>(rows: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}
