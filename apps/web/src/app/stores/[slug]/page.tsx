import Link from 'next/link';
import { notFound } from 'next/navigation';
import { stores } from '@/lib/demo-data';

export function generateStaticParams() {
  return stores.map((store) => ({ slug: store.slug }));
}

export default async function StorePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const store = stores.find((item) => item.slug === slug);
  if (!store) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Store profile</div>
        <h1 className="mt-3 text-4xl font-black">{store.name}</h1>
        <p className="mt-2 text-market-ink/65">
          {store.format} in {store.district}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Metric label="Best category" value={store.bestCategory} />
          <Metric label="Price coverage" value="Verified shelf rows" />
          <Metric label="Distance metadata" value={store.distanceLabel} />
          <Metric label="Deal Score policy" value="No distance penalty" />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <strong className="block text-xl">{value}</strong>
      <span className="text-xs font-semibold text-market-ink/55">{label}</span>
    </div>
  );
}
