import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories } from '@/lib/demo-data';

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Category terminal</div>
        <h1 className="mt-3 text-4xl font-black">Stockholm {category.name}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Category index" value={category.index} />
          <Metric label="30D movement" value={category.movement} />
          <Metric label="Top current deal" value={category.topDeal} />
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
