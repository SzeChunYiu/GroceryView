import {
  createPgQueryExecutor,
  createPostgresTrendingPriceChangeReader,
  type TrendingProductPriceChange
} from '@groceryview/db';
import { homepageTrendingPriceChanges } from './verified-data';

const TRENDING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const TRENDING_LIMIT = 10;

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

export type TrendingFeedWindow = {
  since: string;
  until: string;
  label: 'last_7_days';
};

export type TrendingFeedPayload = {
  source: 'postgres.latest_prices/observations' | 'openprices.static.fallback';
  generatedAt: string;
  window: TrendingFeedWindow;
  city: string | null;
  itemCount: number;
  items: TrendingProductPriceChange[];
  error?: 'trending_database_unconfigured' | 'trending_query_failed';
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

export function normalizeTrendingCity(value: string | null | undefined): string | null {
  const city = value?.trim();
  return city ? city : null;
}

export function trendingWindow(now = new Date()): TrendingFeedWindow {
  const until = now.toISOString();
  const since = new Date(now.getTime() - TRENDING_WINDOW_MS).toISOString();
  return { since, until, label: 'last_7_days' };
}

function trendingFeedPayload(
  source: TrendingFeedPayload['source'],
  window: TrendingFeedWindow,
  city: string | null,
  items: TrendingProductPriceChange[],
  error?: TrendingFeedPayload['error']
): TrendingFeedPayload {
  return {
    source,
    generatedAt: window.until,
    window,
    city,
    itemCount: items.length,
    items,
    ...(error ? { error } : {})
  };
}

export function staticTrendingFeedPayload(
  window: TrendingFeedWindow,
  city: string | null,
  error?: TrendingFeedPayload['error']
): TrendingFeedPayload {
  return trendingFeedPayload('openprices.static.fallback', window, city, city || error ? [] : homepageTrendingPriceChanges, error);
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

export async function databaseTrendingFeedPayload(
  databaseUrl: string,
  window: TrendingFeedWindow,
  city: string | null
): Promise<TrendingFeedPayload> {
  const executor = await executorForDatabaseUrl(databaseUrl);
  const reader = createPostgresTrendingPriceChangeReader(executor);
  const items = await reader.listTrendingPriceChanges({
    since: window.since,
    until: window.until,
    ...(city ? { city } : {}),
    limit: TRENDING_LIMIT
  });
  return trendingFeedPayload('postgres.latest_prices/observations', window, city, items);
}
