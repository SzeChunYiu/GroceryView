import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pricedProducts } from '@/lib/openprices-products';
import { ReportPriceDialog } from '@/components/ReportPriceDialog';

export function generateStaticParams() {
  return pricedProducts.slice(0, 40).map((product) => ({ id: product.slug }));
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = pricedProducts.find((candidate) => candidate.slug === id);

  if (!product) {
    notFound();
  }

  const latestObserved = product.observations.at(0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Item detail</div>
        <h1 className="mt-3 text-4xl font-black">{product.name}</h1>
        <p className="mt-2 text-market-ink/65">{product.brands || 'Unknown brand'}</p>
        <p className="mt-1 text-xs text-market-ink/50">slug: {product.slug}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Category" value={product.category} />
          <Metric label="Lowest observed" value={`SEK ${product.priceMin.toFixed(2)}`} />
          <Metric label="Highest observed" value={`SEK ${product.priceMax.toFixed(2)}`} />
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <Metadata label="Store chain" value={product.brands || 'Community data'} />
          <Metadata label="Quantity" value={product.quantity || 'unknown'} />
          <Metadata label="Observation count" value={product.observationCount.toString()} />
          <Metadata label="Last observed" value={latestObserved?.date ?? 'unknown'} />
          <Metadata label="Latest price" value={`SEK ${latestObserved?.price.toFixed(2) ?? 'n/a'}`} />
          <Metadata label="Nutri Score" value={product.nutriscore.toUpperCase()} />
        </dl>
      </section>

      <ReportPriceDialog itemId={product.slug} itemLabel={product.name} />
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
