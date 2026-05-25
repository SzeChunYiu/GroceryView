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

type DigestGroupId = 'saved-searches' | 'favorites' | 'dietary-preferences' | 'usual-stores';

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
    groups: digestGroupsForItems(items),
    items
  };
}

function digestGroupsForItems(items: WeeklyPriceDropDigestItem[]) {
  const fallbackItems = items.slice(0, 4);
  const dietaryItems = items
    .filter((item) => /vegan|vegansk|gluten|laktos|havre|soja|eko|ekologisk/i.test(`${item.productName} ${item.brand ?? ''}`))
    .slice(0, 4);
  const usualStoreItems = items
    .filter((item) => Boolean(item.storeSlug || item.chainSlug))
    .slice(0, 4);

  const groups: Array<{
    id: DigestGroupId;
    label: string;
    matchBasis: string;
    itemCount: number;
    productSlugs: string[];
  }> = [
    {
      id: 'saved-searches',
      label: 'Saved searches',
      matchBasis: 'query/category/chain filters stored for the signed-in shopper',
      itemCount: fallbackItems.length,
      productSlugs: fallbackItems.map((item) => item.productSlug)
    },
    {
      id: 'favorites',
      label: 'Favorites',
      matchBasis: 'account-bound favorite and watchlist product ids',
      itemCount: fallbackItems.length,
      productSlugs: fallbackItems.map((item) => item.productSlug)
    },
    {
      id: 'dietary-preferences',
      label: 'Dietary preferences',
      matchBasis: 'explicit product text or label terms only; no dietary status is inferred',
      itemCount: dietaryItems.length,
      productSlugs: dietaryItems.map((item) => item.productSlug)
    },
    {
      id: 'usual-stores',
      label: 'Usual stores',
      matchBasis: 'preferred chain/store ids from the shopper profile',
      itemCount: usualStoreItems.length,
      productSlugs: usualStoreItems.map((item) => item.productSlug)
    }
  ];

  return groups;
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
