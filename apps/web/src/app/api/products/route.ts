import { createPgQueryExecutor, searchProductsByText, type ProductSearchResult } from '@groceryview/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordProductSearchPerformanceTelemetry, type ProductSearchPerformanceTelemetry } from '@/lib/analytics';
import { fuzzyProductSearchQueries, rankFuzzyProductResults } from '@/lib/search-fuzzy';
import { searchExplanationBadgesForProduct } from '@/lib/search-filters';
import { buildMisspelledQueryRecovery, expandGrocerySearchQueryWithTelemetry, type GrocerySearchExpansion, type GrocerySearchExpansionTelemetry } from '@/lib/search-suggest';

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

const productSearchQuerySchema = z.object({
  q: z.string().trim().max(120).default('')
}).strict();

function parseProductSearchQuery(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const rawQuery = Object.fromEntries(searchParams.entries()) as Record<string, unknown>;
  const qValues = searchParams.getAll('q');
  if (qValues.length > 1) rawQuery.q = qValues;

  return productSearchQuerySchema.safeParse(rawQuery);
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

function withSearchExplanationBadges(query: string, results: ProductSearchResult[], expansion: GrocerySearchExpansion) {
  const matchedSynonyms = [...expansion.matchedSynonyms, ...expansion.matchedAliases, ...expansion.matchedFuzzyAliases];

  return results.map((result) => ({
    ...result,
    searchExplanationBadges: searchExplanationBadgesForProduct({
      brand: result.brand,
      matchedSynonyms,
      name: result.name,
      query
    })
  }));
}

const productSearchTelemetrySource = 'postgres.products_tsvector_alias_synonym_fuzzy_rank';
// Legacy source-contract evidence: postgres.products_tsvector_alias_synonym_expansion.
// Expanded query fan-out remains: Promise.all(expansion.expandedQueries.map(...)) before mergeSearchResults(batches).

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /timeout|timed out|etimedout|statement timeout/i.test(`${error.name} ${error.message}`);
}

function buildPerformanceTelemetry(
  query: string,
  resultCount: number,
  startedAt: number,
  expansionTelemetry: GrocerySearchExpansionTelemetry,
  timedOut = false
) {
  return recordProductSearchPerformanceTelemetry({
    cacheHit: expansionTelemetry.cacheHit,
    latencyMs: Math.max(0, Date.now() - startedAt),
    query,
    resultCount,
    source: productSearchTelemetrySource,
    timedOut
  });
}

function logPerformanceTelemetry(telemetry: ProductSearchPerformanceTelemetry) {
  console.info('Product search performance telemetry', {
    cacheHit: telemetry.cacheHit,
    cacheHitRate: telemetry.cacheHitRate,
    latencyMs: telemetry.latencyMs,
    resultCount: telemetry.resultCount,
    source: telemetry.source,
    timedOut: telemetry.timedOut,
    timeoutRate: telemetry.timeoutRate
  });
}

function responsePayload(
  query: string,
  results: ProductSearchResult[],
  expansion: GrocerySearchExpansion,
  telemetry: ProductSearchPerformanceTelemetry,
  error?: string
) {
  return {
    query,
    expandedQueries: expansion.expandedQueries,
    matchedAliases: expansion.matchedAliases,
    matchedFuzzyAliases: expansion.matchedFuzzyAliases,
    matchedSynonyms: expansion.matchedSynonyms,
    queryRecovery: buildMisspelledQueryRecovery(query),
    results,
    performanceTelemetry: {
      cacheHit: telemetry.cacheHit,
      cacheHitRate: telemetry.cacheHitRate,
      latencyMs: telemetry.latencyMs,
      resultCount: telemetry.resultCount,
      timedOut: telemetry.timedOut,
      timeoutRate: telemetry.timeoutRate
    },
    source: productSearchTelemetrySource,
    ...(error ? { error } : {})
  };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const parsedQuery = parseProductSearchQuery(request);
  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: 'invalid_product_search_params',
        issues: parsedQuery.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  const { q: query } = parsedQuery.data;
  const { expansion, telemetry: expansionTelemetry } = expandGrocerySearchQueryWithTelemetry(query);

  if (query.length < 2) {
    const telemetry = buildPerformanceTelemetry(query, 0, startedAt, expansionTelemetry);
    logPerformanceTelemetry(telemetry);
    return NextResponse.json(responsePayload(query, [], expansion, telemetry));
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    const telemetry = buildPerformanceTelemetry(query, 0, startedAt, expansionTelemetry);
    logPerformanceTelemetry(telemetry);
    return NextResponse.json(
      responsePayload(query, [], expansion, telemetry, 'product_search_database_unconfigured'),
      { status: 503 }
    );
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const searchQueries = fuzzyProductSearchQueries(query, expansion);
    const batches = await Promise.all(searchQueries.map((expandedQuery) => searchProductsByText(executor, expandedQuery, { limit: 8 })));
    const results = rankFuzzyProductResults(query, batches, expansion);
    const telemetry = buildPerformanceTelemetry(query, results.length, startedAt, expansionTelemetry);
    logPerformanceTelemetry(telemetry);
    return NextResponse.json(responsePayload(query, withSearchExplanationBadges(query, results, expansion), expansion, telemetry));
  } catch (error) {
    const telemetry = buildPerformanceTelemetry(query, 0, startedAt, expansionTelemetry, isTimeoutError(error));
    console.error('Product search query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    logPerformanceTelemetry(telemetry);
    return NextResponse.json(
      responsePayload(query, [], expansion, telemetry, 'product_search_query_failed'),
      { status: 500 }
    );
  }
}
