import Image from 'next/image';
import Link from 'next/link';
import { ActiveFilterChips, AdvancedFilterDrawer } from '@/components/FilterPanel';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { PriceReportReviewActions } from '@/components/price-report-review-actions';
import { OriginFilter, type OriginFilterCode } from '@/components/origin-filter';
import { ProductSortSelect } from '@/components/product-sort-select';
import { ProductPriceCards } from '@/components/product-price-cards';
import { NewArrivalsCarousel } from '@/components/TrendingCarousel';
import { SavedSearchActions } from '@/components/saved-search-actions';
import { ProductGrid } from '@/components/product-grid';
import { ChainLogo } from '@/components/chain-logo';
import { FeaturePlacementMap } from '@/components/feature-placement-map';
import { apohemSource } from '@/lib/ingested/apohem';
import { newProductArrivals } from '@/lib/new-arrivals';
import { buildSavedSearchSubscription } from '@/lib/alert-scheduler';
import { adaptiveProductCards, buildProductSearchView, withProductSearchExplanationBadges, facetedProductSearch, formatSek, immigrantFamiliarBrandSearch, immigrantImageFirstBrowsing, openFoodFactsCatalogPreview, openFoodFactsCatalogSummary, productBrandFilterOptions, topChainSpreads, freshestOpenPrices, watchlistHeartProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { seoLandingProducts } from '@/lib/seo-landing-pages';
import { allergenRiskBadgesForText, buildRemovableSearchFilterChips, resolveAvoidAllergensSearchDefault, signedInAccountAllergenSearchPreference } from '@/lib/search-filters';
import { buildSearchFilterPreset } from '@/lib/search-presets';
import { productImageCdnUrl } from '@/lib/imageCdn';

const PRODUCTS_PER_PAGE = 50;

export const revalidate = 300;

export function generateMetadata() {
  return routeMetadata('/products');
}

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  label?: string | string[];
  origin?: string | string[];
  dietary?: string | string[];
  chain?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  avoidAllergens?: string | string[];
  inStockOnly?: string | string[];
  minConfidence?: string | string[];
  minCarbonScore?: string | string[];
  brand?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

function toPageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '1', 10);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) return 1;
  return parsed;
}

function normalizeSelectedBrand(brand: string | string[] | undefined) {
  const requested = (Array.isArray(brand) ? brand[0] : brand)?.trim();
  if (!requested) return '';
  return productBrandFilterOptions.find((option) => option.value.toLocaleLowerCase('sv-SE') === requested.toLocaleLowerCase('sv-SE'))?.value ?? '';
}

function setFirstParam(params: URLSearchParams, key: keyof SearchParams, value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw?.trim()) params.set(key, raw.trim());
}

function setAllParams(params: URLSearchParams, key: keyof SearchParams, value: string | string[] | undefined) {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  for (const rawValue of rawValues.flatMap((item) => item.split(','))) {
    const trimmed = rawValue.trim();
    if (trimmed) params.append(key, trimmed);
  }
}

function copySearchParams(params: URLSearchParams, source: SearchParams) {
  setFirstParam(params, 'q', source.q);
  setFirstParam(params, 'category', source.category);
  setFirstParam(params, 'label', source.label);
  setAllParams(params, 'origin', source.origin);
  setAllParams(params, 'dietary', source.dietary);
  setFirstParam(params, 'chain', source.chain);
  setFirstParam(params, 'minPrice', source.minPrice);
  setFirstParam(params, 'maxPrice', source.maxPrice);
  setFirstParam(params, 'avoidAllergens', source.avoidAllergens);
  setFirstParam(params, 'inStockOnly', source.inStockOnly);
  setFirstParam(params, 'minConfidence', source.minConfidence);
  setFirstParam(params, 'minCarbonScore', source.minCarbonScore);
  setFirstParam(params, 'sort', source.sort);
}

