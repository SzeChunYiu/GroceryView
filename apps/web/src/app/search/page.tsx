import type { Metadata } from 'next';
import Link from 'next/link';
import { pricedProducts } from '@/lib/openprices-products';
import { buildSearchCanonicalPath, type SearchParamMap } from '@/lib/metadata-canonical';

export const dynamic = 'force-dynamic';

type SearchPageContext = {
  searchParams?: Promise<SearchParamMap>;
};

export async function generateMetadata({
  searchParams
}: Readonly<SearchPageContext>): Promise<Metadata> {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));

  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q.trim() : '';

  return {
    title: query ? `Search: ${query}` : 'Search',
    alternates: {
      canonical: buildSearchCanonicalPath('/search', resolvedSearchParams)
    }
  };
}

export default async function SearchPage({
  searchParams
}: Readonly<SearchPageContext>) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q.trim().toLowerCase() : '';
  const products = query
    ? pricedProducts.filter((product) => `${product.name} ${product.brands ?? ''}`.toLowerCase().includes(query))
    : pricedProducts.slice(0, 12);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/products">Products</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/stores">Stores</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Product search</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">Search products</h1>
        <p className="mt-3 text-base leading-7 text-market-ink/65">
          {query
            ? `${products.length.toLocaleString()} result${products.length === 1 ? '' : 's'} for “${resolvedSearchParams.q}”.`
            : 'Type a query in the URL using ?q= to filter by product name or brand.'}
        </p>
      </header>

      <section className="grid gap-3">
        {products.map((product) => (
          <article key={product.code} className="rounded-lg border border-market-ink/10 bg-white p-4">
            <h2 className="text-lg font-black">{product.name}</h2>
            <p className="mt-2 text-sm text-market-ink/70">{product.brands || 'Unknown brand'} · SEK {product.priceMedian.toFixed(2)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
