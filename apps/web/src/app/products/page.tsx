import Image from 'next/image';
import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ProductPriceCards } from '@/components/product-price-cards';
import { apohemSource } from '@/lib/ingested/apohem';
import { lekiaSeProducts, lekiaSeSource } from '@/lib/ingested/lekia-se';
import { adaptiveProductCards, buildProductSearchView, facetedProductSearch, formatSek, immigrantFamiliarBrandSearch, immigrantImageFirstBrowsing, openFoodFactsCatalogPreview, openFoodFactsCatalogSummary, productBrandFilterOptions, topChainSpreads, freshestOpenPrices, watchlistHeartProducts } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { seoLandingProducts } from '@/lib/seo-landing-pages';

const PRODUCTS_PER_PAGE = 50;

export function generateMetadata() {
  return routeMetadata('/products');
}

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  label?: string | string[];
  dietary?: string | string[];
  chain?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  inStockOnly?: string | string[];
  minConfidence?: string | string[];
  brand?: string | string[];
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
  setAllParams(params, 'dietary', source.dietary);
  setFirstParam(params, 'chain', source.chain);
  setFirstParam(params, 'minPrice', source.minPrice);
  setFirstParam(params, 'maxPrice', source.maxPrice);
  setFirstParam(params, 'inStockOnly', source.inStockOnly);
  setFirstParam(params, 'minConfidence', source.minConfidence);
}

