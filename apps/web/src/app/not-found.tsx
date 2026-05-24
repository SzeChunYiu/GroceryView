import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { SearchBar } from '@/components/SearchBar';
import { categorySummaries, topChainSpreads } from '@/lib/verified-data';

export const metadata: Metadata = {
  title: 'Page not found | GroceryView',
  description: 'This page does not exist. Recover with a quick product search or jump to a popular destination.'
};

const categoryLinks = categorySummaries
  .filter((category) => category.openPriceRows > 0 || category.chainRows > 0)
  .slice(0, 6);

const productLinks = topChainSpreads
  .filter((product) => product.slug && product.name)
  .slice(0, 4);

const quickLinks = [
  { href: '/', label: 'Homepage', blurb: 'Return to the market overview and latest verified cards.' },
  { href: '/products', label: 'Products', blurb: 'Browse, search, and filter all verified product rows.' },
  { href: '/categories', label: 'Categories', blurb: 'Jump into ingredient and section-level views.' },
  { href: '/compare', label: 'Compare', blurb: 'Spot cross-chain price spread and cheapest alternatives.' },
  { href: '/stores', label: 'Stores', blurb: 'Review current chain and branch snapshots by profile.' },
  { href: '/savings-dashboard', label: 'Savings', blurb: 'Explore personal inflation and real spending context.' }
];

export default function NotFound() {
  return (
    <PageShell>
      <div className="space-y-6">
        <header className="rounded-[1.8rem] border border-slate-200 bg-white/95 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-800">404 · page missing</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">This URL is off the verified roadmap</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
            The page you requested is not available. Try a direct product search or one of the recovery links below.
          </p>
        </header>

        <Card>
          <h2 className="text-xl font-black text-slate-950">Search products</h2>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Start from here when you have a name, brand, or category in mind.
          </p>
          <SearchBar className="mt-4" />
        </Card>

        <Card>
          <Eyebrow>Popular categories</Eyebrow>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Try a nearby category</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryLinks.map((category) => (
              <Link className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-700" href={`/categories/${category.slug}`} key={category.slug}>
                <p className="font-black text-slate-950">{category.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{category.openPriceRows} OpenPrices · {category.chainRows} Axfood rows</p>
                <p className="mt-2 text-sm text-slate-700">Top spread · {category.strongestSpread.toFixed(1)}%</p>
              </Link>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <Eyebrow>Popular products</Eyebrow>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Popular verified products</h2>
            <div className="mt-4 space-y-3">
              {productLinks.map((product) => (
                <Link className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}>
                  <div>
                    <p className="font-black text-slate-950">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{product.brand || 'Brand not reported'} · {product.subline || 'No size'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-900">{Math.round(product.spreadPct * 10) / 10}% spread</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <Eyebrow>Quick links</Eyebrow>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Navigation helpers</h2>
            <div className="mt-4 space-y-3">
              {quickLinks.map((route) => (
                <Link className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-700" href={route.href} key={route.href}>
                  <p className="font-black text-slate-950">{route.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{route.blurb}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
