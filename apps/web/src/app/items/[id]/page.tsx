import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { chainPriceRows, findProduct, formatSek } from '@/lib/verified-data';
import PriceStreamPanel from '@/components/price-stream-panel';
import type { AxfoodProduct } from '@/lib/axfood-products';

type StaticPriceRow = {
  chainName: string;
  storeName: string;
  price: number;
  observedAt: string | null;
};

type ProductRecord = NonNullable<ReturnType<typeof findProduct>>;

function isAxfoodProduct(product: ProductRecord): product is AxfoodProduct {
  return typeof product === 'object' && 'chains' in product && product.chains !== undefined;
}

function staticRowsFromProduct(product: ProductRecord): StaticPriceRow[] {
  if (!isAxfoodProduct(product)) return [];

  return chainPriceRows(product)
    .filter((row): row is typeof row & { price: number } => row.price !== null && Number.isFinite(row.price))
    .map((row) => ({
      chainName: row.chain,
      storeName: `${row.chain} store`,
      price: row.price,
      observedAt: null
    }));
}

function brandForProduct(product: ProductRecord) {
  return 'lowestPrice' in product ? product.brand : product.brands || 'Brand not reported';
}

function titleForProduct(product: ProductRecord) {
  return 'lowestPrice' in product
    ? `${product.name} ${product.subline}`
    : `${product.name} (Observation snapshot)`;
}

function latestStaticSummary(product: ProductRecord) {
  if ('lowestPrice' in product) {
    return {
      bestPrice: product.lowestPrice,
      chainCount: Object.keys(product.chains).length
    };
  }

  const latest = [...product.observations].sort((left, right) => right.date.localeCompare(left.date))[0];
  return {
    bestPrice: latest ? latest.price : null,
    chainCount: product.observations.length
  };
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) return { title: 'Item not found' };

  return {
    title: `${titleForProduct(product)} · Live prices`,
    description: `Live WebSocket price stream for ${product.name}.`
  };
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();

  const rows = staticRowsFromProduct(product);
  const { bestPrice, chainCount } = latestStaticSummary(product);

  return (
    <PageShell>
      <Eyebrow>Item price stream</Eyebrow>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">{titleForProduct(product)}</h1>
          <p className="max-w-3xl text-sm font-black text-slate-700">{brandForProduct(product)} · stream demo for real-time price updates from API</p>
          <PriceStreamPanel productId={id} fallbackRows={rows} />
          <p>
            <Link className="text-sm font-bold text-indigo-800 underline decoration-indigo-300 underline-offset-4" href="/products">
              Open verified product directory
            </Link>
          </p>
        </div>
        <Card className="h-fit">
          <h2 className="text-xl font-black">Current snapshot</h2>
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">Product id: <code>{id}</code></p>
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">Current static best price: {bestPrice ? formatSek(bestPrice) : 'not available'}</p>
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">Observed chains in static snapshot: {chainCount}</p>
          <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-600">If this page reconnects with a socket, rows refresh from the live latest_prices table every few seconds. In local dev without DATABASE_URL, it remains static.</p>
        </Card>
      </div>
    </PageShell>
  );
}
