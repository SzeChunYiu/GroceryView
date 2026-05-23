import { createPostgresCatalogReader, createPgQueryExecutor } from '@groceryview/db';
import { NextResponse } from 'next/server';
import { Pool, type PoolClient } from 'pg';

export const runtime = 'nodejs';

let pgPool: Pool | undefined;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ean = searchParams.get('ean')?.trim();

  if (!ean) {
    return NextResponse.json({ error: 'Missing required query parameter: ean' }, { status: 400 });
  }

  let client: PoolClient | null = null;

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 500 });
    }

    if (!pgPool) {
      pgPool = new Pool({ connectionString: databaseUrl, max: 4 });
    }

    client = await pgPool.connect();
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
