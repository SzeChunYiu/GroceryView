import { buildChainIndexTrendSeries } from '@/lib/chain-index-data';
import { getPriceFreshness } from '@/lib/freshness';
import { categoryLabels, pricedProducts, type PricedProduct } from '@/lib/openprices-products';
import {
  buildProductSearchView,
  categoryDealLeaders,
  categorySummaries,
  chainCategoryCoverage,
  labelFromSlug,
  matchedChainProducts,
  priceDropMoversBoard,
  snapshot,
  topChainSpreads
} from '@/lib/verified-data';
import { watchlistAlertBoard } from '@/lib/watchlist-data';
import { osmStores } from '@/lib/osm-stores';
import { classifyDeal } from './deal-score';
import { buildVerifiedEvidence, confidenceLabelFromScore } from './evidence';
import type {
  BrowseCategoryCard,
  CategoryIndexRow,
  CategoryMarketData,
  ChainIndexSeries,
  DealEvaluation,
  DealLabel,
  MarketMover,
  MarketOverview,
  ProductSummary,
  WatchlistPageData
} from './types';

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function historicMedian(product: PricedProduct) {
  const prices = product.observations.map((row) => row.price).filter((price) => Number.isFinite(price));
  if (prices.length === 0) return undefined;
  const sorted = [...prices].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function computeWeeklyChangePct(product: PricedProduct) {
  const sorted = [...product.observations].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  if (sorted.length < 2) return undefined;
  const latest = sorted[0]!.price;
  const weekAgo = sorted.find((row) => Date.parse(row.date) <= Date.parse(sorted[0]!.date) - 7 * 24 * 60 * 60 * 1000);
  if (!weekAgo || weekAgo.price <= 0) return undefined;
  return ((latest - weekAgo.price) / weekAgo.price) * 100;
}

function sparklineFromProduct(product: PricedProduct): { date: string; value: number }[] {
  return [...product.observations]
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(-8)
    .map((row) => ({ date: row.date, value: row.price }));
}

export function productSummaryFromOpenPrices(product: PricedProduct): ProductSummary {
  const median = historicMedian(product);
  const evidence = buildVerifiedEvidence({
    sourceLabel: 'OpenPrices SEK observations',
    lastObservedAt: product.lastObservedAt,
    observationCount: product.observationCount,
    confidence: Math.min(1, product.observationCount / 30)
  });
  const historicDiscountPct = median && median > product.priceMedian ? ((median - product.priceMedian) / median) * 100 : undefined;
  const dealLabel = classifyDeal({
    historicDiscountPct,
    nearbyDiscountPct: 0,
    confidence: evidence.confidence,
    freshnessLabel: evidence.freshnessLabel
  });
  return {
    id: product.code,
    slug: product.slug,
    name: product.name,
    brand: product.brands || undefined,
    categorySlug: product.category,
    categoryName: categoryLabels[product.category] ?? labelFromSlug(product.category),
    imageUrl: product.image || undefined,
    currentBestPrice: product.priceMedian,
    currentBestPriceCurrency: 'SEK',
    historicMedianPrice: median,
    priceChangeWeeklyPct: computeWeeklyChangePct(product),
    dealLabel,
    isAvailable: product.observationCount > 0,
    ...evidence
  };
}

function dealFromSpread(product: (typeof topChainSpreads)[number]): DealEvaluation | null {
  if (!Number.isFinite(product.lowestPrice)) return null;
  const summary = productSummaryFromOpenPrices({
    code: product.slug,
    slug: product.slug,
    name: product.name,
    brands: '',
    image: product.image ?? '',
    quantity: '',
    nutriscore: '',
    category: product.category,
    categories: [],
    priceMin: product.lowestPrice,
    priceMedian: product.lowestPrice,
    priceMax: product.highestPrice,
    observationCount: product.inChains.length * 4,
    lastObservedAt: pricedProducts[0]?.lastObservedAt ?? '2026-05-20',
    observations: [{ price: product.lowestPrice, date: pricedProducts[0]?.lastObservedAt ?? '2026-05-20' }]
  });
  const historicDiscountPct = product.highestPrice > product.lowestPrice
    ? ((product.highestPrice - product.lowestPrice) / product.highestPrice) * 100
    : undefined;
  const dealLabel = classifyDeal({
    historicDiscountPct,
    nearbyDiscountPct: product.spreadPct,
    confidence: summary.confidence,
    freshnessLabel: summary.freshnessLabel
  });
  return {
    id: `spread-${product.slug}`,
    product: { ...summary, currentBestChain: product.lowestChain, dealLabel },
    chain: product.lowestChain,
    currentPrice: product.lowestPrice,
    currency: 'SEK',
    historicMedianPrice: product.highestPrice,
    historicDiscountPct,
    nearbyDiscountPct: product.spreadPct,
    dealScore: Math.round(Math.min(100, (historicDiscountPct ?? 0) + product.spreadPct)),
    dealLabel,
    reasons: [
      `${product.lowestChain} lowest across ${product.inChains.length} matched chains`,
      `${product.spreadPct.toFixed(1)}% cross-chain spread from verified catalogue rows`
    ],
    ...buildVerifiedEvidence({
      sourceLabel: 'Matched Axfood catalogue spreads',
      lastObservedAt: pricedProducts[0]?.lastObservedAt ?? snapshot.retrievedLabel,
      observationCount: product.inChains.length,
      confidence: summary.confidence
    })
  };
}

function dealFromPriceDrop(mover: (typeof priceDropMoversBoard)[number]): DealEvaluation | null {
  if (!Number.isFinite(mover.latestPrice)) return null;
  const evidence = buildVerifiedEvidence({
      sourceLabel: mover.legalCopy,
      lastObservedAt: mover.latestObservedAt,
      observationCount: mover.observedCount,
      confidence: Math.min(1, mover.observedCount / 12)
    });
  const historicDiscountPct = mover.previousPrice > mover.latestPrice
    ? ((mover.previousPrice - mover.latestPrice) / mover.previousPrice) * 100
    : undefined;
  const dealLabel = classifyDeal({
    historicDiscountPct,
    nearbyDiscountPct: 0,
    confidence: evidence.confidence,
    freshnessLabel: evidence.freshnessLabel
  });
  const product: ProductSummary = {
    id: mover.productSlug,
    slug: mover.productSlug,
    name: mover.productName,
    categorySlug: mover.categoryLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categoryName: mover.categoryLabel,
    imageUrl: mover.imageUrl ?? undefined,
    currentBestPrice: mover.latestPrice,
    currentBestPriceCurrency: 'SEK',
    historicMedianPrice: mover.previousPrice,
    dealLabel,
    ...evidence
  };
  return {
    id: `drop-${mover.productSlug}`,
    product,
    currentPrice: mover.latestPrice,
    currency: 'SEK',
    historicMedianPrice: mover.previousPrice,
    historicDiscountPct,
    dealScore: Math.round(Math.abs(mover.changePercent)),
    dealLabel,
    reasons: [mover.legalCopy, `${mover.observedCount} observed price points in window`],
    ...evidence
  };
}

export function buildDealEvaluations(): DealEvaluation[] {
  const spreadDeals = topChainSpreads.map(dealFromSpread).filter((deal): deal is DealEvaluation => deal !== null);
  const dropDeals = priceDropMoversBoard.map(dealFromPriceDrop).filter((deal): deal is DealEvaluation => deal !== null);
  const seen = new Set<string>();
  return [...spreadDeals, ...dropDeals].filter((deal) => {
    if (seen.has(deal.product.slug)) return false;
    seen.add(deal.product.slug);
    return true;
  });
}

function filterDealsByTab(deals: DealEvaluation[], tab: DealLabel | 'all') {
  if (tab === 'all') return deals;
  return deals.filter((deal) => deal.dealLabel === tab);
}

export function getHomePageData() {
  const deals = buildDealEvaluations();
  const featuredProducts = pricedProducts
    .filter((product) => product.observationCount >= 8)
    .sort((a, b) => b.observationCount - a.observationCount)
    .slice(0, 4)
    .map(productSummaryFromOpenPrices);
  const marketSnapshot = getMarketOverviewData({});
  const mapPreviewStores = osmStores.slice(0, 6).map((store) => ({
    slug: store.slug,
    name: store.name,
    chain: store.brand,
    confidenceLabel: confidenceLabelFromScore(store.address ? 0.7 : 0.4, 1)
  }));
  return {
    dealsPreview: deals.filter((deal) => deal.dealLabel === 'real_deal' || deal.dealLabel === 'fair_discount').slice(0, 4),
    featuredProducts,
    marketSnapshot,
    mapPreviewStores,
    snapshotGeneratedAt: snapshot.retrievedLabel,
    productCount: pricedProducts.length,
    categoryCount: categorySummaries.length
  };
}

function normalizeDealTab(raw?: string): DealLabel | 'all' {
  if (!raw || raw === 'all') return 'all';
  const normalized = raw.replace(/-/g, '_');
  if (normalized === 'real_deal' || normalized === 'fair_discount' || normalized === 'not_really_a_deal') {
    return normalized;
  }
  return 'all';
}

export function getDealsPageData(searchParams: SearchParams = {}) {
  const tab = normalizeDealTab(firstParam(searchParams.dealLevel) ?? firstParam(searchParams.tab));
  const chain = firstParam(searchParams.chain)?.toLowerCase();
  const category = firstParam(searchParams.category)?.toLowerCase();
  let deals = buildDealEvaluations();
  if (chain) deals = deals.filter((deal) => deal.chain?.toLowerCase() === chain || deal.product.currentBestChain?.toLowerCase() === chain);
  if (category) deals = deals.filter((deal) => deal.product.categorySlug === category);
  const tabs: Array<{ id: DealLabel | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'All deals', count: deals.length },
    { id: 'real_deal', label: 'Real Deal', count: deals.filter((deal) => deal.dealLabel === 'real_deal').length },
    { id: 'fair_discount', label: 'Fair Discount', count: deals.filter((deal) => deal.dealLabel === 'fair_discount').length },
    { id: 'not_really_a_deal', label: 'Not Really a Deal', count: deals.filter((deal) => deal.dealLabel === 'not_really_a_deal').length }
  ];
  return {
    deals: filterDealsByTab(deals, tab),
    tabs,
    activeTab: tab,
    filters: { chain, category }
  };
}

