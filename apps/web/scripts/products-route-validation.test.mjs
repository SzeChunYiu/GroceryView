import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { z } from 'zod';

async function loadProductsRoute() {
  const source = await readFile(new URL('../src/app/api/products/route.ts', import.meta.url), 'utf8');
  const executable = source
    .replace("import { createPgQueryExecutor, searchProductsByText, type ProductSearchResult } from '@groceryview/db';", 'const createPgQueryExecutor = () => ({}); const searchProductsByText = async () => [];')
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = { json: (body, init) => Response.json(body, init) };')
    .replace("import { z } from 'zod';", '')
    .replace("import { recordProductSearchPerformanceTelemetry, type ProductSearchPerformanceTelemetry } from '@/lib/analytics';", 'const recordProductSearchPerformanceTelemetry = (payload) => ({ ...payload, cacheHitRate: payload.cacheHit ? 1 : 0, timeoutRate: payload.timedOut ? 1 : 0 });')
    .replace("import { expandGrocerySearchQueryWithTelemetry, type GrocerySearchExpansion, type GrocerySearchExpansionTelemetry } from '@/lib/search-suggest';", 'const expandGrocerySearchQueryWithTelemetry = (query) => ({ expansion: { query, expandedQueries: query ? [query] : [], matchedAliases: [], matchedSynonyms: [] }, telemetry: { cacheHit: false } });')
    .replace(/type PgPoolLike = \{[\s\S]*?\};\n\n/, '')
    .replace(/type PgModuleLike = \{[\s\S]*?\};\n\n/, '')
    .replace(/let cachedDatabaseUrl: string \| null = null;/, 'let cachedDatabaseUrl = null;')
    .replace(/let cachedPool: PgPoolLike \| null = null;/, 'let cachedPool = null;')
    .replace(/request: Request/g, 'request')
    .replace(/databaseUrl: string/g, 'databaseUrl')
    .replace(/error: unknown/g, 'error')
    .replace(/query: string/g, 'query')
    .replace(/resultCount: number/g, 'resultCount')
    .replace(/startedAt: number/g, 'startedAt')
    .replace(/error\?: string/g, 'error')
    .replace(/: Promise<PgModuleLike>/g, '')
    .replace(/ as \(specifier: string\) => Promise<unknown>/g, '')
    .replace(/ as Partial<PgModuleLike>/g, '')
    .replace(/ as Record<string, unknown>/g, '')
    .replace(/new Map<string, ProductSearchResult>\(\)/g, 'new Map()')
    .replace(/: ProductSearchResult\[\]\[\]/g, '')
    .replace(/: ProductSearchResult\[\]/g, '')
    .replace(/: ProductSearchPerformanceTelemetry/g, '')
    .replace(/: GrocerySearchExpansionTelemetry/g, '')
    .replace(/: GrocerySearchExpansion/g, '')
    .replace(/function responsePayload\(\n  query: string,\n  results,\n  expansion,\n  telemetry,\n  error\?: string\n\)/, 'function responsePayload(query, results, expansion, telemetry, error)')
    .replace(/console\.info/g, 'void')
    .replace(/console\.error/g, 'void')
    .replace('export async function GET(request)', 'async function GET(request)')
    .replace(/export const /g, 'const ');

  return Function('z', `${executable}; return { GET };`)(z);
}

test('products route validation accepts q-only searches and rejects unexpected query params', async () => {
  const { GET } = await loadProductsRoute();

  const accepted = await GET(new Request('https://groceryview.test/api/products?q=a'));
  assert.equal(accepted.status, 200);
  const acceptedBody = await accepted.json();
  assert.deepEqual({
    expandedQueries: acceptedBody.expandedQueries,
    matchedAliases: acceptedBody.matchedAliases,
    matchedSynonyms: acceptedBody.matchedSynonyms,
    query: acceptedBody.query,
    results: acceptedBody.results,
    source: acceptedBody.source
  }, {
    query: 'a',
    expandedQueries: ['a'],
    matchedAliases: [],
    matchedSynonyms: [],
    results: [],
    source: 'postgres.products_tsvector_alias_synonym_expansion'
  });
  assert.equal(acceptedBody.performanceTelemetry.cacheHit, false);
  assert.equal(acceptedBody.performanceTelemetry.resultCount, 0);

  const rejected = await GET(new Request('https://groceryview.test/api/products?q=a&limit=8'));
  assert.equal(rejected.status, 400);
  const body = await rejected.json();
  assert.equal(body.error, 'invalid_product_search_params');
  assert.ok(Array.isArray(body.issues));
  assert.ok(body.issues.some((issue) => /Unrecognized key/.test(issue.message)));
});
