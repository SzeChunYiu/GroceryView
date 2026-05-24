import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CountryCode = 'SE' | 'NO' | 'IS';
type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

type CountryIndexPayload = {
  cacheKey: string;
  country: CountryCode;
  generatedAt: string;
  priceObservationCount: number;
  productCount: number;
  storeCount: number;
};

const allowedCountries = new Set<CountryCode>(['SE', 'NO', 'IS']);
const countryIndexCache = new Map<CountryCode, { expiresAt: number; payload: CountryIndexPayload }>();
const cacheTtlMs = 5 * 60 * 1000;
let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

function parseCountry(value: string | null): CountryCode | null {
  const country = value?.toUpperCase();
  return country && allowedCountries.has(country as CountryCode) ? country as CountryCode : null;
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function poolForDatabaseUrl(databaseUrl: string) {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return cachedPool;
}

function countFromRows(rows: Array<Record<string, unknown>>): number {
  const count = rows[0]?.count;
  return typeof count === 'number' ? count : Number(count ?? 0);
}

async function loadCountryIndex(pool: PgPoolLike, country: CountryCode): Promise<CountryIndexPayload> {
  const [products, stores, prices] = await Promise.all([
    pool.query('select count(*)::int as count from products where country = $1', [country]),
    pool.query('select count(*)::int as count from stores where country = $1', [country]),
    pool.query('select count(*)::int as count from price_observations where country = $1', [country])
  ]);

  return {
    cacheKey: `country-index:${country}`,
    country,
    generatedAt: new Date().toISOString(),
    priceObservationCount: countFromRows(prices.rows),
    productCount: countFromRows(products.rows),
    storeCount: countFromRows(stores.rows)
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = parseCountry(searchParams.get('country'));

  if (!country) {
    return NextResponse.json({ error: 'country must be one of SE, NO, IS' }, { status: 400 });
  }

  const cached = countryIndexCache.get(country);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload, {
      headers: { 'cache-control': 'public, max-age=300', 'x-cache-key': cached.payload.cacheKey }
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ country, error: 'index_database_unconfigured' }, { status: 503 });
  }

  try {
    const pool = await poolForDatabaseUrl(databaseUrl);
    const payload = await loadCountryIndex(pool, country);
    countryIndexCache.set(country, { expiresAt: Date.now() + cacheTtlMs, payload });
    return NextResponse.json(payload, {
      headers: { 'cache-control': 'public, max-age=300', 'x-cache-key': payload.cacheKey }
    });
  } catch (error) {
    console.error('Country index query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json({ country, error: 'index_query_failed' }, { status: 500 });
  }
}
