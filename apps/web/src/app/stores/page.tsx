import Link from 'next/link';
import { osmStores } from '@/lib/osm-stores';
import { products, stores as curatedStores } from '@/lib/demo-data';
import { itemDetailHref } from '@/lib/item-route';
import {
  makeRetailerSlug,
  normalizeRetailerChain,
  summarizeRetailerChains,
  type RetailerPriceSample,
  type RetailerChainOverview
} from '../../../../packages/db/src/queries/retailers';

type SearchParams = {
  brand?: string | string[];
};

export const dynamic = 'force-static';

function makeChainLogo({ text, color, brand }: { text: string; color: string; brand: string }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
      style={{ backgroundColor: color }}
      aria-label={`${brand} logo`}
    >
      {text}
    </div>
  );
}

function parsePrice(price: string): number {
  const numeric = price.replace(',', '.').replace(/[^0-9.]/g, '').trim();
  return Number(numeric);
}

function derivePriceCategory(productName: string, productSlug: string): string {
  const text = `${productName} ${productSlug}`.toLowerCase();
  if (text.includes('coffee')) return 'coffee';
  if (text.includes('milk') || text.includes('jäg') || text.includes('yoghurt') || text.includes('butter') || text.includes('egg')) return 'dairy';
  if (text.includes('ketchup') || text.includes('pasta') || text.includes('rice') || text.includes('tomato') || text.includes('beans')) return 'pantry';
  if (text.includes('bread') || text.includes('jattefralla') || text.includes('toast') || text.includes('bregott')) return 'bakery';
  return 'general';
}

function buildPriceSamples(productsForPricing: typeof products): RetailerPriceSample[] {
  return productsForPricing
    .map((product) => ({
      chain: normalizeRetailerChain(product.store),
      category: derivePriceCategory(product.name, product.slug),
      price: parsePrice(product.price)
    }))
    .filter((sample): sample is RetailerPriceSample => Number.isFinite(sample.price) && sample.chain.trim() !== '');
}

function buildChainSummary(): RetailerChainOverview[] {
  const chainPriceSamples = buildPriceSamples(products);
  return summarizeRetailerChains({
    stores: osmStores.map((store) => ({
      chain: normalizeRetailerChain(store.brand),
      city: store.city
    })),
    priceSamples: chainPriceSamples
  });
}

function formatAverageRank(averagePriceRank: number | null, categoriesObserved: number): string {
  if (!Number.isFinite(averagePriceRank)) {
    return 'No live ranking yet';
  }

  return `${averagePriceRank.toFixed(1)} average rank across ${categoriesObserved} categories`;
}

function resolveBrandSlug(brand: SearchParams['brand']): string {
  return (Array.isArray(brand) ? brand.at(0) : brand) ?? '';
}

export default async function StoresIndexPage({ searchParams }: { searchParams?: SearchParams | Promise<SearchParams> }) {
  const safeSearchParams = ((await Promise.resolve(searchParams)) ?? {}) as SearchParams;

  const chainSummary = buildChainSummary();
  const activeBrandSlug = makeRetailerSlug(resolveBrandSlug(safeSearchParams.brand));
  const selectedChain = chainSummary.find((chain) => chain.chainSlug === activeBrandSlug) ?? null;

  const displayedChains = chainSummary;

  const storesForView = selectedChain
    ? osmStores.filter((store) => normalizeRetailerChain(store.brand) === selectedChain.chain)
    : osmStores;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href={itemDetailHref({ slug: products[0]?.slug ?? 'zoegas-coffee-450g' })}>Products</Link>
          <Link href="/categories/coffee">Categories</Link>
        </div>
      </nav>

      <header className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Stockholm grocery map</div>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          Store chain overview
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-market-ink/65">
          Compare every Stockholm grocery chain footprint, quickly identify local coverage, and spot where each chain sits in
          category price rank.
        </p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayedChains.map((chain) => {
          const isActive = chain.chain === selectedChain?.chain;
          return (
            <Link
              key={chain.chain}
              href={isActive ? '/stores' : `/stores?brand=${chain.chainSlug}`}
              className={`rounded-lg border bg-white p-4 transition ${
                isActive ? 'border-market-mint/70 ring-2 ring-market-mint/50' : 'border-market-ink/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black leading-6">{chain.chain}</h2>
                  <p className="mt-1 text-xs text-market-ink/60">
                    {chain.locationsInSweden.toLocaleString()} locations in Sweden
                  </p>
                  <p className="mt-2 text-xs text-market-ink/55">{formatAverageRank(chain.averagePriceRank, chain.categoriesObserved)}</p>
                </div>
                {makeChainLogo({ text: chain.logoText, color: chain.logoColor, brand: chain.chain })}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-2 rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          {selectedChain ? `${selectedChain.chain} stores (${storesForView.length})` : `Top chains by footprint (${displayedChains.length} shown)`}
        </div>
        <ul className="divide-y divide-market-ink/5">
          {storesForView.slice(0, 120).map((s) => (
            <li key={s.slug} className="grid grid-cols-[1.3fr_0.9fr_1fr_0.55fr] gap-3 px-4 py-2 text-sm hover:bg-market-oat/40">
              <span className="font-semibold">{s.name}</span>
              <span className="text-market-ink/65">{normalizeRetailerChain(s.brand)}</span>
              <span className="truncate text-market-ink/55">{s.address || s.district}</span>
              <span className="text-right text-xs text-market-ink/45">{s.format}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-xs text-market-ink/45">
        Curated profile pages exist for {curatedStores.length} stores. The map still lists all mapped locations to keep route
        coverage discoverable.
      </p>
    </main>
  );
}
