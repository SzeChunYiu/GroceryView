import Link from 'next/link';
import { products } from '@/lib/demo-data';
import { EmptyState } from '@/components/EmptyState';
import locale from '@/locales/sv.json';

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    return <EmptyState title={locale.notFound.title} message={locale.notFound.message} />;
  }
  const apiProductId = product.slug === 'zoegas-coffee-450g' ? 'coffee' : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Product terminal</div>
        <h1 className="mt-3 text-4xl font-black">{product.ticker}</h1>
        <p className="mt-2 text-market-ink/65">{product.name}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Current price" value={product.price} />
          <Metric label="Unit price" value={product.unitPrice} />
          <Metric label="Store" value={product.store} />
        </div>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Metadata label="Price type" value={product.priceType} />
          <Metadata label="Confidence" value={product.confidence} />
          <Metadata label="Source timestamp" value={product.observedAt} />
          <Metadata label="Source type" value={product.source} />
          {apiProductId ? <Metadata label="API spread" value={`/products/${apiProductId}/spread`} /> : null}
        </dl>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs font-semibold text-market-ink/55">{label}</span>
    </div>
  );
}

function Metadata({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md border border-market-ink/10 p-3">
      <dt className="font-semibold text-market-ink/55">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
