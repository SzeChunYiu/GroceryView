import { createPgQueryExecutor, type ProductSearchResult } from '@groceryview/db';
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

type SupportedCountry = 'SE' | 'NO' | 'IS';

type ProductSearchRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  search_rank: string | number | null;
};

const SUPPORTED_COUNTRIES: SupportedCountry[] = ['SE', 'NO', 'IS'];
const SUPPORTED_COUNTRY_SET = new Set<string>(SUPPORTED_COUNTRIES);
const SEARCH_RESULT_CACHE_TTL_MS = 30_000;
const SEARCH_RESULT_CACHE_MAX_ENTRIES = 200;

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;
const searchResultCache = new Map<string, { expiresAt: number; results: ProductSearchResult[] }>();

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
    searchResultCache.clear();
  }
  return createPgQueryExecutor(cachedPool);
}

function responsePayload(query: string, country: SupportedCountry, results: ProductSearchResult[], error?: string) {
  return {
    query,
    results,
    country,
    source: 'postgres.products_tsvector',
    ...(error ? { error } : {})
  };
}

function normalizeCountry(country: string | null): SupportedCountry | null {
  if (!country) return null;
  const normalized = country.trim().toUpperCase();
  return SUPPORTED_COUNTRY_SET.has(normalized) ? normalized as SupportedCountry : null;
}

function countryErrorResponse(country: string | null) {
  return NextResponse.json(
    {
      error: country ? 'invalid_country' : 'country_required',
      allowedCountries: SUPPORTED_COUNTRIES
    },
    { status: 400 }
  );
}

function normalizeSearchQuery(query: string): string | null {
  const normalized = query.trim().replace(/\s+/g, ' ');
  return normalized.length >= 2 ? normalized : null;
}

function cacheKey(country: SupportedCountry, query: string): string {
  return `${country}:${query.toLocaleLowerCase('sv-SE')}`;
}

function getCachedSearchResults(country: SupportedCountry, query: string): ProductSearchResult[] | null {
  const key = cacheKey(country, query);
  const cached = searchResultCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    searchResultCache.delete(key);
    return null;
  }

  return cached.results;
}

function setCachedSearchResults(country: SupportedCountry, query: string, results: ProductSearchResult[]) {
  if (searchResultCache.size >= SEARCH_RESULT_CACHE_MAX_ENTRIES) {
    const oldestKey = searchResultCache.keys().next().value as string | undefined;
    if (oldestKey) searchResultCache.delete(oldestKey);
  }

  searchResultCache.set(cacheKey(country, query), {
    expiresAt: Date.now() + SEARCH_RESULT_CACHE_TTL_MS,
    results
  });
}

function mapProductSearchRow(row: ProductSearchRow): ProductSearchResult {
  const rank = Number(row.search_rank ?? 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    imageUrl: row.image_url,
    searchRank: Number.isFinite(rank) ? rank : 0
  };
}

async function searchProductsByTextForCountry(
  executor: ReturnType<typeof createPgQueryExecutor>,
  query: string,
  country: SupportedCountry
): Promise<ProductSearchResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const cached = getCachedSearchResults(country, normalizedQuery);
  if (cached) return cached;

  const searchVector = "to_tsvector('simple', coalesce(products.canonical_name, '') || ' ' || coalesce(products.brand, ''))";
  const rows = await executor.query<ProductSearchRow>(
    `with query as (
       select websearch_to_tsquery('simple', $1) as search_query
     )
     select products.id::text as id,
            products.slug,
            products.canonical_name as name,
            products.brand,
            products.image_url,
            ts_rank_cd(${searchVector}, query.search_query) as search_rank
       from products
       cross join query
      where products.domain = 'grocery'
        and ${searchVector} @@ query.search_query
        and exists (
          select 1
            from latest_prices
            join chains on chains.id = latest_prices.chain_id
            left join stores on stores.id = latest_prices.store_id
           where latest_prices.product_id = products.id
             and latest_prices.domain = 'grocery'
             and chains.domain = 'grocery'
             and (
               (latest_prices.store_id is null and chains.country_code = $3)
               or (latest_prices.store_id is not null and stores.domain = 'grocery' and stores.country_code = $3)
             )
        )
      order by search_rank desc, products.canonical_name asc
      limit $2`,
    [normalizedQuery, 8, country]
  );

  const results = rows.map(mapProductSearchRow);
  setCachedSearchResults(country, normalizedQuery, results);
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const country = normalizeCountry(searchParams.get('country'));

  if (!country) {
    return countryErrorResponse(searchParams.get('country'));
  }

  if (query.length < 2) {
    return NextResponse.json({ query, results: [], country, source: 'postgres.products_tsvector' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      responsePayload(query, country, [], 'product_search_database_unconfigured'),
      { status: 503 }
    );
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const results = await searchProductsByTextForCountry(executor, query, country);
    return NextResponse.json({ query, results, country, source: 'postgres.products_tsvector' });
  } catch (error) {
    console.error('Product search query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(
      responsePayload(query, country, [], 'product_search_query_failed'),
      { status: 500 }
    );
  }
}
