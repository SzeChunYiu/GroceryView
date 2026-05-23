import Link from 'next/link';
import { pricedProducts, categoryLabels } from '@/lib/openprices-products';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string | string[];
};

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildSearchResults(query: string) {
  const cleanQuery = normalizeSearchText(query.trim());
  if (!cleanQuery) return [] as Array<{ product: (typeof pricedProducts)[number]; score: number }>; 

  const terms = cleanQuery.split(/\s+/).filter(Boolean);

  return pricedProducts
    .map((product) => {
      const haystack = normalizeSearchText(
        `${product.name} ${product.brands} ${product.category} ${categoryLabels[product.category] ?? product.category} ${product.slug}`
      );
      const score = terms.filter((term) => haystack.includes(term)).length;
      return score > 0 ? { product, score } : null;
    })
    .filter((entry): entry is { product: (typeof pricedProducts)[number]; score: number } => entry !== null)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.product.name.localeCompare(b.product.name);
    });
}

export default async function SearchPage({
  searchParams
}: Readonly<{ searchParams: SearchParams | Promise<SearchParams> }>) {
  const params = await Promise.resolve(searchParams);
  const qInput = params.q;
  const query = Array.isArray(qInput) ? qInput[0] ?? '' : qInput ?? '';
  const trimmed = query.trim();
  const results = buildSearchResults(trimmed);
  const hasQuery = trimmed.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/products">Products</Link>
          <Link href="/categories">Categories</Link>
          <Link href="/stores">Stores</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Search</div>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Search products</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-market-ink/65">
          Search Stockholm grocery data by product name, brand, or category. Results are matched against the live fixture data.
        </p>
      </header>

      <form className="mb-6 rounded-lg border border-market-ink/10 bg-white p-4" action="/search" method="GET">
        <label className="mb-2 block text-sm font-black uppercase tracking-wide text-market-ink/65" htmlFor="search-input">
          Try a query
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="search-input"
            name="q"
            defaultValue={query}
            placeholder="Type product, brand, or category (e.g. kaffe, mjölk, frukt)"
            className="rounded-md border border-market-ink/20 px-3 py-2 text-sm outline-none ring-market-mint focus:ring-2"
          />
          <button type="submit" className="rounded-md bg-market-mint px-4 py-2 text-sm font-bold text-white">
            Search
          </button>
        </div>
      </form>

      {hasQuery ? (
        results.length === 0 ? (
          <EmptyState
            title={`No results for '${trimmed}'`}
            message="No products matched your search. Try a broader term or browse by category to discover available products."
            suggestions={[
              { label: "Try 'mjölk'", href: '/search?q=mj%C3%B6lk' },
              { label: 'Browse categories', href: '/categories', description: 'Explore category routes and discover popular products quickly.' }
            ]}
          />
        ) : (
          <section className="rounded-lg border border-market-ink/10 bg-white">
            <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
              <span>Product</span>
              <span>Brand</span>
              <span className="text-right">Best price</span>
            </div>
            {results.map(({ product }) => (
              <Link
                key={product.code}
                href={`/products/${product.slug}`}
                className="grid grid-cols-[1.6fr_1fr_1fr] gap-3 px-4 py-3 text-sm text-market-ink hover:bg-market-oat/40"
              >
                <span className="font-semibold">{product.name}</span>
                <span className="text-market-ink/65">{product.brands || 'Unbranded'}</span>
                <span className="text-right font-black">SEK {product.priceMedian.toFixed(2)}</span>
              </Link>
            ))}
          </section>
        )
      ) : (
        <EmptyState
          title="Start your search"
          message="Type a term above to search the OpenPrices fixtures and product catalog that back the GroceryView UI."
          suggestions={[
            { label: "Try 'mjölk'", href: '/search?q=mj%C3%B6lk' },
            { label: 'Browse categories', href: '/categories' }
          ]}
        />
      )}
    </main>
  );
}
