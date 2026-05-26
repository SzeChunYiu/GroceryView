import { createPgQueryExecutor, searchProductsByText, type ProductSearchResult } from '@groceryview/db';
import { NextResponse } from 'next/server';
import { publicApiReadCacheControl } from '@/lib/cache-policy';
import { prefetchFrequentSearches, readSearchCache, searchCacheKey, writeSearchCache } from '@/lib/search-cache';
import { expandGrocerySearchQuery, type GrocerySearchExpansion } from '@/lib/search-suggest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicApiReadHeaders = {
  'Cache-Control': publicApiReadCacheControl
};

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

function mergeSearchResults(batches: ProductSearchResult[][]): ProductSearchResult[] {
  const byId = new Map<string, ProductSearchResult>();
  for (const results of batches) {
    for (const result of results) {
      const existing = byId.get(result.id);
      if (!existing || result.searchRank > existing.searchRank) byId.set(result.id, result);
    }
  }
  return [...byId.values()].sort((a, b) => b.searchRank - a.searchRank || a.name.localeCompare(b.name)).slice(0, 8);
}

async function weightedSearchBatch(executor: Awaited<ReturnType<typeof executorForDatabaseUrl>>, expandedQuery: string, weight: number) {
  const results = await searchProductsByText(executor, expandedQuery, { limit: 8 });
  return results.map((result) => ({
    ...result,
    searchRank: result.searchRank * weight
  }));
}

function responsePayload(query: string, expansion: GrocerySearchExpansion, results: ProductSearchResult[], error?: string, cacheStatus?: 'hit' | 'miss' | 'stored') {
  return {
    query,
    expandedQueries: expansion.expandedQueries,
    matchedAliases: expansion.matchedAliases,
    matchedFuzzyAliases: expansion.matchedFuzzyAliases,
    matchedSynonyms: expansion.matchedSynonyms,
    queryWeights: expansion.queryWeights,
    results,
    rankingMode: 'weighted_alias_fuzzy_token_expansion',
    source: 'postgres.products_tsvector_alias_synonym_expansion_weighted_fuzzy',
    ...(cacheStatus ? { cacheStatus } : {}),
    ...(error ? { error } : {})
  };
}

async function expandedSearchResults(executor: Awaited<ReturnType<typeof executorForDatabaseUrl>>, expansion: GrocerySearchExpansion) {
  const batches = await Promise.all(expansion.expandedQueries.map((expandedQuery) => weightedSearchBatch(executor, expandedQuery, expansion.queryWeights[expandedQuery] ?? 1)));
  return mergeSearchResults(batches);
}

async function prefetchSearchQuery(executor: Awaited<ReturnType<typeof executorForDatabaseUrl>>, query: string) {
  const expansion = expandGrocerySearchQuery(query);
  const key = searchCacheKey(query, expansion.expandedQueries);
  if (readSearchCache(key)) return;
  const results = await expandedSearchResults(executor, expansion);
  writeSearchCache(key, responsePayload(query, expansion, results, undefined, 'stored'));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const expansion = expandGrocerySearchQuery(query);
  const cacheKey = searchCacheKey(query, expansion.expandedQueries);

  if (query.length < 2) {
    return NextResponse.json(responsePayload(query, expansion, []), { headers: publicApiReadHeaders });
  }

  const cachedPayload = readSearchCache<ReturnType<typeof responsePayload>>(cacheKey);
  if (cachedPayload) {
    return NextResponse.json({ ...cachedPayload, cacheStatus: 'hit' }, { headers: publicApiReadHeaders });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      responsePayload(query, expansion, [], 'product_search_database_unconfigured'),
      { status: 503 }
    );
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    void prefetchFrequentSearches((prefetchQuery) => prefetchSearchQuery(executor, prefetchQuery));
    const payload = responsePayload(query, expansion, await expandedSearchResults(executor, expansion), undefined, 'miss');
    writeSearchCache(cacheKey, { ...payload, cacheStatus: 'stored' });
    return NextResponse.json(payload, { headers: publicApiReadHeaders });
  } catch (error) {
    console.error('Product search query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(
      responsePayload(query, expansion, [], 'product_search_query_failed'),
      { status: 500 }
    );
  }
}
