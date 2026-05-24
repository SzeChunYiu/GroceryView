import { createPgQueryExecutor, listProductStoreVolatility, type ProductStoreVolatilityResult } from '@groceryview/db';
import { NextResponse } from 'next/server';
import { generatedVolatilityFallback, type StorePriceVolatility } from '@/lib/price-intelligence';

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

function parseStoreIds(value: string | null): string[] {
  return (value ?? '').split(',').map((storeId) => storeId.trim()).filter(Boolean);
}

function payload(productId: string, storeIds: string[], rows: StorePriceVolatility[] | ProductStoreVolatilityResult[], source: string) {
  return { productId, storeIds, rows, source };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = (searchParams.get('product_id') ?? '').trim();
  const storeIds = parseStoreIds(searchParams.get('store_ids'));
  const days = Number(searchParams.get('days') ?? 30);

  if (!productId || storeIds.length === 0) {
    return NextResponse.json({ error: 'product_id and store_ids are required' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const rows = generatedVolatilityFallback(productId, storeIds);
    return NextResponse.json(payload(productId, storeIds, rows, 'generated.open_prices_fixture'));
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const rows = await listProductStoreVolatility(executor, { productId, storeIds, days });
    if (rows.length > 0) return NextResponse.json(payload(productId, storeIds, rows, 'postgres.price_daily_or_latest_prices'));
  } catch (error) {
    console.error('Pricing volatility query failed; using generated fallback', error instanceof Error ? { name: error.name } : { name: 'unknown' });
  }

  const rows = generatedVolatilityFallback(productId, storeIds);
  return NextResponse.json(payload(productId, storeIds, rows, 'generated.open_prices_fixture'));
}
