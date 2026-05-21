import Link from 'next/link';
import { categoryDealLeaders } from '@/lib/demo-data';
import { pricedProducts, categoryLabels } from '@/lib/openprices-products';

export const dynamic = 'force-static';

export default function CategoriesIndexPage() {
  const byCat = new Map<string, typeof pricedProducts>();
  for (const p of pricedProducts) {
    const k = p.category || 'pantry';
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(p);
  }
  const ordered = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);
  const leadersByCategory = new Map(categoryDealLeaders.map((leader) => [leader.category.toLowerCase(), leader]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/stores">Stores</Link>
          <Link href="/products">Products</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Categories</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          {ordered.length} categories of grocery items.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Mapped from OpenFoodFacts category tags. Each card shows count and SEK price range from observed data.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map(([cat, items]) => (
          <Link key={cat} href={`/categories/${cat}`} className="rounded-lg border border-market-ink/10 bg-white p-5 hover:border-market-mint/70">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black">{categoryLabels[cat] || cat}</span>
              <span className="text-sm font-bold text-market-mint">{items.length}</span>
            </div>
            <p className="mt-2 text-sm text-market-ink/65">
              SEK {Math.min(...items.map(i => i.priceMin)).toFixed(2)} – {Math.max(...items.map(i => i.priceMax)).toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-market-ink/45">
              Top: {items.slice(0, 3).map(i => i.name.split(' ').slice(0, 3).join(' ')).join(' · ')}
            </p>
            {leadersByCategory.get((categoryLabels[cat] || cat).toLowerCase()) ? (
              <p className="mt-3 rounded-md bg-market-mint/10 px-2 py-1 text-xs font-bold text-market-ink/70">
                Deal leader: {leadersByCategory.get((categoryLabels[cat] || cat).toLowerCase())?.signal}
              </p>
            ) : null}
          </Link>
        ))}
      </section>
    </main>
  );
}
