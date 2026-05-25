import { createRequire } from 'node:module';

import { createPostgresCatalogReader, createPgQueryExecutor } from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type PgClient = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  release(): void;
};

type PgPool = {
  connect(): Promise<PgClient>;
};

const require = createRequire(import.meta.url);
let pgPool: PgPool | undefined;

function getPgPool(connectionString: string): PgPool {
  if (!pgPool) {
    const { Pool } = require('pg') as { Pool: new (options: { connectionString: string; max: number }) => PgPool };
    pgPool = new Pool({ connectionString, max: 4 });
  }

  return pgPool;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean')?.trim();

  if (!ean) {
    return NextResponse.json({ error: 'Missing required query parameter: ean' }, { status: 400 });
  }

  let client: PgClient | null = null;

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 500 });
    }

    client = await getPgPool(databaseUrl).connect();
    const catalogReader = createPostgresCatalogReader(createPgQueryExecutor(client));
    const products = await catalogReader.listProducts({ search: ean, limit: 100 });
    const matchingProducts = products.filter((product) => product.barcode === ean);

    return NextResponse.json({ products: matchingProducts });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute EAN search.'
      },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
