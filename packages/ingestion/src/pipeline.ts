export type IngestPipelineStage = 'fetch' | 'normalize' | 'match' | 'store';

export type IngestRow = {
  chainId: string;
  sourceId: string;
  retailerProductId: string;
  productName: string;
  price?: number | null;
  currency?: string | null;
  promotion?: Record<string, unknown> | null;
  raw?: unknown;
};

export type MatchedIngestRow = IngestRow & {
  canonicalId: string | null;
};

export type IngestPipelineEvent = {
  attempt: number;
  durationMs?: number;
  error?: unknown;
  rows?: number;
  stage: IngestPipelineStage;
  status: 'started' | 'succeeded' | 'failed' | 'retrying';
};

export type IngestPipelineRetry = {
  attempts?: number;
  baseDelayMs?: number;
};

export type IngestPipelineStoreResult = {
  listings: number;
  observations: number;
  promotions: number;
};

export type IngestPipelineResult = {
  fetched: number;
  normalized: number;
  matched: number;
  stored: IngestPipelineStoreResult;
  events: IngestPipelineEvent[];
};

export type IngestPipelineInput<TRaw, TTx = unknown> = {
  bulkUpsert: (rows: readonly MatchedIngestRow[], tx: TTx) => Promise<IngestPipelineStoreResult>;
  chunkSize?: number;
  fetchRaw: () => Promise<readonly TRaw[]>;
  match: (row: IngestRow) => Promise<string | null> | string | null;
  normalize: (raw: TRaw) => IngestRow | readonly IngestRow[] | null | undefined;
  observe?: (event: IngestPipelineEvent) => void;
  retry?: IngestPipelineRetry;
  transaction: <T>(run: (tx: TTx) => Promise<T>) => Promise<T>;
};

export async function runIngestPipeline<TRaw, TTx = unknown>(input: IngestPipelineInput<TRaw, TTx>): Promise<IngestPipelineResult> {
  const events: IngestPipelineEvent[] = [];
  const observe = (event: IngestPipelineEvent) => {
    events.push(event);
    input.observe?.(event);
  };

  const rawRows = await runStage('fetch', () => input.fetchRaw(), input.retry, observe);
  const normalizedRows = await runStage('normalize', async () => normalizeRows(rawRows, input.normalize), input.retry, observe);
  const matchedRows = await runStage('match', () => matchRows(normalizedRows, input.match), input.retry, observe);
  const stored = await runStage('store', () => storeRowsInChunks(matchedRows, input), input.retry, observe);

  return {
    fetched: rawRows.length,
    normalized: normalizedRows.length,
    matched: matchedRows.filter((row) => row.canonicalId !== null).length,
    stored,
    events
  };
}

export async function fetchRawJson<T>(url: string, fetchImpl: typeof fetch = fetch): Promise<T> {
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchRawBytes(url: string, fetchImpl: typeof fetch = fetch): Promise<Uint8Array> {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function normalizeRows<TRaw>(rawRows: readonly TRaw[], normalize: IngestPipelineInput<TRaw>['normalize']): IngestRow[] {
  return rawRows.flatMap((raw) => {
    const row = normalize(raw);
    if (!row) return [];
    return Array.isArray(row) ? row : [row];
  });
}

async function matchRows(rows: readonly IngestRow[], match: IngestPipelineInput<unknown>['match']): Promise<MatchedIngestRow[]> {
  const matchedRows: MatchedIngestRow[] = [];
  for (const row of rows) {
    matchedRows.push({ ...row, canonicalId: await match(row) });
  }
  return matchedRows;
}

async function storeRowsInChunks<TRaw, TTx>(
  rows: readonly MatchedIngestRow[],
  input: IngestPipelineInput<TRaw, TTx>
): Promise<IngestPipelineStoreResult> {
  const chunkSize = Math.max(1, Math.floor(input.chunkSize ?? 500));
  const total: IngestPipelineStoreResult = { listings: 0, observations: 0, promotions: 0 };

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const result = await input.transaction((tx) => input.bulkUpsert(chunk, tx));
    total.listings += result.listings;
    total.observations += result.observations;
    total.promotions += result.promotions;
  }

  return total;
}

async function runStage<T>(
  stage: IngestPipelineStage,
  run: () => Promise<T>,
  retry: IngestPipelineRetry | undefined,
  observe: (event: IngestPipelineEvent) => void
): Promise<T> {
  const maxAttempts = Math.max(1, Math.floor(retry?.attempts ?? 1));
  const baseDelayMs = Math.max(0, Math.floor(retry?.baseDelayMs ?? 100));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    observe({ attempt, stage, status: 'started' });
    try {
      const result = await run();
      observe({ attempt, durationMs: Date.now() - startedAt, rows: rowCount(result), stage, status: 'succeeded' });
      return result;
    } catch (error) {
      const finalAttempt = attempt >= maxAttempts;
      observe({ attempt, durationMs: Date.now() - startedAt, error, stage, status: finalAttempt ? 'failed' : 'retrying' });
      if (finalAttempt) throw error;
      await wait(baseDelayMs * attempt);
    }
  }

  throw new Error(`Unreachable pipeline retry state for ${stage}`);
}

function rowCount(value: unknown): number | undefined {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object' && 'listings' in value) {
    const result = value as Partial<IngestPipelineStoreResult>;
    return (result.listings ?? 0) + (result.observations ?? 0) + (result.promotions ?? 0);
  }
  return undefined;
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
