import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';
import { createPgQueryExecutor, findBackInStockNotice } from '@groceryview/db';
import { BackInStockBanner } from '@/components/BackInStockBanner';

export { generateStaticParams };

const metadataForProduct = generateProductMetadata;

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return metadataForProduct({ params: params.then(({ id }) => ({ slug: id })) });
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

async function backInStockNoticeForItem(id: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    return findBackInStockNotice(executor, id);
  } catch (error) {
    console.error('Back-in-stock availability query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return null;
  }
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const backInStockNotice = await backInStockNoticeForItem(id);
  const productPage = await ProductPage({ params: Promise.resolve({ slug: id }) });

  return (
    <>
      <BackInStockBanner notice={backInStockNotice} />
      {productPage}
    </>
  );
}
