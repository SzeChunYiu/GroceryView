import Link from 'next/link';
import { PageShell } from '@/components/data-ui';
import { PageQuestionHeader } from '@/components/mvp/handoff-content';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { getBrowsePageData } from '@/lib/mvp/data';
import { categoryBrowseHref, categoryMarketHref } from '@/lib/mvp/routes';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/browse');
}

export default function BrowsePage() {
  const data = getBrowsePageData();
  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Browse' }]} />
      <PageQuestionHeader
        eyebrow="Browse"
        question="What product category do you want to explore?"
        title="Browse grocery products"
        subtitle="Start with a category, chain, or search. GroceryView will take you to filtered products with prices, stores, freshness, and confidence."
        actions={
          <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href="/search">
            Search all products
          </Link>
        }
      />

      <form action="/search" className="mt-6 flex gap-2">
        <input className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold" name="q" placeholder="Search for milk, chicken, coffee, diapers..." type="search" />
        <button className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-black text-white" type="submit">
          Search
        </button>
      </form>

      <MvpSectionCard className="mt-6" title="Featured categories">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.featured.map((category) => (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 hover:bg-white" key={category.slug}>
              <Link className="text-xl font-black text-slate-950 underline" href={categoryBrowseHref(category.slug)}>
                {category.label}
              </Link>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Compare {category.label.toLowerCase()} prices across chains, product types, and stores.
              </p>
              <p className="mt-2 text-sm font-black text-emerald-900">{category.productCount} verified rows</p>
              <Link className="mt-2 inline-block text-xs font-black text-emerald-800 underline" href={categoryMarketHref(category.slug)}>
                Market view →
              </Link>
            </div>
          ))}
        </div>
      </MvpSectionCard>

      <MvpSectionCard className="mt-6" title="All categories">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => (
            <Link className="rounded-2xl border border-slate-200 bg-white p-4" href={categoryBrowseHref(category.slug)} key={category.slug}>
              <p className="font-black text-slate-950">{category.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {category.hasVerifiedPrices ? `${category.productCount} rows` : 'Category name only — no verified prices yet'}
              </p>
            </Link>
          ))}
        </div>
      </MvpSectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Browse by chain">
          <div className="flex flex-wrap gap-2">
            {data.chains.map((chain) => (
              <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-800" href={chain.href} key={chain.slug}>
                {chain.label}
              </Link>
            ))}
          </div>
        </MvpSectionCard>
        <MvpSectionCard title="Popular searches">
          <div className="flex flex-wrap gap-2">
            {data.popularSearches.map((item) => (
              <Link className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-900" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </MvpSectionCard>
      </div>
    </PageShell>
  );
}
