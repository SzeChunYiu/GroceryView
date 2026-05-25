import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { TrendingCarousel } from '@/components/TrendingCarousel';
import { buildTrendingDiscoveryFeed } from '@/lib/trends';
import { chainSavingsLedger, homepageTrendingPriceChanges } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/trending',
    title: 'Trending grocery discovery | GroceryView',
    description: 'Browse fastest-rising grocery categories, chain savings leaders, and representative products from verified GroceryView trend feeds.'
  });
}

function formatCount(value: number) {
  return new Intl.NumberFormat('sv-SE').format(value);
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

export default function TrendingPage() {
  const discovery = buildTrendingDiscoveryFeed({ city: 'stockholm', categoryLimit: 6, productLimit: 6 });
  const chainLeaders = chainSavingsLedger.slice(0, 4);

  return (
    <PageShell>
      <Eyebrow>Trending discovery</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Fastest-rising grocery movements</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This page expands the homepage trending carousel into category, chain, and representative-product discovery using only verified GroceryView trend feeds.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="border-orange-200 bg-orange-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-800">Categories</p>
          <p className="mt-2 text-4xl font-black text-orange-950">{discovery.categories.length}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-orange-950">Ranked by observation depth, recency, category breadth, and price-spread momentum.</p>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Chains</p>
          <p className="mt-2 text-4xl font-black text-emerald-950">{chainLeaders.length}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">Chain leaders come from matched chain-product savings rows, not inferred store coverage.</p>
        </Card>
        <Card className="border-cyan-200 bg-cyan-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-800">Products</p>
          <p className="mt-2 text-4xl font-black text-cyan-950">{discovery.products.length}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-cyan-950">Representative products reuse the same city trending feed surfaced in the carousel.</p>
        </Card>
      </div>

      <section className="mt-6 rounded-[2rem] border border-orange-200 bg-white p-5 shadow-sm" data-trending-category-discovery>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-800">Fast-rising categories</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Category momentum board</h2>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">Source: {discovery.source}. Generated {discovery.generatedAt.slice(0, 10)}.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {discovery.categories.map((category) => (
            <Link className="rounded-2xl border border-orange-100 bg-orange-50 p-4 transition hover:-translate-y-0.5 hover:border-orange-700" href={`/products?category=${encodeURIComponent(category.category)}`} key={category.category}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-800">#{category.rank} · score {formatCount(category.momentumScore)}</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{category.categoryLabel}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{category.representativeProductName} · {category.representativeBrand}</p>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-600">{category.evidenceLabel}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm" data-trending-chain-discovery>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Chain movers</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Savings leaders by chain</h2>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-emerald-950">Ranked by verified matched chain-product savings already used by catalogue and compare surfaces.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {chainLeaders.map((chain, index) => (
            <Link className="rounded-2xl border border-emerald-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-700" href={`/products/${chain.topProductSlug}`} key={chain.chain}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">#{index + 1} · {chain.products} products</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{chain.chain}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{formatSek(chain.totalSavings)} listed savings · avg {formatSek(chain.averageSaving)}</p>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-600">Top mover: {chain.topProductName} saves {formatSek(chain.topSaving)}.</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-cyan-200 bg-white p-5 shadow-sm" data-trending-product-discovery>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800">Representative products</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Products carrying the current trend</h2>
          </div>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">These cards reuse the city trending item feed with views, list-adds, and observed price movement evidence.</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {discovery.products.map((product) => (
            <Link className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-700" href={product.resultHref} key={product.productSlug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">#{product.rank} · {product.categoryLabel}</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{product.productName}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{product.brand} · {product.priceMovementLabel} price move</p>
              <p className="mt-3 text-xs font-bold leading-5 text-slate-600">{product.evidenceLabel}</p>
            </Link>
          ))}
        </div>
      </section>

      <TrendingCarousel items={homepageTrendingPriceChanges} />
    </PageShell>
  );
}
