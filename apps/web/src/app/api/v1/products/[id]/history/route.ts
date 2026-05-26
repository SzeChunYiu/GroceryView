import {
  createPgQueryExecutor,
  createPostgresPriceReader,
  type PriceObservationHistoryRecord,
  type PriceType
} from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const productIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidPattern = productIdPattern;
const supportedPriceTypes = new Set<PriceType>(['shelf', 'online', 'member', 'promotion', 'receipt', 'community']);
const supportedQueryParams = new Set(['limit', 'price_type', 'chain_id', 'chain_ids', 'store_id', 'store_ids', 'from', 'to']);
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
const MAX_OVERLAY_IDS = 8;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const DATA_LICENSE = 'CC-BY-4.0';
const CODE_LICENSE = 'Apache-2.0';

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

type RateLimitBucket = {
  windowStartedAt: number;
  count: number;
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;
const rateLimitBuckets = new Map<string, RateLimitBucket>();

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function executorForDatabaseUrl(databaseUrl: string) {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return createPgQueryExecutor(cachedPool);
}

function jsonHeaders(rateLimit: RateLimitState) {
  return {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'X-Data-License': DATA_LICENSE,
    'X-Code-License': CODE_LICENSE,
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(rateLimit.resetAt)
  };
}

type RateLimitState = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

function clientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'anonymous';
}

function checkRateLimit(request: Request, now = Date.now()): RateLimitState {
  const key = clientKey(request);
  const current = rateLimitBuckets.get(key);
  const windowStartedAt = current && now - current.windowStartedAt < RATE_LIMIT_WINDOW_MS ? current.windowStartedAt : now;
  const count = current && windowStartedAt === current.windowStartedAt ? current.count + 1 : 1;

  rateLimitBuckets.set(key, { windowStartedAt, count });

  for (const [bucketKey, bucket] of rateLimitBuckets) {
    if (now - bucket.windowStartedAt >= RATE_LIMIT_WINDOW_MS * 2) rateLimitBuckets.delete(bucketKey);
  }

  const resetAt = Math.ceil((windowStartedAt + RATE_LIMIT_WINDOW_MS) / 1000);
  const remaining = Math.max(RATE_LIMIT_MAX_REQUESTS - count, 0);
  return {
    allowed: count <= RATE_LIMIT_MAX_REQUESTS,
    remaining,
    resetAt,
    retryAfterSeconds: Math.max(Math.ceil((windowStartedAt + RATE_LIMIT_WINDOW_MS - now) / 1000), 1)
  };
}

function parseInteger(value: string | null, name: string, min: number, max: number) {
  if (value === null) return { value: DEFAULT_LIMIT };
  if (!/^\d+$/.test(value)) return { error: `${name} must be an integer from ${min} to ${max}` };
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return { error: `${name} must be an integer from ${min} to ${max}` };
  }
  return { value: parsed };
}

function parseIsoDate(value: string | null, name: string) {
  if (value === null) return { value: undefined };
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return { error: `${name} must be an ISO-8601 timestamp` };
  return { value: new Date(timestamp).toISOString() };
}

function parseUuid(value: string | null, name: string) {
  if (value === null) return { value: undefined };
  if (!uuidPattern.test(value)) return { error: `${name} must be a UUID` };
  return { value };
}

function parseUuidList(value: string | null, name: string) {
  if (value === null) return { value: undefined };
  const ids = value.split(',').map((item) => item.trim()).filter(Boolean);
  if (ids.length === 0) return { error: `${name} must include at least one UUID` };
  if (ids.length > MAX_OVERLAY_IDS) return { error: `${name} may include at most ${MAX_OVERLAY_IDS} UUIDs` };
  const uniqueIds = [...new Set(ids)];
  const invalid = uniqueIds.find((id) => !uuidPattern.test(id));
  if (invalid) return { error: `${name} contains an invalid UUID: ${invalid}` };
  return { value: uniqueIds };
}

function parsePriceType(value: string | null) {
  if (value === null) return { value: undefined };
  if (!supportedPriceTypes.has(value as PriceType)) {
    return { error: `price_type must be one of ${[...supportedPriceTypes].join(', ')}` };
  }
  return { value: value as PriceType };
}

function parseHistoryQuery(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const unsupported = [...searchParams.keys()].filter((key) => !supportedQueryParams.has(key));
  if (unsupported.length > 0) return { error: `Unsupported query parameter: ${unsupported[0]}` };

  for (const key of supportedQueryParams) {
    if (searchParams.getAll(key).length > 1) return { error: `${key} may be provided at most once` };
  }

  const limit = parseInteger(searchParams.get('limit'), 'limit', 1, MAX_LIMIT);
  if ('error' in limit) return { error: limit.error };
  const priceType = parsePriceType(searchParams.get('price_type'));
  if ('error' in priceType) return { error: priceType.error };
  const chainId = parseUuid(searchParams.get('chain_id'), 'chain_id');
  if ('error' in chainId) return { error: chainId.error };
  const chainIds = parseUuidList(searchParams.get('chain_ids'), 'chain_ids');
  if ('error' in chainIds) return { error: chainIds.error };
  if (chainId.value && chainIds.value) return { error: 'Use chain_id or chain_ids, not both' };
  const storeId = parseUuid(searchParams.get('store_id'), 'store_id');
  if ('error' in storeId) return { error: storeId.error };
  const storeIds = parseUuidList(searchParams.get('store_ids'), 'store_ids');
  if ('error' in storeIds) return { error: storeIds.error };
  if (storeId.value && storeIds.value) return { error: 'Use store_id or store_ids, not both' };
  const from = parseIsoDate(searchParams.get('from'), 'from');
  if ('error' in from) return { error: from.error };
  const to = parseIsoDate(searchParams.get('to'), 'to');
  if ('error' in to) return { error: to.error };
  if (from.value && to.value && Date.parse(from.value) > Date.parse(to.value)) {
    return { error: 'from must be before or equal to to' };
  }

  return {
    value: {
      limit: limit.value,
      priceType: priceType.value,
      chainId: chainId.value,
      chainIds: chainIds.value,
      storeId: storeId.value,
      storeIds: storeIds.value,
      observedFrom: from.value,
      observedTo: to.value
    }
  };
}

