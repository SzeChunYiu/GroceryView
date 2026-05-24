import Link from 'next/link';
import { pricedProducts, categoryLabels } from '@/lib/openprices-products';
import { coopProducts, coopSource } from '@/lib/ingested/coop';
import { hemkopProducts, hemkopSource } from '@/lib/ingested/hemkop';
import { icaProducts, icaSource } from '@/lib/ingested/ica';
import { icaReklambladOffers, icaReklambladSource } from '@/lib/ingested/ica-reklamblad';
import { mathemProducts, mathemSource } from '@/lib/ingested/mathem';
import { matpriskollenOffers, matpriskollenSource } from '@/lib/ingested/matpriskollen';
import { matsparProducts, matsparSource } from '@/lib/ingested/matspar';
import { openFoodFactsProducts, openFoodFactsSource } from '@/lib/ingested/openfoodfacts';
import { willysProducts, willysSource } from '@/lib/ingested/willys';
import { formatComparablePriceFromObservation } from '@/lib/formatPrice';
import { ItemCard } from '@/components/ItemCard';

export const dynamic = 'force-static';

export default function ProductsIndexPage() {
  const byCat = new Map<string, typeof pricedProducts>();
  for (const p of pricedProducts) {
    const k = p.category || 'pantry';
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k)!.push(p);
  }
  const ordered = [...byCat.entries()].sort((a, b) => b[1].length - a[1].length);
  const totalObs = pricedProducts.reduce((s, p) => s + p.observationCount, 0);

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
          Data from OpenPrices (community submissions) + OpenFoodFacts product metadata.
          Every price below is an observed SEK price submitted by a real shopper, with date.
          Per-store linkage is being added as the ingestion pipeline matures.
        </p>
        <p className="mt-2 text-sm font-semibold text-market-ink/55">
          OpenFoodFacts export ingest: {openFoodFactsSource.rowCount} verified product rows retrieved {openFoodFactsSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          Willys search ingest: {willysSource.rowCount} live SEK product rows retrieved {willysSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          Hemköp search ingest: {hemkopSource.rowCount} live SEK product rows retrieved {hemkopSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          Mathem search ingest: {mathemSource.rowCount} live SEK product rows retrieved {mathemSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          ICA handla ingest: {icaSource.rowCount} public catalog rows retrieved {icaSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          ICA reklamblad ingest: {icaReklambladSource.rowCount} public weekly offer rows retrieved {icaReklambladSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          Coop search ingest: {coopSource.rowCount} public SEK product rows retrieved {coopSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          Matspar search ingest: {matsparSource.rowCount} live SEK comparison rows retrieved {matsparSource.retrievedAt.slice(0, 10)}.
        </p>
        <p className="mt-1 text-sm font-semibold text-market-ink/55">
          Matpriskollen offers ingest: {matpriskollenSource.rowCount} public offer rows retrieved {matpriskollenSource.retrievedAt.slice(0, 10)}.
        </p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pricedProducts.slice(0, 4).map((product) => (
          <ItemCard
            key={product.code}
            title={product.name}
            imageUrl={product.image}
            category={product.category}
            categoryLabel={categoryLabels[product.category]}
            subtitle={`${product.brands || 'Unknown brand'} · SEK ${product.priceMedian.toFixed(2)}`}
            primaryMetric={formatComparablePriceFromObservation(product.priceMedian, product.quantity)}
          />
        ))}
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {ordered.map(([cat, items]) => (
          <Link key={cat} href={`/categories/${cat}`} className="rounded-lg border border-market-ink/10 bg-white p-4 hover:border-market-mint/70">
            <div className="flex items-baseline justify-between">
              <span className="font-black">{categoryLabels[cat] || cat}</span>
              <span className="text-sm font-bold text-market-mint">{items.length}</span>
            </div>
            <p className="mt-1 text-xs text-market-ink/55">
              from SEK {Math.min(...items.map(i => i.priceMin)).toFixed(2)} to SEK {Math.max(...items.map(i => i.priceMax)).toFixed(2)}
            </p>
          </Link>
        ))}
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>OpenFoodFacts product</span>
          <span>Brand</span>
          <span>Quantity</span>
          <span>Nutri-Score</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {openFoodFactsProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.productUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>
                {p.name}
              </a>
              <span className="truncate text-market-ink/65">{p.brands || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.quantity || 'unknown'}</span>
              <span className="text-xs font-black uppercase text-market-ink/55">{p.nutriscoreGrade}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Willys product</span>
          <span>Brand</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {willysProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <span className="truncate font-semibold text-market-ink" title={p.name}>{p.name}</span>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.packageText || 'unknown'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Hemköp product</span>
          <span>Brand</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {hemkopProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <span className="truncate font-semibold text-market-ink" title={p.name}>{p.name}</span>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.packageText || 'unknown'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Mathem product</span>
          <span>Brand</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {mathemProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.productUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>{p.name}</a>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.packageText || 'unknown'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>ICA product</span>
          <span>Brand</span>
          <span>Category</span>
          <span>Card price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {icaProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.productUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>{p.name}</a>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.categories[0] || 'uncategorized'}</span>
              <span className="font-bold">{p.dataPrice || 'store gated'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>ICA reklamblad offer</span>
          <span>Brand</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {icaReklambladOffers.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.flyerUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>{p.name}</a>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.packageText || p.category || 'offer'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Coop product</span>
          <span>Brand</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {coopProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.productUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>{p.name}</a>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.packageText || 'unknown'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Matspar product</span>
          <span>Brand</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {matsparProducts.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.productUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>{p.name}</a>
              <span className="truncate text-market-ink/65">{p.brand || 'unknown'}</span>
              <span className="truncate text-market-ink/65">{p.packageText || 'unknown'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr] border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Matpriskollen offer</span>
          <span>Store</span>
          <span>Package</span>
          <span>Price</span>
        </div>
        <ul className="divide-y divide-market-ink/5">
          {matpriskollenOffers.slice(0, 12).map((p) => (
            <li key={p.code} className="grid grid-cols-[2fr_1fr_1fr_0.8fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <a href={p.productUrl} className="truncate font-semibold text-market-ink hover:text-market-mint" title={p.name}>{p.name}</a>
              <span className="truncate text-market-ink/65">{p.store}</span>
              <span className="truncate text-market-ink/65">{p.packageText || p.category || 'offer'}</span>
              <span className="font-bold">{p.priceText}</span>
            </li>
          ))}
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
              <span className="font-semibold truncate" title={p.name}>{p.name}</span>
              <span className="text-market-ink/65 truncate">{p.brands || '—'}</span>
              <span className="text-market-ink/65">{categoryLabels[p.category] || p.category}</span>
              <span className="font-bold">SEK {p.priceMedian.toFixed(2)}</span>
              <span className="text-right text-xs text-market-ink/45">{p.observationCount}</span>
            </li>
          ))}
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
