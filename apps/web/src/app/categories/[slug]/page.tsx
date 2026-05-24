import { notFound } from 'next/navigation';
import { summarizeCategoryDealLeaders } from '@groceryview/core';
import { CategoryBreadcrumb } from '@/components/Breadcrumb';
import { ItemGrid, type ItemGridItem, type ItemGridSort, type ItemGridSource } from '@/components/ItemGrid';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { axfoodProducts } from '@/lib/axfood-products';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { categoryDealLeaderCandidates, categorySummaries, dataFreshnessBadges, formatPct, formatSek } from '@/lib/verified-data';
import { metadataForCategory } from '@/lib/seo';

const validSorts = new Set<ItemGridSort>(['relevance', 'price-asc', 'price-desc', 'observed-desc', 'name-asc']);
const validSources = new Set<ItemGridSource>(['all', 'openprices', 'chain']);
const pageSize = 24;

type CategoryPageSearchParams = {
  q?: string | string[];
  source?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

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

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function searchState(searchParams: CategoryPageSearchParams) {
  const q = (firstParam(searchParams.q) ?? '').trim().slice(0, 80);
  const sourceValue = firstParam(searchParams.source) ?? 'all';
  const sortValue = firstParam(searchParams.sort) ?? 'relevance';
  const pageValue = Number.parseInt(firstParam(searchParams.page) ?? '1', 10);
  return {
    q,
    source: validSources.has(sourceValue as ItemGridSource) ? sourceValue as ItemGridSource : 'all',
    sort: validSorts.has(sortValue as ItemGridSort) ? sortValue as ItemGridSort : 'relevance',
    page: Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1
  };
}

function openPriceGridItem(product: typeof pricedProducts[number]): ItemGridItem {
  return {
    id: `open-${product.slug}`,
    slug: product.slug,
    name: product.name,
    brand: product.brands || undefined,
    image: product.image || undefined,
    source: 'openprices',
    sourceLabel: 'OpenPrices observation',
    price: product.priceMedian,
    priceLabel: formatSek(product.priceMedian),
    detailLabel: `${product.observationCount.toLocaleString('sv-SE')} observations · ${formatSek(product.priceMin)}–${formatSek(product.priceMax)} · latest ${product.lastObservedAt}`,
    observedAt: product.lastObservedAt,
    href: `/products/${product.slug}`,
    badges: [product.nutriscore !== 'unknown' ? `Nutri-Score ${product.nutriscore.toUpperCase()}` : 'Nutrition unknown', product.quantity].filter(Boolean)
  };
}

function chainGridItem(product: typeof axfoodProducts[number]): ItemGridItem {
  return {
    id: `chain-${product.slug}`,
    slug: product.slug,
    name: product.name,
    brand: product.brand || undefined,
    image: product.image || undefined,
    source: 'chain',
    sourceLabel: 'Axfood chain spread',
    price: product.lowestPrice,
    priceLabel: formatSek(product.lowestPrice),
    detailLabel: `${product.lowestChain} lowest · ${formatPct(product.spreadPct)} spread · ${product.inChains.join(', ')}`,
    spreadPct: product.spreadPct,
    href: `/products/${product.slug}`,
    badges: [product.subline, ...product.labels].filter(Boolean).slice(0, 4)
  };
}

const axfoodCategoryAliases: Record<string, string[]> = {
  baby: ['barn'],
  beverages: ['dryck'],
  bread: ['brod-och-kakor'],
  breakfast: ['skafferi', 'mejeri-ost-och-agg'],
  'coffee-tea': ['skafferi'],
  dairy: ['mejeri-ost-och-agg'],
  fish: ['fisk-och-skaldjur'],
  frozen: ['fryst'],
  household: ['hem-och-hushall'],
  meat: ['kott-fagel-och-chark'],
  pantry: ['skafferi'],
  'personal-care': ['halsa-och-skonhet'],
  pet: ['djur'],
  produce: ['frukt-och-gront'],
  snacks: ['godis-snacks-och-glass'],
  sweets: ['godis-snacks-och-glass']
};

function chainCategoryMatches(productCategory: string, slug: string) {
  return productCategory === slug || (axfoodCategoryAliases[slug] ?? []).includes(productCategory);
}

function categoryItems(slug: string) {
  return [
    ...pricedProducts.filter((product) => product.category === slug).map(openPriceGridItem),
    ...axfoodProducts.filter((product) => chainCategoryMatches(product.category, slug)).map(chainGridItem)
  ];
}

export default async function CategoryPage({
  params,
  searchParams
}: Readonly<{
  params: Promise<{ slug: string }>;
  searchParams?: Promise<CategoryPageSearchParams>;
}>) {
  const { slug } = await params;
  const categoryLabel = categoryLabels[slug];
  if (!categoryLabel) notFound();

  const controls = searchState(await (searchParams ?? Promise.resolve({})));
  const gridItems = categoryItems(slug);
  const chainRows = gridItems.filter((item) => item.source === 'chain');
  const openRows = gridItems.filter((item) => item.source === 'openprices');
  const categoryFreshnessBadges = dataFreshnessBadges.filter((badge) => badge.sourceKind === 'axfood' || badge.sourceKind === 'openprices');
  const dealLeaders = categoryDealLeadersFor(slug);

  return (
    <PageShell>
      <Eyebrow>Category</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{categoryLabel}</h1>
      <CategoryBreadcrumb categoryLabel={categoryLabel} slug={slug} />
      <p className="mt-3 max-w-3xl text-lg text-slate-700">
        Browse {gridItems.length.toLocaleString('sv-SE')} verified rows in a sortable, filterable grid with {pageSize} items per page.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">OpenPrices</p>
          <p className="mt-2 text-3xl font-black">{openRows.length.toLocaleString('sv-SE')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Community price observations in this category.</p>
        </Card>
        <Card className="border-sky-200 bg-sky-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-800">Chain rows</p>
          <p className="mt-2 text-3xl font-black">{chainRows.length.toLocaleString('sv-SE')}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Catalogue rows with chain spread evidence.</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">Pagination</p>
          <p className="mt-2 text-3xl font-black">{pageSize}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">Rows per page, controlled by URL filters.</p>
        </Card>
      </div>

      <ItemGrid categorySlug={slug} items={gridItems} page={controls.page} pageSize={pageSize} query={controls.q} sort={controls.sort} source={controls.source} />

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
            <a className="rounded-2xl border border-emerald-100 bg-white p-4 hover:border-emerald-700" href={`/products/${leader.productId}`} key={leader.productId}>
              <p className="font-black text-slate-950">{leader.productName}</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{leader.signal}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{leader.storeName} lowest · sourceConfidence {(leader.sourceConfidence * 100).toFixed(0)}%</p>
            </a>
          ))}
          {dealLeaders.length === 0 ? <p className="rounded-2xl border border-dashed border-emerald-200 bg-white p-4 text-sm font-semibold text-slate-700">No trusted category deal leader yet; GroceryView will not fabricate a category deal without matched chain prices.</p> : null}
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Category data-freshness badges</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Freshness and confidence for this category surface</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">Category rows can mix chain catalogue and community observations, so each badge keeps its own freshnessLabel, coverage label, and confidenceBadge.</p>
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
    </PageShell>
  );
}