function productsPageUrl(page: number, selectedBrand = '', searchParams: SearchParams = {}) {
  const params = new URLSearchParams();
  copySearchParams(params, searchParams);
  if (selectedBrand) params.set('brand', selectedBrand);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/products?${query}` : '/products';
}

const ZERO_RESULT_RELATED_SEARCHES = [
  { keywords: ['fil', 'milk', 'yogurt', 'cheese', 'lactose'], searches: ['lactosefri mjölk', 'yoghurt', 'ost'], categoryHints: ['dairy', 'mejeri', 'milk', 'cheese'] },
  { keywords: ['apple', 'banana', 'fruit', 'greens', 'veg'], searches: ['äpplen', 'bananer', 'grönsaker'], categoryHints: ['fruit', 'vegetable', 'produce', 'frukt', 'grönt'] },
  { keywords: ['oat', 'rice', 'pasta', 'flour', 'cereal'], searches: ['havregryn', 'pasta', 'ris'], categoryHints: ['pantry', 'breakfast', 'skafferi'] },
  { keywords: ['coffee', 'tea', 'juice', 'drink', 'soda'], searches: ['kaffe', 'te', 'juice'], categoryHints: ['drink', 'coffee', 'beverage', 'dryck'] },
  { keywords: ['frozen', 'pizza', 'meal', 'dinner'], searches: ['fryst pizza', 'färdigrätt', 'frysta grönsaker'], categoryHints: ['frozen', 'meal', 'fryst'] }
];

function relatedSearchFallback(query: string) {
  const normalizedQuery = query.toLocaleLowerCase('sv-SE');

  return ZERO_RESULT_RELATED_SEARCHES.find((fallback) => (
    fallback.keywords.some((keyword) => normalizedQuery.includes(keyword))
  )) ?? ZERO_RESULT_RELATED_SEARCHES[0];
}

function zeroResultCategoryShortcuts(query: string, selectedCategory: string | string[] | undefined) {
  const normalizedQuery = query.toLocaleLowerCase('sv-SE');
  const activeCategory = (Array.isArray(selectedCategory) ? selectedCategory[0] : selectedCategory)?.toLocaleLowerCase('sv-SE') ?? '';
  const fallback = relatedSearchFallback(query);

  return facetedProductSearch.categoryFacets
    .map((facet) => {
      const normalizedFacet = facet.value.toLocaleLowerCase('sv-SE');
      const score = [
        normalizedQuery && normalizedFacet.includes(normalizedQuery) ? 2 : 0,
        fallback.categoryHints.some((hint) => normalizedFacet.includes(hint)) ? 3 : 0,
        Math.min(facet.count / 100, 1)
      ].reduce((total, value) => total + value, 0);

      return { ...facet, score };
    })
    .filter((facet) => facet.value.toLocaleLowerCase('sv-SE') !== activeCategory)
    .sort((left, right) => right.score - left.score || right.count - left.count)
    .slice(0, 6);
}

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const allergenDefault = resolveAvoidAllergensSearchDefault(resolvedSearchParams.avoidAllergens, signedInAccountAllergenSearchPreference);
  const search = buildProductSearchView(resolvedSearchParams, { accountAvoidAllergensDefault: allergenDefault.checked });
  const { categoryFacets, labelFacets, originFacets, chainFacets, priceRange, inStockOnly, resultCards } = search;
  const drawerPriceRange = {
    min: priceRange.min ?? 0,
    max: priceRange.max ?? 0
  };
  const requestedPage = toPageNumber(resolvedSearchParams.page);
  const selectedBrand = normalizeSelectedBrand(resolvedSearchParams.brand);
  const avoidAllergens = search.allergenAvoidance.checked;
  const baseProductCards = selectedBrand
    ? adaptiveProductCards.filter((card) => card.brand === selectedBrand)
    : adaptiveProductCards;
  const allergenFilteredProductCards = avoidAllergens
    ? baseProductCards.filter((card) => allergenRiskBadgesForText([
      card.name,
      card.brand,
      card.packageLabel,
      card.safetyEvidenceLabel,
      ...card.safetyProfile.allergenTags
    ]).length === 0)
    : baseProductCards;
  const productCards = withProductSearchExplanationBadges(allergenFilteredProductCards, search.query);
  const totalPages = Math.max(1, Math.ceil(resultCards.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const rangeStart = resultCards.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PRODUCTS_PER_PAGE, resultCards.length);
  const pagedResultCards = resultCards.slice(pageStart, rangeEnd);
  const virtualizedResultCards = pagedResultCards.map((card) => ({
    ...card,
    isAvailable: card.isAvailable ?? undefined
  }));
  const virtualizedResultLabel = `Virtualized product results, ${rangeStart.toLocaleString('sv-SE')}–${rangeEnd.toLocaleString('sv-SE')} of ${resultCards.length.toLocaleString('sv-SE')} matches`;
  const defaultSearchCount = facetedProductSearch.resultCards.length;
  const zeroResultFallback = relatedSearchFallback(search.query);
  const zeroResultCategories = zeroResultCategoryShortcuts(search.query, resolvedSearchParams.category);
  const savedSearchSubscription = buildSavedSearchSubscription({ searchParams: resolvedSearchParams, path: '/products' });
  const activeFilterChips = buildRemovableSearchFilterChips(resolvedSearchParams, {
    basePath: '/products',
    labels: {
      chain: Object.fromEntries(search.chainFacets.map((facet) => [facet.value, facet.label])),
      dietary: Object.fromEntries(search.dietaryFilters.map((filter) => [filter.value, filter.label])),
      label: Object.fromEntries(search.labelFacets.map((facet) => [facet.value, facet.label])),
      brand: Object.fromEntries(productBrandFilterOptions.map((brand) => [brand.value, brand.label]))
    }
  });
  const currentSearchPreset = buildSearchFilterPreset(resolvedSearchParams);
  const volatilityBadgeCounts = resultCards.reduce<Record<string, number>>((counts, product) => {
    const status = product.volatilityBadge?.status ?? 'insufficient';
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});

  function searchFacetUrl(overrides: Partial<Record<'category' | 'label' | 'origin' | 'dietary' | 'chain' | 'q' | 'minPrice' | 'maxPrice' | 'avoidAllergens' | 'inStockOnly' | 'minConfidence', string>>) {
    const params = new URLSearchParams();
    copySearchParams(params, resolvedSearchParams);
    for (const [key, value] of Object.entries(overrides)) {
      if (value?.trim()) params.set(key, value.trim());
      else params.delete(key);
    }
    params.delete('page');
    const query = params.toString();
    return query ? `/products?${query}` : '/products';
  }

  return (
    <PageShell>
      <Eyebrow>Products</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Verified product catalogue</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Products are shown only when present in the Axfood chain snapshot or OpenPrices SEK observations. No filler products are rendered.</p>
      <div className="mt-6">
        <FeaturePlacementMap compact focus="products" />
      </div>
      <NewArrivalsCarousel items={newProductArrivals} />
      <Card className="mt-8 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">Pharmacy catalog</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Apohem + Apotek Hjärtat OTC rows</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {apohemSource.rowCount.toLocaleString('sv-SE')} EAN-coded OTC, supplement, and beauty rows are surfaced on
              the pharmacy route with prescription products and medical advice excluded.
            </p>
          </div>
          <Link className="rounded-full bg-indigo-700 px-5 py-3 text-center text-sm font-black text-white" href="/pharmacy">
            Open pharmacy catalog
          </Link>
        </div>
      </Card>
      <Card className="mt-8 border-violet-200 bg-violet-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-800">Product search</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Instant faceted search</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              This preview calls buildFacetedProductSearch over facetedSearchRows generated from real product, latest_prices, chains, and stores-shaped Axfood rows.
              Shoppers can narrow by category, label/dietary evidence, kr/kg or kr/l range, chain, and the inStockOnly priced-row gate without synthetic product or price filler.
              The default facetedProductSearch export contains {defaultSearchCount.toLocaleString('sv-SE')} server-backed rows before URL filters are applied.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-950 shadow-sm">
            {inStockOnly.productCount.toLocaleString('sv-SE')} priced products · {inStockOnly.latestPriceCount.toLocaleString('sv-SE')} latest_prices rows
          </div>
        </div>
        <form action="/products" className="mt-5 grid gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_180px_auto]" method="get">
          {search.originFilters.map((origin) => <input key={origin} name="origin" type="hidden" value={origin} />)}
          {search.sort !== 'relevance' ? <input name="sort" type="hidden" value={search.sort} /> : null}
          {search.filters.inStockOnly ? <input name="inStockOnly" type="hidden" value="true" /> : null}
          <label className="text-sm font-black text-slate-950" htmlFor="product-search-q">
            Search
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950" defaultValue={search.query} id="product-search-q" name="q" />
          </label>
          <label className="text-sm font-black text-slate-950" htmlFor="product-min-carbon-score">
            Min eco score
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950" defaultValue={resolvedSearchParams.minCarbonScore ?? ''} id="product-min-carbon-score" inputMode="numeric" max={100} min={0} name="minCarbonScore" placeholder="0–100" type="number" />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <button className="rounded-full bg-violet-800 px-4 py-3 text-sm font-black text-white" type="submit">Apply filters</button>
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-950">
            <input defaultChecked={avoidAllergens} name="avoidAllergens" type="checkbox" value="true" />
            Exclude allergen-risk items ({allergenDefault.source === 'account_preference' ? 'account default' : 'URL override'})
          </label>
          <AdvancedFilterDrawer
            activeChips={activeFilterChips}
            brandOptions={productBrandFilterOptions.slice(0, 24)}
            categoryFacets={categoryFacets}
            chainFacets={chainFacets}
            currentPreset={currentSearchPreset}
            dietaryFilters={search.dietaryFilters}
            inStockOnly={search.filters.inStockOnly}
            labelFacets={labelFacets}
            maxPrice={search.filters.maxPrice ?? undefined}
            minConfidence={search.filters.minConfidence ?? undefined}
            minPrice={search.filters.minPrice ?? undefined}
            priceRange={drawerPriceRange}
            selectedBrand={selectedBrand}
            selectedCategories={search.filters.categories}
            selectedChains={search.filters.chains}
            selectedLabels={search.labelFilters}
          />
        </form>
        <div className="mt-4">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-violet-800">Removable filter chips</p>
          <ActiveFilterChips chips={activeFilterChips} />
          {search.activeFilters.length > 0 ? (
            <p className="mt-2 text-xs font-semibold text-violet-900">Active URL filters: {search.activeFilters.join(' · ')}</p>
          ) : null}
        </div>
        <SavedSearchActions resultCount={resultCards.length} subscription={savedSearchSubscription} />
        {avoidAllergens ? (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-950">
            Allergen-aware search filtering is on; {search.allergenAvoidance.excludedResultCount.toLocaleString('sv-SE')} risky result{search.allergenAvoidance.excludedResultCount === 1 ? '' : 's'} were excluded from results and recommendations.
          </p>
        ) : null}
        <OriginFilter
          className="mt-5"
          counts={Object.fromEntries(originFacets.map((facet) => [facet.value, facet.count])) as Partial<Record<OriginFilterCode, number>>}
          selected={search.originFilters}
        />
        <ProductSortSelect searchParams={{ ...resolvedSearchParams, brand: selectedBrand }} selectedSort={search.sort} />
        {resultCards.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">No exact matches</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Keep browsing with related searches and category shortcuts</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-amber-950">
              No verified products matched the current filters. Try a nearby term or jump into a populated category without losing the verified-data guardrails.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-sm font-black text-slate-950">Related searches</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {zeroResultFallback.searches.map((relatedSearch) => (
                    <Link className="rounded-full bg-white px-3 py-2 text-xs font-black text-amber-950 shadow-sm" href={`/products?q=${encodeURIComponent(relatedSearch)}`} key={relatedSearch}>
                      {relatedSearch}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">Category shortcuts</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {zeroResultCategories.map((category) => (
                    <Link className="rounded-full bg-white px-3 py-2 text-xs font-black text-amber-950 shadow-sm" href={`/products?category=${encodeURIComponent(category.value)}`} key={category.value}>
                      {category.value} · {category.count}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Category facets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categoryFacets.map((facet) => (
                <Link className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-900" href={searchFacetUrl({ category: facet.value })} key={facet.value}>{facet.value} · {facet.count}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Label / dietary facets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {labelFacets.map((facet) => (
                <Link className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900" href={searchFacetUrl({ label: facet.value })} key={facet.value}>{facet.label} · {facet.count}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Chain facets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {chainFacets.map((facet) => (
                <Link className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-900" href={searchFacetUrl({ chain: facet.value })} key={facet.value}>
                  <ChainLogo chain={facet.label} />
                  {facet.label} · {facet.count}
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Price range + stock</p>
            <p className="mt-3 text-2xl font-black text-slate-950">{formatSek(drawerPriceRange.min)} – {formatSek(drawerPriceRange.max)}</p>
            <p className="mt-2 text-xs font-bold text-slate-600">Comparable unit filters cover kr/kg, kr/l, and per-unit rows. {inStockOnly.label} keeps unpriced catalog rows out of instant results.</p>
            <p className="mt-2 text-xs font-bold text-slate-600">
              Variance badges: {(volatilityBadgeCounts.stable ?? 0).toLocaleString('sv-SE')} stable · {(volatilityBadgeCounts.volatile ?? 0).toLocaleString('sv-SE')} volatile · {(volatilityBadgeCounts['likely-promo'] ?? 0).toLocaleString('sv-SE')} likely promo.
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm font-semibold text-violet-900">
          Rendering {rangeStart.toLocaleString('sv-SE')}–{rangeEnd.toLocaleString('sv-SE')} of {resultCards.length.toLocaleString('sv-SE')} matching products through an accessible virtualized result list.
        </p>
        {/* product.isAvailable === false is rendered inside ProductGrid's VirtualizedProductGrid for measured virtual rows. */}
        <ProductGrid products={virtualizedResultCards} resultLabel={virtualizedResultLabel} />
        {resultCards.length > PRODUCTS_PER_PAGE ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="font-black text-slate-700">
              Showing {rangeStart}-{rangeEnd} of {resultCards.length} virtualized instant products (page {currentPage}/{totalPages})
            </p>
            <div className="flex gap-3">
              {currentPage > 1 ? (
                <Link className="rounded-full bg-white px-4 py-2 shadow-sm" href={productsPageUrl(currentPage - 1, selectedBrand, resolvedSearchParams)}>
                  Previous
                </Link>
              ) : (
                <span className="rounded-full bg-slate-100 px-4 py-2 font-black text-slate-400">Previous</span>
              )}
              {currentPage < totalPages ? (
                <Link className="rounded-full bg-indigo-700 px-4 py-2 text-white" href={productsPageUrl(currentPage + 1, selectedBrand, resolvedSearchParams)}>
                  Next
                </Link>
              ) : (
                <span className="rounded-full bg-slate-100 px-4 py-2 font-black text-slate-400">Next</span>
              )}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="mt-8 border-violet-200 bg-violet-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-800">Community validation</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Review prompts after a price report</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Product pages now ask shoppers to rate price accuracy, product quality, and store experience after they submit or verify a report.
              These prompts improve trust in crowdsourced grocery data without publishing anonymous moderation decisions.
            </p>
          </div>
          <Link className="rounded-full bg-violet-800 px-5 py-3 text-sm font-black text-white" href="/price-reports">
            Open price reports
          </Link>
        </div>
        <PriceReportReviewActions />
      </Card>

      <Card className="mt-8 border-rose-200 bg-rose-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-800">Save to watchlist</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">♡ Account-bound product hearts</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Signed-in shoppers only can save a verified product heart to their account-bound watchlist.
              Each card keeps the sourceProductSlug, target price, Deal Score, and alert summary wired to buildWatchlistAlerts output rather than anonymous local storage or demo rows.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-rose-900 shadow-sm">{watchlistHeartProducts.length} verified save candidates</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {watchlistHeartProducts.map((product) => (
            <Link className="group rounded-2xl border border-rose-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-700" href={`/products/${product.sourceProductSlug}`} key={product.sourceProductSlug}>
              <div className="flex items-start gap-3">
                {product.imageUrl ? (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-rose-100">
                    <Image alt={`${product.productName} watchlist product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={64} sizes="64px" src={productImageCdnUrl(product.imageUrl, { width: 64 })} width={64} />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">{product.brand}</p>
                    <span aria-label={`Save ${product.productName} to watchlist`} className="rounded-full bg-rose-100 px-2 py-1 text-lg font-black text-rose-800">♡</span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{product.productName}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
                <p>{product.currentPriceLabel} now · {product.unitPriceLabel}</p>
                <p>target price {product.targetPriceLabel} · Deal Score {product.dealScore}</p>
                <p>{product.bestStoreLabel} · {product.priceTypeLabel}</p>
                <p className="rounded-2xl bg-rose-50 p-3 text-rose-900">{product.saveLabel}: {product.authRequirement}</p>
                <p className="rounded-2xl bg-white p-3 text-slate-700 ring-1 ring-rose-100">buildWatchlistAlerts: {product.alertCount} alert signals · {product.alertSummary}</p>
                <p>{product.firstAlertMessage}</p>
                <p>{product.sourceLabel}</p>
                <p className="text-rose-800">sourceProductSlug: {product.sourceProductSlug} · account-bound {product.accountBound ? 'yes' : 'no'}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
      <Card className="mt-8 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-indigo-800">SEO landing pages</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Crawlable cheapest-price and prisjämförelse pages</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Landing pages are generated only from verified matched chain spreads. Each page links back to the product ticker and compare surface, and every claim keeps a no-synthetic-price caveat.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900 shadow-sm">{seoLandingProducts.length} verified landing products</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {seoLandingProducts.slice(0, 6).map((landing) => (
            <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm" key={landing.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">{landing.cheapestChainLabel} lowest · {landing.spreadPctLabel} spread</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{landing.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{landing.cheapestPriceLabel} · {landing.evidenceLabel}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <Link className="rounded-full bg-indigo-700 px-3 py-2 text-white" href={`/billigaste/${landing.slug}`}>Billigaste page</Link>
                <Link className="rounded-full bg-slate-950 px-3 py-2 text-white" href={`/prisjamforelse/${landing.slug}`}>Prisjämförelse</Link>
                <Link className="rounded-full bg-white px-3 py-2 text-slate-700 ring-1 ring-slate-200" href={`/stockholm/billigaste/${landing.slug}`}>Stockholm</Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-8 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">OpenFoodFacts metadata catalog</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Swedish product metadata-only catalog</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              OpenFoodFacts rows widen the browseable product dimension with names, brands, package sizes, category tags, labels, and images.
              No prices are shown here; GroceryView still requires Axfood, OpenPrices, or retailer observations before a price appears.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-950 shadow-sm">
            {openFoodFactsCatalogSummary.products.toLocaleString('sv-SE')} metadata-only products · {openFoodFactsCatalogSummary.brands.toLocaleString('sv-SE')} brands
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {openFoodFactsCatalogPreview.map((product) => (
            <a className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={product.productUrl} key={product.code}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">{product.brands || 'Brand not reported'}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{product.quantity || 'Quantity not reported'} · {product.nutriscoreGrade}</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">{product.categories.slice(0, 3).join(' · ') || 'Category tags not reported'}</p>
              <p className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">metadata-only · No prices</p>
            </a>
          ))}
        </div>
      </Card>

      <Card className="mt-8 border-sky-200 bg-sky-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-800">Immigrant / familiar products</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Familiar-brand search</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Find reported brands exactly as they appear in verified product rows, then jump to the product page.
              Search tokens combine reportedBrand, product name, and category so non-native speakers can match familiar packaging without invented translations.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-sky-900 shadow-sm">{immigrantFamiliarBrandSearch.length} verified brand entries</p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {immigrantFamiliarBrandSearch.map((brand) => (
            <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-700" key={`${brand.reportedBrand}-${brand.verifiedProductSlug}`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{brand.reportedBrand}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{brand.productName}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{brand.categoryLabel}</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">searchTokens: {brand.searchTokens}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                Alias review keeps transliterations and non-Swedish familiar names in the admin queue before they change shopper ranking.
              </p>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs font-black text-slate-700">
                <span>{formatSek(brand.verifiedPrice)}</span>
                <span>{brand.evidenceLabel}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                <Link className="rounded-full bg-sky-700 px-3 py-2 text-white" href={`/products/${brand.verifiedProductSlug}`}>Availability</Link>
                <Link className="rounded-full bg-white px-3 py-2 text-sky-950 ring-1 ring-sky-200" href={`/compare?q=${encodeURIComponent(brand.productName)}`}>Compare prices</Link>
                <Link className="rounded-full bg-amber-50 px-3 py-2 text-amber-950 ring-1 ring-amber-200" href={`/admin/search-aliases?candidate=${encodeURIComponent(brand.reportedBrand)}`}>Review alias</Link>
              </div>
            </article>
          ))}
        </div>
      </Card>
      <Card className="mt-6 border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-800">Visual grocery discovery</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Image-first browsing</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              New shoppers can scan verified package photos first, then open the exact product page.
              Every imageUrl comes from Axfood or OpenPrices product rows; missing images are excluded instead of replaced with fake packaging.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-900 shadow-sm">{immigrantImageFirstBrowsing.length} verified images</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {immigrantImageFirstBrowsing.map((item) => (
            <Link className="group overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-700" href={`/products/${item.verifiedProductSlug}`} key={item.verifiedProductSlug}>
              <div className="flex aspect-square items-center justify-center bg-white p-3">
                <Image alt={item.visualAlt} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={160} sizes="(min-width: 768px) 20vw, 50vw" src={productImageCdnUrl(item.imageUrl, { width: 160 })} width={160} />
              </div>
              <div className="border-t border-amber-100 p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{item.reportedBrand}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-black text-slate-950">{item.productName}</h3>
                <p className="mt-1 text-[0.7rem] font-semibold text-slate-500">{item.categoryLabel}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-[0.7rem] font-black text-slate-700">
                  <span>{formatSek(item.verifiedPrice)}</span>
                  <span>{item.evidenceLabel}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
      <div className="mt-6">
        <Card className="mb-4 border-emerald-200 bg-emerald-50/70">
          <form action="/products" className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end" method="get">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800" htmlFor="products-brand-filter">Brand filter</label>
              <select
                className="mt-2 min-h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                defaultValue={selectedBrand}
                id="products-brand-filter"
                name="brand"
              >
                <option value="">All brands</option>
                {productBrandFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.productCount})
                  </option>
                ))}
              </select>
            </div>
            <button className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white" type="submit">Apply brand</button>
          </form>
          <p className="mt-3 text-sm font-bold text-emerald-950">
            {selectedBrand
              ? `Showing ${productCards.length.toLocaleString('sv-SE')} verified product card${productCards.length === 1 ? '' : 's'} for ${selectedBrand}.`
              : 'Brand options are reused from the shared verified product option set so homepage and catalogue filters stay consistent.'}
          </p>
        </Card>
        <ProductPriceCards
          cards={productCards}
          eyebrow="Product-card display"
          title={selectedBrand ? `${selectedBrand} adaptive total ⇄ per-unit price cards` : 'Adaptive total ⇄ per-unit price cards'}
          intro="Branded products lead with the actual pack price, commodity-like produce leads with comparable unit price, and the toggle flips the sort key across every card."
        />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="text-2xl font-black">Chain matches rendered</h2><p className="mt-2 text-slate-600">{topChainSpreads.length} high-spread matched rows are highlighted from the generated Axfood module.</p></Card>
        <Card><h2 className="text-2xl font-black">Fresh OpenPrices rows</h2><p className="mt-2 text-slate-600">{freshestOpenPrices.length} recent community SEK observations are included with their observation dates.</p></Card>
      </div>
    </PageShell>
  );
}
