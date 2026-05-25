import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadSearchRoute(mockRows = []) {
  const source = await readFile(new URL('../src/app/api/search/route.ts', import.meta.url), 'utf8');
  const calls = [];
  const mockExecutor = {
    async query(sql, values) {
      calls.push({ sql, values });
      return mockRows;
    }
  };
  const executable = source
    .replace("import { createPgQueryExecutor, searchProductsByText, type ProductSearchResult } from '@groceryview/db';", 'const createPgQueryExecutor = () => mockExecutor; const searchProductsByText = async () => [];')
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = { json: (body, init) => Response.json(body, init) };')
    .replace("import { publicApiReadCacheControl } from '@/lib/cache-policy';", "const publicApiReadCacheControl = 'public, max-age=60';")
    .replace("import { prefetchFrequentSearches, readSearchCache, searchCacheKey, writeSearchCache } from '@/lib/search-cache';", 'const prefetchFrequentSearches = () => undefined; const readSearchCache = () => null; const searchCacheKey = (...parts) => parts.join(":"); const writeSearchCache = () => undefined;')
    .replace("import { expandGrocerySearchQuery, type GrocerySearchExpansion } from '@/lib/search-suggest';", 'const expandGrocerySearchQuery = (query) => ({ expandedQueries: query ? [query] : [], matchedAliases: [], matchedFuzzyAliases: [], matchedSynonyms: [], queryWeights: query ? { [query]: 1 } : {} });')
    .replace(/type PgPoolLike = \{[\s\S]*?\};\n\n/, '')
    .replace(/type PgModuleLike = \{[\s\S]*?\};\n\n/, '')
    .replace(/let cachedDatabaseUrl: string \| null = null;/, 'let cachedDatabaseUrl = null;')
    .replace(/let cachedPool: PgPoolLike \| null = null;/, 'let cachedPool = null;')
    .replace(/async function importPgModule\(\): Promise<PgModuleLike> \{[\s\S]*?\n\}/, 'async function importPgModule() { return { Pool: class {} }; }')
    .replace(/async function executorForDatabaseUrl\(databaseUrl: string\) \{[\s\S]*?\n\}/, 'async function executorForDatabaseUrl(databaseUrl) { return mockExecutor; }')
    .replace(/executor: Awaited<ReturnType<typeof executorForDatabaseUrl>>/g, 'executor')
    .replace(/batches: ProductSearchResult\[\]\[\]/g, 'batches')
    .replace(/\): ProductSearchResult\[\] \{/g, ') {')
    .replace(/new Map<string, ProductSearchResult>\(\)/g, 'new Map()')
    .replace(/expandedQuery: string/g, 'expandedQuery')
    .replace(/weight: number/g, 'weight')
    .replace(/ean: string/g, 'ean')
    .replace(/results: ProductSearchResult\[\]/g, 'results')
    .replace(/error\?: string/g, 'error')
    .replace(/query: string/g, 'query')
    .replace(/expansion: GrocerySearchExpansion/g, 'expansion')
    .replace(/cacheStatus\?: 'hit' \| 'miss' \| 'stored'/g, 'cacheStatus')
    .replace(/: Promise<ProductSearchResult\[\]>/g, '')
    .replace(/request: Request/g, 'request')
    .replace(/readSearchCache<ReturnType<typeof responsePayload>>/g, 'readSearchCache')
    .replace(/ as \{[\s\S]*?search_rank: string \| number \| null;\n    \}/, '')
    .replace(/export const /g, 'const ')
    .replace('export async function GET(request)', 'async function GET(request)');

  const { GET } = Function('mockExecutor', `${executable}; return { GET };`)(mockExecutor);
  return { GET, calls };
}

test('search route rejects missing barcode input', async () => {
  const { GET, calls } = await loadSearchRoute();

  const response = await GET(new Request('https://groceryview.test/api/search?ean='));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    query: '',
    ean: '',
    results: [],
    rankingMode: 'exact_barcode',
    source: 'postgres.products_barcode_exact',
    error: 'missing_ean'
  });
  assert.deepEqual(calls, []);
});

test('search route rejects malformed barcode input', async () => {
  const { GET, calls } = await loadSearchRoute();

  const response = await GET(new Request('https://groceryview.test/api/search?ean=abc-7310130003547'));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'invalid_ean');
  assert.deepEqual(calls, []);
});

test('search route uses exact barcode matching only', async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgres://groceryview.test/db';
  try {
    const { GET, calls } = await loadSearchRoute([
      {
        id: 'product-db-ean-7310130003547',
        slug: 'ideal-makaroner',
        name: 'Ideal Makaroner',
        brand: 'Kungsornen',
        image_url: null,
        search_rank: 1
      }
    ]);

    const response = await GET(new Request('https://groceryview.test/api/search?ean=7310130003547'));

    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).results.map((result) => result.id), ['product-db-ean-7310130003547']);
    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /products\.barcode = \$1/);
    assert.doesNotMatch(calls[0].sql, /canonical_name\s+ilike|websearch_to_tsquery|similarity/);
    assert.deepEqual(calls[0].values, ['7310130003547']);
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});
