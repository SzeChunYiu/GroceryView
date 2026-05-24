import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryNav } from '@/components/CategoryNav';
import { pricedProducts, categoryLabels } from '@/lib/openprices-products';

export const dynamic = 'force-static';

function buildCategorySummaries() {
  const bySlug = new Map<string, typeof pricedProducts>();

  for (const product of pricedProducts) {
    const slug = product.category || 'pantry';
    const bucket = bySlug.get(slug);
    if (!bucket) {
      bySlug.set(slug, [product]);
    } else {
      bucket.push(product);
    }
  }

  const rows = [...bySlug.entries()].map(([slug, items]) => ({
    slug,
    label: categoryLabels[slug] || slug,
    count: items.length,
    items
  }));

  rows.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.slug.localeCompare(b.slug);
  });

  return rows;
}

export function generateStaticParams() {
  return buildCategorySummaries().map(({ slug }) => ({ slug }));
}

export default async function CategoryPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const categories = buildCategorySummaries();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const items = category.items;
  const label = category.label;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/categories" className="text-sm font-bold text-market-mint">← Categories</Link>
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CategoryNav categories={categories} activeCategory={slug} />

        <div>
          <header className="mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Category</div>
            <h1 className="mt-2 text-4xl font-black leading-tight">{label}</h1>
            <p className="mt-3 text-base leading-7 text-market-ink/65">
              {items.length.toLocaleString()} priced products · SEK {Math.min(...items.map((i) => i.priceMin)).toFixed(2)} – {Math.max(...items.map((i) => i.priceMax)).toFixed(2)}
            </p>
          </header>
          <ul className="divide-y divide-market-ink/5 rounded-lg border border-market-ink/10 bg-white">
            {items.map((p) => (
              <li key={p.code} className="grid grid-cols-[2.5fr_1fr_1fr_0.5fr] gap-3 px-4 py-3 text-sm">
                <span className="font-semibold">{p.name}</span>
                <span className="text-market-ink/65">{p.brands || '—'}</span>
                <span className="font-bold">SEK {p.priceMedian.toFixed(2)}</span>
                <span className="text-right text-xs text-market-ink/45">{p.observationCount} obs</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
