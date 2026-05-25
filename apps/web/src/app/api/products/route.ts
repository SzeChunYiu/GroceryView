import { createPgQueryExecutor, searchProductsByText, type ProductSearchResult } from '@groceryview/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

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

function responsePayload(query: string, results: ProductSearchResult[], error?: string) {
  return {
    query,
    results,
    source: 'postgres.products_tsvector',
    ...(error ? { error } : {})
  };
}

export async function GET(request: Request) {
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

  if (query.length < 2) {
    return NextResponse.json({ query, results: [], source: 'postgres.products_tsvector' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json(
      responsePayload(query, [], 'product_search_database_unconfigured'),
      { status: 503 }
    );
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const results = await searchProductsByText(executor, query, { limit: 8 });
    return NextResponse.json({ query, results, source: 'postgres.products_tsvector' });
  } catch (error) {
    console.error('Product search query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(
      responsePayload(query, [], 'product_search_query_failed'),
      { status: 500 }
    );
  }
}
