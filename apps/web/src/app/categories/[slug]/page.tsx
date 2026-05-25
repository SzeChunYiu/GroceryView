import Link from 'next/link';
import { notFound } from 'next/navigation';
import { summarizeCategoryDealLeaders } from '@groceryview/core';
import { CategoryBreadcrumb } from '@/components/Breadcrumbs';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ItemGrid, type ItemGridRow } from '@/components/ItemGrid';
import { axfoodProducts } from '@/lib/axfood-products';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { buildCategorySeasonalDiscoveryModules } from '@/lib/price-intelligence';
import { categoryDealLeaderCandidates, categorySummaries, dataFreshnessBadges, formatPct, formatSek, seasonalProduceCalendar } from '@/lib/verified-data';
import { metadataForCategory } from '@/lib/seo';

type CategorySearchParams = Readonly<{ q?: string; sort?: string; page?: string }>;

export async function generateMetadata({ params, searchParams }: Readonly<{ params: Promise<{ slug: string }>; searchParams?: Promise<CategorySearchParams> }>) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const label = categoryLabels[slug];
  if (!label) notFound();
  return metadataForCategory({ slug, label }, resolvedSearchParams);
}

export function generateStaticParams() { return categorySummaries.map((category) => ({ slug: category.slug })); }

function categoryDealLeadersFor(slug: string) {
  return summarizeCategoryDealLeaders({
    candidates: categoryDealLeaderCandidates.filter((candidate) => candidate.category === slug),
    minimumSourceConfidence: 0.6
  });
}

function searchValue(value: string | undefined) { return value?.trim() ?? ''; }
function pageValue(value: string | undefined) { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : 1; }

export default async function CategoryPage({ params, searchParams }: Readonly<{ params: Promise<{ slug: string }>; searchParams?: Promise<CategorySearchParams> }>) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const categoryLabel = categoryLabels[slug];
  if (!categoryLabel) notFound();

  const query = searchValue(resolvedSearchParams?.q);
  const sort = searchValue(resolvedSearchParams?.sort) || 'name';
  const page = pageValue(resolvedSearchParams?.page);
  const chainRows = axfoodProducts.filter((product) => product.category === slug);
  const openRows = pricedProducts.filter((product) => product.category === slug);
  const itemGridRows: ItemGridRow[] = [
    ...chainRows.map((product) => ({
      id: `axfood-${product.slug}`,
      name: product.name,
      brand: product.brand,
      href: `/products/${product.slug}`,
      source: 'Axfood' as const,
      price: product.lowestPrice,
      priceLabel: formatSek(product.lowestPrice),
      category: product.category,
      observationLabel: `${product.inChains.length} chains`,
      image: product.image
    })),
    ...openRows.map((product) => ({
      id: `openprices-${product.slug}`,
      name: product.name,
      brand: product.brands || 'Brand not reported',
      href: `/products/${product.slug}`,
      source: 'OpenPrices' as const,
      price: product.priceMedian,
      priceLabel: formatSek(product.priceMedian),
      category: product.category,
      observationLabel: `${product.observationCount} obs.`,
      image: product.image
    }))
  ];
  const categoryFreshnessBadges = dataFreshnessBadges.filter((badge) => badge.sourceKind === 'axfood' || badge.sourceKind === 'openprices');
  const dealLeaders = categoryDealLeadersFor(slug);
  const seasonalModules = buildCategorySeasonalDiscoveryModules({
    categorySlug: slug,
    seasonalRows: seasonalProduceCalendar.produceSeasonalityRows
  });

  return (
    <PageShell>
      <Eyebrow>Category</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{categoryLabel}</h1>
      <CategoryBreadcrumb categoryLabel={categoryLabel} slug={slug} />
      <p className="mt-3 text-lg text-slate-700">{chainRows.length} Axfood rows and {openRows.length} OpenPrices rows shown from verified source modules.</p>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/60">
        <div data-category-deal-leaders>
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
                data-category-deal-leader={leader.productId}
                href={`/products/${leader.productId}`}
                key={leader.productId}
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{categoryLabel}</p>
                <p className="mt-2 font-black text-slate-950">{leader.productName}</p>
                <p className="mt-2 text-2xl font-black text-emerald-800">{leader.signal}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {leader.storeName} lowest chain · sourceConfidence {(leader.sourceConfidence * 100).toFixed(0)}% · visible chain coverage only
                </p>
              </Link>
            ))}
            {dealLeaders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-700">
                No trusted category deal leader yet; GroceryView will not fabricate a category deal without matched chain prices.
              </p>
            ) : null}
          </div>
        </div>
      </Card>
      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Eyebrow>Seasonal discovery</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">In-season produce, holiday staples, and historic best-buy windows</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">{seasonalModules.guardrail}</p>
          </div>
          <Link className="rounded-full bg-lime-700 px-5 py-3 text-sm font-black text-white" href="/seasonal-calendar">
            Full seasonal calendar
          </Link>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">In-season produce</p>
            <div className="mt-3 space-y-3">
              {seasonalModules.inSeasonProduce.map((row) => (
                <Link className="block rounded-xl bg-lime-50 p-3 text-sm font-bold text-slate-800 hover:text-lime-900" href={`/products/${row.slug}`} key={`seasonal-${row.slug}`}>
                  {row.productName} · {row.bestBuyMonth} · {row.historicalMonthlyAverageLabel}
                </Link>
              ))}
              {seasonalModules.inSeasonProduce.length === 0 ? <p className="text-sm font-semibold text-slate-600">No nearby best-buy month is backed by enough observations yet.</p> : null}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Holiday staples</p>
            <div className="mt-3 space-y-3">
              {seasonalModules.holidayStaples.map((staple) => (
                <div className="rounded-xl bg-amber-50 p-3" key={`${staple.label}-${staple.months}`}>
                  <p className="text-sm font-black text-amber-950">{staple.label}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">{staple.months}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{staple.rationale}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Historic best-buy windows</p>
            <div className="mt-3 space-y-3">
              {seasonalModules.historicBestBuyWindows.map((row) => (
                <Link className="block rounded-xl bg-emerald-50 p-3 text-sm font-bold text-slate-800 hover:text-emerald-900" href={`/products/${row.slug}`} key={`window-${row.slug}`}>
                  <span className="block font-black">{row.productName}</span>
                  <span className="mt-1 block text-xs leading-5">{row.bestBuyMonth} best-buy · {row.savingsVsTypicalLabel} · {row.confidenceLabel}</span>
                </Link>
              ))}
            </div>
          </div>
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
      <ItemGrid basePath={`/categories/${slug}`} page={page} query={query} rows={itemGridRows} sort={sort} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain spread rows</h2><div className="mt-4 space-y-3">{chainRows.slice(0, 24).map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.lowestPrice)} · {formatPct(product.spreadPct)} spread</p></Link>)}</div></Card>
        <Card><h2 className="text-2xl font-black">OpenPrices rows</h2><div className="mt-4 space-y-3">{openRows.slice(0, 24).map((product) => <Link className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${product.slug}`} key={product.slug}><p className="font-black">{product.name}</p><p className="text-sm text-slate-600">{formatSek(product.priceMedian)} · {product.observationCount} obs. · {product.lastObservedAt}</p></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
