import { createPgQueryExecutor, createPostgresPriceReader } from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

const productIdPattern = /^[0-9a-z][0-9a-z_-]{1,127}$/i;
const MAX_LIMIT = 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 60;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function clientKey(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
}

function rateLimit(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count <= RATE_LIMIT_REQUESTS) return null;
  return Math.ceil((bucket.resetAt - now) / 1000);
}

function boundedLimit(value: string | null) {
  const parsed = Number(value ?? '250');
  if (!Number.isInteger(parsed) || parsed < 1) return 250;
  return Math.min(parsed, MAX_LIMIT);
}

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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const retryAfter = rateLimit(request);
  if (retryAfter !== null) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  const { id } = await context.params;
  if (!productIdPattern.test(id)) {
    return NextResponse.json({ error: 'product id must be 2-128 URL-safe characters' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'history_database_unconfigured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = boundedLimit(searchParams.get('limit'));
    const executor = await executorForDatabaseUrl(databaseUrl);
    const reader = createPostgresPriceReader(executor);
    const observations = await reader.listPriceObservationHistory({ productId: id, limit });

    return NextResponse.json({
      productId: id,
      count: observations.length,
      limit,
      license: {
        code: 'Apache-2.0',
        data: 'CC-BY-4.0',
        attribution: 'GroceryView verified price history'
      },
      observations
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Open price history API query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json({ error: 'history_query_failed' }, { status: 500 });
  }
}
