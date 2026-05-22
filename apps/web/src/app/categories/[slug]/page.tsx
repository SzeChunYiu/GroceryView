import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { categoryDealLeaders, categorySummaries, dataFreshnessBadges, formatPct, formatSek, labelFromSlug } from '@/lib/verified-data';

export function generateStaticParams() { return categorySummaries.map((category) => ({ slug: category.slug })); }

export default async function CategoryPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  if (!categoryLabels[slug]) notFound();
  const chainRows = axfoodProducts.filter((product) => product.category === slug).slice(0, 24);
  const openRows = pricedProducts.filter((product) => product.category === slug).slice(0, 24);
  const dealLeaders = categoryDealLeaders.filter((leader) => leader.category === slug);
  const categoryFreshnessBadges = dataFreshnessBadges.filter((badge) => badge.sourceKind === 'axfood' || badge.sourceKind === 'openprices');
  return (
    <PageShell>
      <Eyebrow>Category</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{labelFromSlug(slug)}</h1>
      <p className="mt-3 text-lg text-slate-700">{chainRows.length} Axfood rows and {openRows.length} OpenPrices rows shown from verified source modules.</p>
      <Card className="mt-6 border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category data-freshness badges</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Freshness and confidence for this category surface</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Category rows can mix chain catalogue and community observations, so each badge keeps its own freshnessLabel, coverage label, and confidenceBadge.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {categoryFreshnessBadges.map((badge) => (
            <div className="rounded-2xl bg-white p-4" key={badge.sourceKind}>
              <p className="text-sm font-black text-slate-950">{badge.sourceName}</p>
              <p className="mt-2 text-lg font-black text-emerald-800">{badge.freshnessLabel}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{badge.coverageLabel}</p>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-black text-slate-700">{badge.confidenceBadge}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category deal leaders</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Best verified deal signal in {labelFromSlug(slug)}</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-emerald-950">
            Leaders come from summarizeCategoryDealLeaders over matched Willys/Hemkop rows scored by calculateDealScore, with source confidence displayed before any Buy/Wait-style claim.
          </p>
        </div>
        {dealLeaders.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {dealLeaders.map((leader) => (
              <Link
                className="rounded-2xl border border-emerald-200 bg-white p-4 hover:border-emerald-700"
                href={`/products/${leader.productSlug}`}
                key={leader.productSlug}
              >
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">{leader.storeName}</p>
                <p className="mt-2 text-xl font-black text-slate-950">{leader.productName}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{leader.signal}</p>
                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-black text-emerald-950">{leader.confidenceLabel}</p>
                <p className="mt-3 text-xs font-semibold text-slate-600">{leader.caveat}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold text-amber-950">
            No category deal leader is shown because this category does not yet have enough matched chain rows above the minimum sourceConfidence threshold.
          </p>
        )}
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain spread rows</h2><div className="mt-4 space-y-3">{chainRows.map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.lowestPrice)} · {formatPct(product.spreadPct)} spread</p></Link>)}</div></Card>
        <Card><h2 className="text-2xl font-black">OpenPrices rows</h2><div className="mt-4 space-y-3">{openRows.map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.priceMedian)} · {product.observationCount} obs. · {product.lastObservedAt}</p></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