function categoryIndexRows(): CategoryIndexRow[] {
  return categorySummaries.map((category) => {
    const sampleProduct = pricedProducts.find((product) => product.category === category.slug);
    const evidence = buildVerifiedEvidence({
      sourceLabel: 'OpenPrices + matched chain rows',
      lastObservedAt: category.latestObservation || sampleProduct?.lastObservedAt,
      observationCount: category.openPriceRows + category.chainRows,
      confidence: category.openPriceRows > 0 ? Math.min(1, category.openPriceRows / 40) : 0
    });
    const weeklyChangePct = sampleProduct ? computeWeeklyChangePct(sampleProduct) : undefined;
    return {
      categorySlug: category.slug,
      categoryName: category.label,
      weeklyChangePct,
      sparkline: sampleProduct ? sparklineFromProduct(sampleProduct) : [],
      cheapestChain: matchedChainProducts.find((product) => product.category === category.slug)?.lowestChain,
      mostExpensiveChain: chainCategoryCoverage.find((row) => row.slug === category.slug)?.leadingLowestChain,
      ...evidence
    };
  });
}

export function getMarketOverviewData(searchParams: SearchParams = {}): MarketOverview {
  const selectedRegion = firstParam(searchParams.region) ?? 'stockholm';
  const selectedIndexType = firstParam(searchParams.index) ?? 'chain-price';
  const trend = buildChainIndexTrendSeries();
  const chainIndexSeries: ChainIndexSeries[] = trend.series.map((series) => ({
    chain: series.chainId,
    region: selectedRegion,
    indexType: selectedIndexType,
    points: series.points.map((point) => ({ date: point.date, value: point.value })),
    weeklyChangePct: series.points.length >= 2
      ? ((series.points.at(-1)!.value - series.points.at(-2)!.value) / series.points.at(-2)!.value) * 100
      : undefined,
    sourceLabel: trend.sourceLabel,
    confidence: 0.72,
    observationCount: series.points.length
  }));
  const rows = categoryIndexRows();
  const biggestMovers: MarketMover[] = priceDropMoversBoard.slice(0, 6).map((mover) => ({
    productSlug: mover.productSlug,
    productName: mover.productName,
    categoryLabel: mover.categoryLabel,
    changePercent: mover.changePercent,
    latestPrice: mover.latestPrice,
    sourceLabel: mover.legalCopy,
    confidenceLabel: confidenceLabelFromScore(Math.min(1, mover.observedCount / 10), mover.observedCount)
  }));
  const freshness = getPriceFreshness(pricedProducts[0]?.lastObservedAt ?? null);
  return {
    selectedRegion,
    selectedIndexType,
    lastUpdatedAt: pricedProducts[0]?.lastObservedAt ?? snapshot.retrievedLabel,
    confidenceLabel: rows.some((row) => row.confidenceLabel === 'high') ? 'high' : rows.length > 0 ? 'medium' : 'unknown',
    chainIndexSeries,
    categoryIndexRows: rows,
    biggestMovers
  };
}

