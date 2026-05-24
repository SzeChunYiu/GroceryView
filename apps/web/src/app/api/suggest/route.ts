import { createPgQueryExecutor, type QueryExecutor } from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPPORTED_COUNTRIES = new Set(['SE', 'NO', 'IS']);
const CACHE_TTL_MS = 60 * 1000;

type CountryCode = 'SE' | 'NO' | 'IS';

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

type SuggestionRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  chain_slug: string | null;
  chain_name: string | null;
  min_price: string | number | null;
  currency: string | null;
  search_rank: string | number | null;
};

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  chainSlug: string | null;
  chainName: string | null;
  minPrice: number | null;
  currency: string | null;
  searchRank: number;
};

type SuggestPayload = {
  country: CountryCode;
  query: string;
  results: Suggestion[];
  source: 'postgres.country_scoped_suggest';
  error?: string;
};

type CacheEntry = {
  expiresAt: number;
  payload: SuggestPayload;
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;
const responseCache = new Map<string, CacheEntry>();

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
    responseCache.clear();
  }
  return createPgQueryExecutor(cachedPool);
}

function parseCountry(searchParams: URLSearchParams): CountryCode | null {
  const country = searchParams.get('country')?.trim().toUpperCase();
  return country && SUPPORTED_COUNTRIES.has(country) ? country as CountryCode : null;
}

function mapSuggestion(row: SuggestionRow): Suggestion {
  const minPrice = row.min_price === null ? null : Number(row.min_price);
  const searchRank = Number(row.search_rank ?? 0);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    imageUrl: row.image_url,
    chainSlug: row.chain_slug,
    chainName: row.chain_name,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    currency: row.currency,
    searchRank: Number.isFinite(searchRank) ? searchRank : 0
  };
}

async function listSuggestions(executor: QueryExecutor, query: string, country: CountryCode): Promise<Suggestion[]> {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ');
  if (normalizedQuery.length < 2) return [];

  const rows = await executor.query<SuggestionRow>(
    `/* country_scoped_suggest */
     with query as (
       select websearch_to_tsquery('simple', $1) as search_query
     ), ranked as (
       select products.id::text as id,
              products.slug,
              products.canonical_name as name,
              products.brand,
              products.image_url,
              chains.slug as chain_slug,
              chains.name as chain_name,
              latest_prices.price as min_price,
              latest_prices.currency,
              ts_rank_cd(to_tsvector('simple', coalesce(products.canonical_name, '') || ' ' || coalesce(products.brand, '')), query.search_query) as search_rank,
              row_number() over (
                partition by products.id
                order by latest_prices.price asc nulls last, latest_prices.observed_at desc, chains.slug
              ) as country_price_rank
         from products
         cross join query
         join latest_prices on latest_prices.product_id = products.id
         join chains on chains.id = latest_prices.chain_id
         left join stores on stores.id = latest_prices.store_id
        where products.domain = 'grocery'
          and latest_prices.domain = 'grocery'
          and chains.country_code = $2
          and (stores.id is null or stores.country_code = $2)
          and latest_prices.is_available = true
          and to_tsvector('simple', coalesce(products.canonical_name, '') || ' ' || coalesce(products.brand, '')) @@ query.search_query
     )
     select id, slug, name, brand, image_url, chain_slug, chain_name, min_price, currency, search_rank
       from ranked
      where country_price_rank = 1
      order by search_rank desc, name asc
      limit 8`,
    [normalizedQuery, country]
  );
  return rows.map(mapSuggestion);
}

function payload(country: CountryCode, query: string, results: Suggestion[], error?: string): SuggestPayload {
  return { country, query, results, source: 'postgres.country_scoped_suggest', ...(error ? { error } : {}) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = parseCountry(searchParams);
  const query = (searchParams.get('q') ?? '').trim();

  if (!country) {
    return NextResponse.json(
      { error: 'country_required_or_invalid', supportedCountries: [...SUPPORTED_COUNTRIES] },
      { status: 400 }
    );
  }

  if (query.length < 2) return NextResponse.json(payload(country, query, []));

  const cacheKey = `${country}:${query.toLocaleLowerCase('sv-SE')}`;
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.payload);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(payload(country, query, [], 'suggest_database_unconfigured'), { status: 503 });
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const results = await listSuggestions(executor, query, country);
    const response = payload(country, query, results);
    responseCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, payload: response });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Country-scoped suggest query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(payload(country, query, [], 'suggest_query_failed'), { status: 500 });
  }
}