function productsPageUrl(page: number, selectedBrand = '', searchParams: SearchParams = {}) {
  const params = new URLSearchParams();
  copySearchParams(params, searchParams);
  if (selectedBrand) params.set('brand', selectedBrand);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/products?${query}` : '/products';
}

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const search = buildProductSearchView(resolvedSearchParams);
  const { categoryFacets, labelFacets, chainFacets, priceRange, inStockOnly, resultCards } = search;
  const requestedPage = toPageNumber(resolvedSearchParams.page);
  const selectedBrand = normalizeSelectedBrand(resolvedSearchParams.brand);
  const productCards = selectedBrand
    ? adaptiveProductCards.filter((card) => card.brand === selectedBrand)
    : adaptiveProductCards;
  const totalPages = Math.max(1, Math.ceil(resultCards.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pagedResultCards = resultCards.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);
  const rangeStart = resultCards.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + PRODUCTS_PER_PAGE, resultCards.length);
  const defaultSearchCount = facetedProductSearch.resultCards.length;
  const lekiaDiscountProducts = lekiaSeProducts.filter((product) => product.discountPrice !== null).slice(0, 4);
  const lekiaFeaturedProducts = lekiaSeProducts.slice(0, 4);
  const lekiaCategoryLabel = lekiaSeSource.categories.join(' · ');
  const lekiaSourceHostCount = new Set(lekiaSeSource.sourceUrls.map((url) => new URL(url).hostname)).size;

  function searchFacetUrl(overrides: Partial<Record<'category' | 'label' | 'dietary' | 'chain' | 'q' | 'minPrice' | 'maxPrice' | 'inStockOnly' | 'minConfidence', string>>) {
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
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Products are shown only when present in the Axfood chain snapshot or OpenPrices SEK observations. No synthetic prices or filler products are rendered.</p>
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
      <Card className="mt-8 border-cyan-200 bg-cyan-50/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-800">Specialty catalog</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Lekia SE public product rows</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {lekiaSeSource.rowCount.toLocaleString('sv-SE')} real toy and game rows from Lekia SSR pages are now visible on the product catalog surface, including
              {' '}{lekiaSeSource.discountRowCount.toLocaleString('sv-SE')} rows with explicit discount prices. Provenance stays attached through {lekiaSeSource.sourceUrls.length.toLocaleString('sv-SE')} source URLs from {lekiaSourceHostCount.toLocaleString('sv-SE')} public host.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-cyan-950 shadow-sm">
            {lekiaCategoryLabel || 'category metadata pending'}
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Source metadata</p>
            <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-700">
              <div className="flex justify-between gap-3"><dt>Rows</dt><dd>{lekiaSeSource.rowCount.toLocaleString('sv-SE')}</dd></div>
              <div className="flex justify-between gap-3"><dt>Discount rows</dt><dd>{lekiaSeSource.discountRowCount.toLocaleString('sv-SE')}</dd></div>
              <div className="flex justify-between gap-3"><dt>Retrieved</dt><dd>{new Date(lekiaSeSource.retrievedAt).toLocaleDateString('sv-SE')}</dd></div>
            </dl>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
              Source: {lekiaSeSource.source}. No fabricated products are added; preview rows below are sliced directly from the ingested Lekia export.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {lekiaDiscountProducts.map((product) => (
              <a className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-700" href={product.productUrl} key={`lekia-discount-${product.code}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">Discount · {product.category}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950">{product.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'} · {product.categories.join(' / ')}</p>
                <p className="mt-3 text-sm font-black text-cyan-950">{formatSek(product.discountPrice ?? product.price)} now · shelf {formatSek(product.price)}</p>
                <p className="mt-1 text-xs font-bold text-slate-600">Stores: {product.availableInStoresCount ?? 0} · stockStatus: {product.stockStatus || 'not reported'}</p>
              </a>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {lekiaFeaturedProducts.map((product) => (
            <a className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-700" href={product.productUrl} key={`lekia-feature-${product.code}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">{product.category}</p>
              <h3 className="mt-2 line-clamp-2 text-base font-black text-slate-950">{product.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{product.brand || 'Brand not reported'}</p>
              <p className="mt-3 text-sm font-black text-cyan-950">{formatSek(product.price)} · {product.priceCurrency}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">sourceUrl: {product.sourceUrl}</p>
            </a>
          ))}
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
        <form action="/products" className="mt-5 grid gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_0.6fr_0.6fr_0.6fr_auto]" method="get">
          {selectedBrand ? <input name="brand" type="hidden" value={selectedBrand} /> : null}
          {search.filters.categories.length > 0 ? <input name="category" type="hidden" value={search.filters.categories.join(',')} /> : null}
          {search.labelFilters.length > 0 ? <input name="label" type="hidden" value={search.labelFilters.join(',')} /> : null}
          {search.filters.chains.length > 0 ? <input name="chain" type="hidden" value={search.filters.chains.join(',')} /> : null}
          <label className="text-sm font-black text-slate-950" htmlFor="product-search-q">
            Search
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950" defaultValue={search.query} id="product-search-q" name="q" />
          </label>
          <label className="text-sm font-black text-slate-950" htmlFor="product-search-min-price">
            Min unit SEK
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950" defaultValue={search.filters.minPrice ?? ''} id="product-search-min-price" min="0" name="minPrice" step="0.01" type="number" />
          </label>
          <label className="text-sm font-black text-slate-950" htmlFor="product-search-max-price">
            Max unit SEK
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950" defaultValue={search.filters.maxPrice ?? ''} id="product-search-max-price" min="0" name="maxPrice" step="0.01" type="number" />
          </label>
          <label className="text-sm font-black text-slate-950" htmlFor="product-search-confidence">
            Min confidence
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950" defaultValue={search.filters.minConfidence ?? ''} id="product-search-confidence" max="1" min="0" name="minConfidence" step="0.01" type="number" />
          </label>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 lg:col-span-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Dietary filters</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {search.dietaryFilters.map((filter) => (
                <label className="flex items-start gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-black text-emerald-950 shadow-sm" key={filter.value}>
                  <input className="mt-1" defaultChecked={filter.checked} name="dietary" type="checkbox" value={filter.value} />
                  <span>
                    {filter.label}
                    <span className="block text-xs font-semibold text-emerald-700">{filter.count.toLocaleString('sv-SE')} evidence rows · {filter.evidenceSummary}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-emerald-900">
              Gluten-free, lactose-free, and vegan filters require verified label metadata or explicit product text; GroceryView does not infer dietary status from shopper profiles.
            </p>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-2 text-sm font-black text-violet-950">
              <input defaultChecked={search.filters.inStockOnly} name="inStockOnly" type="checkbox" value="true" />
              In-stock only
            </label>
            <button className="rounded-full bg-violet-800 px-4 py-3 text-sm font-black text-white" type="submit">Apply filters</button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {search.activeFilters.length > 0 ? search.activeFilters.map((filter) => (
            <span className="rounded-full bg-violet-900 px-3 py-1 text-xs font-black text-white" key={filter}>{filter}</span>
          )) : (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-900 shadow-sm">No active URL filters</span>
          )}
        </div>
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
                <Link className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-900" href={searchFacetUrl({ chain: facet.value })} key={facet.value}>{facet.label} · {facet.count}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Price range + stock</p>
            <p className="mt-3 text-2xl font-black text-slate-950">{formatSek(priceRange.min)} – {formatSek(priceRange.max)}</p>
            <p className="mt-2 text-xs font-bold text-slate-600">Comparable unit filters cover kr/kg, kr/l, and per-unit rows. {inStockOnly.label} keeps unpriced catalog rows out of instant results.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pagedResultCards.map((product) => (
            <Link className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
              <div className="flex gap-3">
                {product.imageUrl ? (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
                    <Image alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="80px" src={product.imageUrl} width={80} />
                  </div>
                ) : null}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
                    {product.isAvailable === false ? (
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">Out of stock</span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
                <p>{product.cheapestPriceLabel} · {product.unitPriceLabel}</p>
                <p>{product.chainLabel}</p>
                <p className="text-violet-800">sourceTables: {product.sourceTables.join(' · ')}</p>
              </div>
            </Link>
          ))}
        </div>
        {resultCards.length > PRODUCTS_PER_PAGE ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="font-black text-slate-700">
              Showing {rangeStart}-{rangeEnd} of {resultCards.length} instant products (page {currentPage}/{totalPages})
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
                    <Image alt={`${product.productName} watchlist product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={64} sizes="64px" src={product.imageUrl} width={64} />
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
              No synthetic prices are shown here; GroceryView still requires Axfood, OpenPrices, or retailer observations before a price appears.
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
              <p className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">metadata-only · No synthetic prices</p>
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
            <Link className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-700" href={`/products/${brand.verifiedProductSlug}`} key={`${brand.reportedBrand}-${brand.verifiedProductSlug}`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">{brand.reportedBrand}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{brand.productName}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{brand.categoryLabel}</p>
              <p className="mt-3 text-xs leading-5 text-slate-600">searchTokens: {brand.searchTokens}</p>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs font-black text-slate-700">
                <span>{formatSek(brand.verifiedPrice)}</span>
                <span>{brand.evidenceLabel}</span>
              </div>
            </Link>
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
                <Image alt={item.visualAlt} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={160} sizes="(min-width: 768px) 20vw, 50vw" src={item.imageUrl} width={160} />
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