export function getCategoryMarketData(categorySlug: string, searchParams: SearchParams = {}): CategoryMarketData | null {
  const normalized = categorySlug.toLowerCase();
  const summary = categorySummaries.find((row) => row.slug === normalized);
  if (!summary) return null;
  const overview = getMarketOverviewData(searchParams);
  overview.categoryIndexRows = overview.categoryIndexRows.filter((row) => row.categorySlug === normalized);
  const categoryProducts = pricedProducts
    .filter((product) => product.category === normalized)
    .sort((a, b) => b.observationCount - a.observationCount);
  const bestDeals = buildDealEvaluations()
    .filter((deal) => deal.product.categorySlug === normalized)
    .slice(0, 6);
  const subcategoryCounts = new Map<string, number>();
  for (const product of categoryProducts) {
    for (const tag of product.categories.slice(0, 1)) {
      const slug = tag.replace(/^en:/, '').replace(/[^a-z0-9]+/g, '-');
      subcategoryCounts.set(slug, (subcategoryCounts.get(slug) ?? 0) + 1);
    }
  }
  return {
    categorySlug: normalized,
    categoryName: summary.label,
    overview,
    bestDeals,
    chainCards: chainCategoryCoverage
      .filter((row) => row.slug === normalized)
      .map((row) => ({
        chain: row.leadingLowestChain,
        productCount: row.matchedProducts,
        medianSpreadPct: row.topSpread
      })),
    subcategories: [...subcategoryCounts.entries()]
      .slice(0, 8)
      .map(([slug, productCount]) => ({ slug, label: labelFromSlug(slug), productCount })),
    productPreview: categoryProducts.slice(0, 8).map(productSummaryFromOpenPrices)
  };
}

