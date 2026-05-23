import { createPgQueryExecutor, createPostgresWeeklyPriceDropDigestReader, type WeeklyPriceDropDigestItem } from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function digestWindow(now = new Date()) {
  const until = now.toISOString();
  const since = new Date(now.getTime() - WEEK_MS).toISOString();
  return { since, until };
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

function digestResponsePayload(items: WeeklyPriceDropDigestItem[], window: ReturnType<typeof digestWindow>) {
  return {
    source: 'postgres.latest_prices',
    generatedAt: window.until,
    window: {
      ...window,
      label: 'last_7_days'
    },
    itemCount: items.length,
    items
  };
}

export async function GET() {
  const window = digestWindow();
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      {
        ...digestResponsePayload([], window),
        error: 'digest_database_unconfigured'
      },
      { status: 503 }
    );
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const reader = createPostgresWeeklyPriceDropDigestReader(executor);
    const items = await reader.listWeeklyPriceDropDigest({ ...window, limit: 10 });
    return NextResponse.json(digestResponsePayload(items, window));
  } catch (error) {
    console.error('Weekly price-drop digest query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(
      {
        ...digestResponsePayload([], window),
        error: 'digest_query_failed'
      },
      { status: 500 }
    );
  }
}