function historyRow(row: PriceObservationHistoryRecord) {
  return {
    observationId: row.observationId,
    productId: row.productId,
    chainId: row.chainId,
    storeId: row.storeId ?? null,
    priceType: row.priceType,
    price: row.price,
    regularPrice: row.regularPrice ?? null,
    unitPrice: row.unitPrice,
    currency: row.currency,
    quantity: row.quantity ?? null,
    quantityUnit: row.quantityUnit ?? null,
    promotionText: row.promotionText ?? null,
    promotionStartsOn: row.promotionStartsOn ?? null,
    promotionEndsOn: row.promotionEndsOn ?? null,
    memberRequired: row.memberRequired,
    isAvailable: row.isAvailable,
    observedAt: row.observedAt,
    validFrom: row.validFrom ?? null,
    validUntil: row.validUntil ?? null,
    confidence: row.confidence,
    retailerProductRef: row.retailerProductRef ?? null,
    sourceRunId: row.sourceRunId ?? null,
    rawRecordId: row.rawRecordId ?? null,
    provenance: row.provenance
  };
}

function overlayMeta(rows: PriceObservationHistoryRecord[], filter: { chainId?: string; chainIds?: string[]; storeId?: string; storeIds?: string[] }) {
  const seriesIds = new Set(rows.map((row) => `${row.chainId}:${row.storeId ?? 'all-stores'}:${row.priceType}`));
  const confidences = rows.map((row) => row.confidence).filter((value) => Number.isFinite(value));
  const selectedChainIds = filter.chainIds ?? (filter.chainId ? [filter.chainId] : []);
  const selectedStoreIds = filter.storeIds ?? (filter.storeId ? [filter.storeId] : []);

  return {
    selectionMode: selectedChainIds.length > 0 || selectedStoreIds.length > 0 ? 'selected_overlay' : 'all_available_history',
    selectedChainIds,
    selectedStoreIds,
    seriesCount: seriesIds.size,
    normalizedUnitField: 'unitPrice',
    missingDataPolicy: 'preserve_gaps_no_interpolation',
    confidence: {
      min: confidences.length ? Math.min(...confidences) : null,
      max: confidences.length ? Math.max(...confidences) : null,
      field: 'confidence'
    },
    matchConfidenceDisclosure: 'Rows expose persisted observation confidence; clients must keep confidence visible when overlaying selected chains or stores.'
  };
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const rateLimit = checkRateLimit(request);
  const headers = jsonHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'open_price_history_rate_limited', retryAfterSeconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { ...headers, 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { id: productId } = await context.params;
  if (!productIdPattern.test(productId)) {
    return NextResponse.json({ error: 'product_id must be a UUID' }, { status: 400, headers });
  }

  const parsedQuery = parseHistoryQuery(request);
  if ('error' in parsedQuery) {
    return NextResponse.json({ error: 'invalid_open_price_history_params', message: parsedQuery.error }, { status: 400, headers });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'open_price_history_database_unconfigured' }, { status: 503, headers });
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const reader = createPostgresPriceReader(executor);
    const rows = await reader.listPriceObservationHistory({ productId, ...parsedQuery.value });

    return NextResponse.json(
      {
        productId,
        rows: rows.map(historyRow),
        meta: {
          count: rows.length,
          limit: parsedQuery.value.limit,
          filters: {
            priceType: parsedQuery.value.priceType ?? null,
            chainId: parsedQuery.value.chainId ?? null,
            chainIds: parsedQuery.value.chainIds ?? [],
            storeId: parsedQuery.value.storeId ?? null,
            storeIds: parsedQuery.value.storeIds ?? [],
            from: parsedQuery.value.observedFrom ?? null,
            to: parsedQuery.value.observedTo ?? null
          },
          overlay: overlayMeta(rows, parsedQuery.value),
          source: 'postgres.observations',
          generatedAt: new Date().toISOString(),
          license: {
            code: CODE_LICENSE,
            data: DATA_LICENSE,
            attribution: 'Credit GroceryView and retain each row provenance/sourceRunId when republishing.'
          }
        }
      },
      { headers }
    );
  } catch (error) {
    console.error('Open price history API query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json({ error: 'open_price_history_query_failed' }, { status: 500, headers });
  }
}