export function getBrowsePageData() {
  const categories: BrowseCategoryCard[] = categorySummaries.map((row) => ({
    slug: row.slug,
    label: row.label,
    productCount: row.openPriceRows + row.chainRows,
    hasVerifiedPrices: row.openPriceRows > 0
  }));
  const featured = categories.filter((row) => row.hasVerifiedPrices).slice(0, 6);
  const chains = ['ica', 'coop', 'willys', 'hemkop', 'lidl', 'city_gross'].map((chain) => ({
    slug: chain,
    label: labelFromSlug(chain),
    href: `/search?chain=${encodeURIComponent(chain)}`
  }));
  const popularSearches = categoryDealLeaders.slice(0, 6).map((leader) => ({
    label: leader.productName,
    href: `/search?q=${encodeURIComponent(leader.productName)}`
  }));
  return { categories, featured, chains, popularSearches };
}

export function getBrowseCategoryData(categorySlug: string) {
  const market = getCategoryMarketData(categorySlug);
  if (!market) return null;
  const products = pricedProducts
    .filter((product) => product.category === categorySlug)
    .sort((a, b) => b.observationCount - a.observationCount)
    .map(productSummaryFromOpenPrices);
  return { ...market, products };
}

export function getSearchResultsData(searchParams: SearchParams = {}) {
  const view = buildProductSearchView(searchParams);
  const products = view.products
    .map((product) => {
      const openRow = pricedProducts.find((row) => row.slug === product.slug);
      if (openRow) return productSummaryFromOpenPrices(openRow);
      const cheapest = product.currentPrices[0];
      if (!cheapest) return null;
      return {
        ...buildVerifiedEvidence({
          sourceLabel: view.evidence.sourceTables.join(' + ') || 'Verified catalogue search',
          lastObservedAt: cheapest.observedAt,
          observationCount: product.currentPrices.length,
          confidence: cheapest.confidence
        }),
        id: product.slug,
        slug: product.slug,
        name: product.canonicalName,
        brand: product.brand,
        categorySlug: product.categoryPath[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? 'pantry',
        categoryName: product.categoryPath[0] ?? 'Category',
        imageUrl: product.imageUrl,
        currentBestPrice: cheapest.price,
        currentBestPriceCurrency: 'SEK' as const,
        isAvailable: product.isAvailable
      };
    })
    .filter((product): product is ProductSummary => product !== null);
  return {
    query: firstParam(searchParams.q) ?? '',
    activeFilters: view.activeFilters,
    products,
    relatedCategories: categorySummaries.slice(0, 4).map((row) => ({ slug: row.slug, label: row.label }))
  };
}

export function getMapPageData(searchParams: SearchParams = {}) {
  const layer = firstParam(searchParams.layer) ?? 'stores';
  const region = firstParam(searchParams.region) ?? 'stockholm';
  const stores = osmStores.slice(0, 120).map((store) => ({
    slug: store.slug,
    name: store.name,
    chain: store.brand,
    lat: store.lat,
    lon: store.lng,
    district: store.district,
    lastObservedAt: store.retrievedDate
  }));
  return {
    layer,
    region,
    stores,
    heatmapAvailable: false,
    sourceLabel: 'OpenStreetMap store points + verified price overlays where present'
  };
}

export function getStoresPageData() {
  return {
    chains: chainCategoryCoverage.slice(0, 8).map((row) => ({
      slug: row.slug,
      label: row.label,
      leadingChain: row.leadingLowestChain,
      matchedProducts: row.matchedProducts
    })),
    stores: osmStores.slice(0, 40).map((store) => ({
      slug: store.slug,
      name: store.name,
      chain: store.brand,
      city: store.city,
      district: store.district,
      retrievedDate: store.retrievedDate
    }))
  };
}

export function getWatchlistData(): WatchlistPageData {
  const signedIn = false;
  const productItems = watchlistAlertBoard.inputs.products.slice(0, 8).map((product) => {
    const priced = pricedProducts.find((row) => row.slug === product.productId);
    if (priced) return productSummaryFromOpenPrices(priced);
    return {
      ...buildVerifiedEvidence({
        sourceLabel: product.source,
        lastObservedAt: snapshot.retrievedLabel,
        observationCount: product.prices?.length ?? 0,
        confidence: Math.min(1, (product.prices?.length ?? 0) / 4)
      }),
      id: product.productId,
      slug: product.productId,
      name: product.productName,
      categorySlug: 'pantry',
      categoryName: 'Pantry',
      currentBestPrice: product.bestPrice ?? undefined,
      currentBestPriceCurrency: 'SEK' as const
    };
  });
  return {
    signedIn,
    productItems,
    storeItems: osmStores.slice(0, 4).map((store) => ({ slug: store.slug, name: store.name, chain: store.brand })),
    categoryItems: categorySummaries.slice(0, 4).map((row) => ({ slug: row.slug, label: row.label }))
  };
}
