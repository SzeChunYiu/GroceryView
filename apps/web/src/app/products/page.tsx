import Link from 'next/link';
import { pricedProducts, categoryLabels } from '@/lib/openprices-products';
import {
  dbLatestPrices,
  dbSiteSnapshotMeta,
  dbSourceSummaries
} from '@/lib/ingested/db-site-snapshot';

export const dynamic = 'force-static';

function formatSek(value: number) {
  return `SEK ${value.toFixed(2)}`;
}

function formatObserved(value: string | null) {
  if (!value) return 'n/a';
  return value.slice(0, 10);
}

export default function ProductsIndexPage() {
  const byCat = new Map<string, typeof pricedProducts>();
  for (const p of pricedProducts) {
    const k = p.category || 'pantry';
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(p);
  }
  const ordered = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);
  const totalObs = dbSiteSnapshotMeta.observationCount || pricedProducts.reduce((s, p) => s + p.observationCount, 0);
  const newestObservedAt = dbSiteSnapshotMeta.newestObservedAt || pricedProducts[0]?.lastObservedAt || null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">GroceryView</Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/stores">Stores</Link>
          <Link href="/categories">Categories</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Stockholm grocery prices</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          {pricedProducts.length.toLocaleString()} products · {totalObs.toLocaleString()} real SEK observations.
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Static pages are rendered from the latest Postgres snapshot generated at build time from
          latest_prices and observations. New imported prices can reach the site through the database-backed
          build without committing per-retailer fixture files.
        </p>
        <p className="mt-2 text-sm font-semibold text-market-ink/55">
          Snapshot source: {dbSiteSnapshotMeta.source} · latest rows: {dbSiteSnapshotMeta.latestPriceCount.toLocaleString()} · newest observation: {formatObserved(newestObservedAt)}.
        </p>
      </header>

      {dbSourceSummaries.length > 0 && (
        <section className="mb-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {dbSourceSummaries.map((source) => (
            <div key={source.source} className="rounded-lg border border-market-ink/10 bg-white p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-black">{source.label}</span>
                <span className="text-sm font-bold text-market-mint">{source.rowCount}</span>
              </div>
              <p className="mt-1 text-xs text-market-ink/55">latest {formatObserved(source.retrievedAt)}</p>
            </div>
          ))}
        </section>
      )}

      {ordered.length > 0 && (
        <section className="mb-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {ordered.map(([cat, items]) => (
            <Link key={cat} href={`/categories/${cat}`} className="rounded-lg border border-market-ink/10 bg-white p-4 hover:border-market-mint/70">
              <div className="flex items-baseline justify-between">
                <span className="font-black">{categoryLabels[cat] || cat}</span>
                <span className="text-sm font-bold text-market-mint">{items.length}</span>
              </div>
              <p className="mt-1 text-xs text-market-ink/55">
                from {formatSek(Math.min(...items.map(i => i.priceMin)))} to {formatSek(Math.max(...items.map(i => i.priceMax)))}
              </p>
            </Link>
          ))}
        </section>
      )}

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1.8fr_1fr_0.8fr_0.8fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Latest DB price</span>
          <span>Store</span>
          <span>Type</span>
          <span>Observed</span>
          <span className="text-right">Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {dbLatestPrices.slice(0, 500).map((p) => (
            <li key={`${p.code}-${p.chainSlug}-${p.storeSlug ?? 'online'}-${p.priceType}`} className="grid grid-cols-[1.8fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <span className="truncate font-semibold text-market-ink" title={p.productName}>{p.productName}</span>
              <span className="truncate text-market-ink/65">{p.storeName || p.chainName}</span>
              <span className="truncate text-market-ink/65">{p.priceType}</span>
              <span className="truncate text-market-ink/65">{formatObserved(p.observedAt)}</span>
              <span className="text-right font-bold">{formatSek(p.price)}</span>
            </li>
          ))}
          {dbLatestPrices.length === 0 && (
            <li className="px-4 py-4 text-sm text-market-ink/55">
              No generated Postgres latest-price rows are present in this build. Set DATABASE_URL before the web build
              to emit the live DB snapshot.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.6fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Product</span>
          <span>Brand</span>
          <span>Category</span>
          <span>Median SEK</span>
          <span className="text-right">Obs</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {pricedProducts.slice(0, 500).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_1fr_0.6fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <span className="truncate font-semibold" title={p.name}>{p.name}</span>
              <span className="truncate text-market-ink/65">{p.brands || 'n/a'}</span>
              <span className="text-market-ink/65">{categoryLabels[p.category] || p.category}</span>
              <span className="font-bold">{formatSek(p.priceMedian)}</span>
              <span className="text-right text-xs text-market-ink/45">{p.observationCount}</span>
            </li>
          ))}
          {pricedProducts.length === 0 && (
            <li className="px-4 py-4 text-sm text-market-ink/55">
              The committed fallback snapshot is empty so local builds can pass without database access.
            </li>
          )}
        </ul>
        {pricedProducts.length > 500 && (
          <p className="px-4 py-3 text-xs text-market-ink/55">
            Showing top 500 of {pricedProducts.length.toLocaleString()} by observation count.
            Use /categories/&lt;slug&gt; to drill in.
          </p>
        )}
      </section>
    </main>
  );
}
