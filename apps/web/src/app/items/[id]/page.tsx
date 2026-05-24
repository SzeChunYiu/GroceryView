import { notFound } from 'next/navigation';
import { products } from '@/lib/demo-data';
import { HistoricalPriceLookup } from '@/components/HistoricalPriceLookup';

const itemApiIdsBySlug: Record<string, string> = {
  'zoegas-coffee-450g': 'coffee'
};

export function generateStaticParams() {
  return products.map((product) => ({ id: product.slug }));
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = products.find((item) => item.slug === id);
  if (!product) notFound();

  const apiItemId = itemApiIdsBySlug[product.slug] ?? null;
  if (!apiItemId) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-sm text-market-ink/65">{product.ticker}</p>
      <p className="mt-1 text-market-ink/55">{product.store}</p>

      <dl className="mt-5 space-y-2 text-sm">
        <div>
          <dt className="font-semibold text-market-ink/55">Price</dt>
          <dd>{product.price}</dd>
        </div>
        <div>
          <dt className="font-semibold text-market-ink/55">Unit price</dt>
          <dd>{product.unitPrice}</dd>
        </div>
      </dl>

      <HistoricalPriceLookup productId={apiItemId} apiResource="items" />
    </main>
  );
}
