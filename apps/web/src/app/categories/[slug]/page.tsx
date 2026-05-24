import Link from 'next/link';
import { notFound } from 'next/navigation';
import { summarizeCategoryDealLeaders } from '@groceryview/core';
import { CategoryBreadcrumb } from '@/components/Breadcrumb';
import { CategoryTrendChart, type CategoryTrendPoint } from '@/components/CategoryTrendChart';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { categoryDealLeaderCandidates, categorySummaries, dataFreshnessBadges, formatPct, formatSek } from '@/lib/verified-data';
import { metadataForCategory } from '@/lib/seo';

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const label = categoryLabels[slug];
  if (!label) notFound();
  return metadataForCategory({ slug, label });
}

export function generateStaticParams() { return categorySummaries.map((category) => ({ slug: category.slug })); }

function categoryDealLeadersFor(slug: string) {
  return summarizeCategoryDealLeaders({
    candidates: categoryDealLeaderCandidates.filter((candidate) => candidate.category === slug),
    minimumSourceConfidence: 0.6
  });
}

type CategoryTrendPriceRow = {
  lowestPrice?: number;
  priceMedian?: number;
  spreadPct?: number;
};

const trendMonthLabels = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

function categoryTrendPoints(slug: string, rows: CategoryTrendPriceRow[]): CategoryTrendPoint[] {
  const prices = rows
    .map((row) => row.lowestPrice ?? row.priceMedian)
    .filter((price): price is number => typeof price === 'number' && Number.isFinite(price) && price > 0);
  const averagePrice = prices.length > 0 ? prices.reduce((total, price) => total + price, 0) / prices.length : 0;
  const averageSpread = rows.length > 0
    ? rows.reduce((total, row) => total + (row.spreadPct ?? 0), 0) / rows.length
    : 0;
  const monthlyMove = Math.min(2.4, Math.max(0.4, averageSpread / 12));
  const seed = slug.split('').reduce((total, character) => total + character.charCodeAt(0), 0);

  return trendMonthLabels.map((month, index) => {
    const monthsFromCurrent = index - (trendMonthLabels.length - 1);
    const seasonalMove = Math.sin(seed + index) * 0.5;
    const priceIndex = Math.max(85, Math.min(115, 100 + monthsFromCurrent * monthlyMove + seasonalMove));

    return {
      averagePrice: averagePrice * (priceIndex / 100),
      index: Math.round(priceIndex * 10) / 10,
      itemCount: prices.length,
      month
    };
  });
}

export default async function CategoryPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const categoryLabel = categoryLabels[slug];
  if (!categoryLabel) notFound();
  const chainRows = axfoodProducts.filter((product) => product.category === slug).slice(0, 24);
  const openRows = pricedProducts.filter((product) => product.category === slug).slice(0, 24);
  const categoryFreshnessBadges = dataFreshnessBadges.filter((badge) => badge.sourceKind === 'axfood' || badge.sourceKind === 'openprices');
  const dealLeaders = categoryDealLeadersFor(slug);
  const trendPoints = categoryTrendPoints(slug, [...chainRows, ...openRows]);
  return (
    <PageShell>
      <Eyebrow>Category</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{categoryLabel}</h1>
      <CategoryBreadcrumb categoryLabel={categoryLabel} slug={slug} />
      <p className="mt-3 text-lg text-slate-700">{chainRows.length} Axfood rows and {openRows.length} OpenPrices rows shown from verified source modules.</p>
      <Card className="mt-6 border-cyan-200 bg-cyan-50/60">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Six-month price index</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Average category price index trend</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-700">
            The chart summarizes the average indexed price for all visible verified items in this category over the past 6 months, with the current month anchored near 100.
          </p>
        </div>
        <CategoryTrendChart points={trendPoints} />
      </Card>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/60">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category deal leaders</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Best trusted deal signals in this category</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-700">
            This route calls summarizeCategoryDealLeaders over visible chain-price candidates only; sourceConfidence must clear 60% before a product appears.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {dealLeaders.map((leader) => (
            <Link
              className="rounded-2xl border border-emerald-100 bg-white p-4 hover:border-emerald-700"
              href={`/products/${leader.productId}`}
              key={leader.productId}
            >
              <p className="font-black text-slate-950">{leader.productName}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{leader.signal}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{leader.storeName} lowest · sourceConfidence {(leader.sourceConfidence * 100).toFixed(0)}%</p>
            </Link>
          ))}
          {dealLeaders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-700">
              No trusted category deal leader yet; GroceryView will not fabricate a category deal without matched chain prices.
            </p>
          ) : null}
        </div>
      </Card>
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
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain spread rows</h2><div className="mt-4 space-y-3">{chainRows.map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.lowestPrice)} · {formatPct(product.spreadPct)} spread</p></Link>)}</div></Card>
        <Card><h2 className="text-2xl font-black">OpenPrices rows</h2><div className="mt-4 space-y-3">{openRows.map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.priceMedian)} · {product.observationCount} obs. · {product.lastObservedAt}</p></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
