import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pricedProducts, categoryLabels } from '@/lib/openprices-products';
import { buildCategoryCanonicalPath, type SearchParamMap } from '@/lib/metadata-canonical';

export const dynamic = 'force-static';

type CategoryParams = {
  slug: string;
};

type CategoryPageContext = {
  params: Promise<CategoryParams>;
  searchParams?: Promise<SearchParamMap>;
};

export async function generateMetadata({
  params,
  searchParams
}: Readonly<CategoryPageContext>): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const canonicalUrl = buildCategoryCanonicalPath(`/categories/${slug}`, resolvedSearchParams);

  const label = categoryLabels[slug] || slug;

  return {
    title: `${label} category`,
    alternates: {
      canonical: canonicalUrl
    }
  };
}

export function generateStaticParams() {
  const slugs = new Set(pricedProducts.map((p) => p.category || 'pantry'));
  return [...slugs].map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: Readonly<{ params: Promise<CategoryParams> }>) {
  const { slug } = await params;
  const items = pricedProducts.filter((p) => (p.category || 'pantry') === slug);
  if (items.length === 0) notFound();
  const label = categoryLabels[slug] || slug;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/categories" className="text-sm font-bold text-market-mint">← Categories</Link>
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
      </nav>
      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Category</div>
        <h1 className="mt-2 text-4xl font-black leading-tight">{label}</h1>
        <p className="mt-3 text-base leading-7 text-market-ink/65">
          {items.length.toLocaleString()} priced products · SEK {Math.min(...items.map(i => i.priceMin)).toFixed(2)} – {Math.max(...items.map(i => i.priceMax)).toFixed(2)}
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
    </main>
  );
}
