import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CountryCode = 'SE' | 'NO' | 'IS';

type PgPoolLike = {
  query<T = unknown>(text: string, values: unknown[]): Promise<{ rows: T[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

type ChainIndexRow = {
  chain_slug: string;
  chain_name: string;
  retailer_type: string;
  latest_price_count: string | number;
  product_count: string | number;
  min_price: string | number | null;
  median_price: string | number | null;
  max_price: string | number | null;
  last_observed_at: string | null;
};

type StoreIndexRow = {
  store_count: string | number;
  city_count: string | number;
};

type PriceTypeRow = {
  price_type: string;
  observation_count: string | number;
};

type IndexPayload = {
  country: CountryCode;
  chains: Array<{
    slug: string;
    name: string;
    retailerType: string;
    latestPriceCount: number;
    productCount: number;
    minPrice: number | null;
    medianPrice: number | null;
    maxPrice: number | null;
    lastObservedAt: string | null;
  }>;
  storeCoverage: {
    storeCount: number;
    cityCount: number;
  };
  priceTypes: Array<{
    priceType: string;
    observationCount: number;
  }>;
  cache: {
    key: string;
    status: 'hit' | 'miss' | 'stored';
  };
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;
const indexCache = new Map<string, { expiresAt: number; payload: Omit<IndexPayload, 'cache'> }>();
const cacheTtlMs = 5 * 60 * 1000;

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

function countryFromRequest(request: Request): CountryCode | null {
  const country = new URL(request.url).searchParams.get('country');
  return country === 'SE' || country === 'NO' || country === 'IS' ? country : null;
}

function numberFromDb(value: string | number | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerFromDb(value: string | number): number {
  return numberFromDb(value) ?? 0;
}

async function buildIndexPayload(pool: PgPoolLike, country: CountryCode): Promise<Omit<IndexPayload, 'cache'>> {
  const [chains, stores, priceTypes] = await Promise.all([
    pool.query<ChainIndexRow>(
      `select chains.slug as chain_slug,
              chains.name as chain_name,
              chains.retailer_type,
              count(latest_prices.id) as latest_price_count,
              count(distinct latest_prices.product_id) as product_count,
              min(latest_prices.price) as min_price,
              percentile_cont(0.5) within group (order by latest_prices.price) as median_price,
              max(latest_prices.price) as max_price,
              max(latest_prices.observed_at)::text as last_observed_at
       from chains
       left join latest_prices on latest_prices.chain_id = chains.id
        and latest_prices.domain = 'grocery'
        and latest_prices.is_available = true
       where chains.country_code = $1
       group by chains.slug, chains.name, chains.retailer_type
       order by chains.name`,
      [country]
    ),
    pool.query<StoreIndexRow>(
      `select count(stores.id) as store_count,
              count(distinct stores.city) as city_count
       from stores
       join chains on chains.id = stores.chain_id
       where stores.country_code = $1
         and chains.country_code = $1`,
      [country]
    ),
    pool.query<PriceTypeRow>(
      `select latest_prices.price_type,
              count(*) as observation_count
       from latest_prices
       join chains on chains.id = latest_prices.chain_id
       where chains.country_code = $1
         and latest_prices.domain = 'grocery'
         and latest_prices.is_available = true
       group by latest_prices.price_type
       order by latest_prices.price_type`,
      [country]
    )
  ]);

  return {
    country,
    chains: chains.rows.map((row) => ({
      slug: row.chain_slug,
      name: row.chain_name,
      retailerType: row.retailer_type,
      latestPriceCount: integerFromDb(row.latest_price_count),
      productCount: integerFromDb(row.product_count),
      minPrice: numberFromDb(row.min_price),
      medianPrice: numberFromDb(row.median_price),
      maxPrice: numberFromDb(row.max_price),
      lastObservedAt: row.last_observed_at
    })),
    storeCoverage: {
      storeCount: integerFromDb(stores.rows[0]?.store_count ?? 0),
      cityCount: integerFromDb(stores.rows[0]?.city_count ?? 0)
    },
    priceTypes: priceTypes.rows.map((row) => ({
      priceType: row.price_type,
      observationCount: integerFromDb(row.observation_count)
    }))
  };
}

function badCountryResponse() {
  return NextResponse.json(
    { error: 'invalid_country', message: 'Query parameter country is required and must be one of SE, NO, or IS.' },
    { status: 400 }
  );
}

export async function GET(request: Request) {
  const country = countryFromRequest(request);
  if (!country) return badCountryResponse();

  const cacheKey = `index:${country}`;
  const cached = indexCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.payload, cache: { key: cacheKey, status: 'hit' } });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'index_database_unconfigured', country }, { status: 503 });
  }

  try {
    const payload = await buildIndexPayload(await poolForDatabaseUrl(databaseUrl), country);
    indexCache.set(cacheKey, { expiresAt: Date.now() + cacheTtlMs, payload });
    return NextResponse.json({ ...payload, cache: { key: cacheKey, status: 'stored' } });
  } catch (error) {
    console.error('Country index API query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json({ error: 'index_query_failed', country }, { status: 500 });
  }
}
