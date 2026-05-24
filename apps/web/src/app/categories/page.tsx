import Link from 'next/link';
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

export default function CategoriesIndexPage() {
  const categories = buildCategorySummaries();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/stores">Stores</Link>
          <Link href="/products">Products</Link>
        </div>
      </nav>

      <header className="mb-2">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Categories</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          {categories.length} categories of grocery items.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Mapped from OpenFoodFacts category tags. Each card shows count and SEK price range from observed data.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CategoryNav categories={categories} />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {categories.map(({ slug, label, count, items }) => (
            <Link key={slug} href={`/categories/${slug}`} className="rounded-lg border border-market-ink/10 bg-white p-5 hover:border-market-mint/70">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black">{label}</span>
                <span className="text-sm font-bold text-market-mint">{count}</span>
              </div>
              <p className="mt-2 text-sm text-market-ink/65">
                SEK {Math.min(...items.map((i) => i.priceMin)).toFixed(2)} – {Math.max(...items.map((i) => i.priceMax)).toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-market-ink/45">
                Top: {items.slice(0, 3).map((i) => i.name.split(' ').slice(0, 3).join(' ')).join(' · ')}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
