import { createPgQueryExecutor, searchProductsByText, type ProductSearchResult } from '@groceryview/db';
import { archiveStalePrices } from '@/lib/freshness';
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

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;
let lastStalePriceArchiveAttemptAt = 0;

const STALE_PRICE_ARCHIVE_INTERVAL_MS = 15 * 60 * 1000;

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

function responsePayload(query: string, results: ProductSearchResult[], error?: string) {
  return {
    query,
    results,
    source: 'postgres.products_tsvector',
    ...(error ? { error } : {})
  };
}

async function archiveStalePricesIfDue(executor: Awaited<ReturnType<typeof executorForDatabaseUrl>>) {
  const now = Date.now();
  if (now - lastStalePriceArchiveAttemptAt < STALE_PRICE_ARCHIVE_INTERVAL_MS) return;

  lastStalePriceArchiveAttemptAt = now;

  try {
    const result = await archiveStalePrices(executor);
    if (result.archivedCount > 0) {
      console.info('Archived stale grocery prices before product search', {
        archivedCount: result.archivedCount,
        cutoffAt: result.cutoffAt,
        thresholdDays: result.thresholdDays
      });
    }
  } catch (error) {
    console.error('Stale grocery price auto-archive failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();

  if (query.length < 2) {
    return NextResponse.json({ query, results: [], source: 'postgres.products_tsvector' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      responsePayload(query, [], 'product_search_database_unconfigured'),
      { status: 503 }
    );
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    await archiveStalePricesIfDue(executor);
    const results = await searchProductsByText(executor, query, { limit: 8 });
    return NextResponse.json({ query, results, source: 'postgres.products_tsvector' });
  } catch (error) {
    console.error('Product search query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(
      responsePayload(query, [], 'product_search_query_failed'),
      { status: 500 }
    );
  }
}
