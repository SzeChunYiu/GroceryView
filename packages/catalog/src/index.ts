export type CatalogProductCoverage = {
  id: string;
  categoryId: string;
  observedChainIds: string[];
  observedStoreIds: string[];
  observedPriceTypes?: string[];
  observedStorePriceTypes?: string[];
  market?: string;
  observedCommodityIds?: string[];
  observedOfferIds?: string[];
  observedSourceIds?: string[];
  freshestObservedAt?: string;
};

export { COMMODITIES, STAPLE_BASKET, findCommodity, inferBonusIsGroceryCategory, type Commodity, type ComparableUnit, type GroceryCategoryInference } from './commodities.js';
export { SUPPORTED_PRICE_DOMAINS, findPriceDomain, type PriceDomain, type PriceDomainItem, type PriceDomainSlug } from './domains.js';

export type MarketCatalogCoverageTarget = {
  market: 'SE' | 'NO' | 'IS' | string;
  targetProducts?: string[];
  targetCategories: string[];
  targetChains: string[];
  targetStores: string[];
  targetPriceTypes?: string[];
  targetCommodities?: string[];
  targetOffers?: string[];
  minSourceDiversity?: number;
  maxFreshnessHours?: number;
  requireEveryProductInEveryStore?: boolean;
  requireEveryStorePriceType?: boolean;
};

export type CatalogCoverageInput = Omit<MarketCatalogCoverageTarget, 'market'> & {
  marketTargets?: MarketCatalogCoverageTarget[];
  products: CatalogProductCoverage[];
};

export type CoverageDimension = {
  covered: number;
  target: number;
  percent: number;
  missing: string[];
};

export type CatalogCoverageReport = {
  status: 'complete' | 'incomplete';
  productCount: number;
  coverage: {
    products?: CoverageDimension;
    categories: CoverageDimension;
    chains: CoverageDimension;
    stores: CoverageDimension;
    priceTypes?: CoverageDimension;
    commodities?: CoverageDimension;
    offers?: CoverageDimension;
  };
  missingProductStorePairs: Array<{ productId: string; storeId: string }>;
  missingStorePriceTypes?: Array<{ storeId: string; priceType: string }>;
  requiredActions: string[];
  marketCoverage?: Array<CatalogCoverageReport & { market: string }>;
};

export type MyStoresCoverageInput = {
  favoriteStoreIds: string[];
  requiredCategoryIds: string[];
  products: CatalogProductCoverage[];
};

export type MyStoresCoverageReport = {
  status: 'ready' | 'limited';
  favoriteStoreCount: number;
  coveredProductIds: string[];
  uncoveredStoreIds: string[];
  missingCategoryIds: string[];
  coveragePercent: number;
  mobileActions: Array<'show_my_stores_deals' | 'ask_for_more_favorite_stores' | 'backfill_favorite_store_prices' | 'broaden_to_nearby_stores'>;
};

function roundPercent(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function summarizeCoverage(targets: string[], observed: Set<string>): CoverageDimension {
  const uniqueTargets = [...new Set(targets)].sort();
  const missing = uniqueTargets.filter((target) => !observed.has(target));
  const covered = uniqueTargets.length - missing.length;
  return {
    covered,
    target: uniqueTargets.length,
    percent: uniqueTargets.length === 0 ? 100 : roundPercent((covered / uniqueTargets.length) * 100),
    missing
  };
}

function actionFor(label: string, missing: string[]): string | null {
  return missing.length === 0 ? null : `backfill_${label}:${missing.join(',')}`;
}

function freshnessAction(maxFreshnessHours: number | undefined, products: CatalogProductCoverage[]): string | null {
  if (maxFreshnessHours === undefined) return null;
  const freshest = products
    .map((product) => product.freshestObservedAt ? Date.parse(product.freshestObservedAt) : Number.NaN)
    .filter(Number.isFinite)
    .sort((left, right) => right - left)[0];
  if (!freshest) return `backfill_freshness:${maxFreshnessHours}h`;
  const ageHours = Math.max(0, (Date.now() - freshest) / (60 * 60 * 1000));
  return ageHours <= maxFreshnessHours ? null : `backfill_freshness:${Math.round(ageHours)}h>${maxFreshnessHours}h`;
}

function buildSingleCatalogCoverageReport(input: Omit<CatalogCoverageInput, 'marketTargets'>): CatalogCoverageReport {
  const observedProductIds = new Set(input.products.map((product) => product.id));
  const observedCategories = new Set(input.products.map((product) => product.categoryId));
  const observedChains = new Set(input.products.flatMap((product) => product.observedChainIds));
  const observedStores = new Set(input.products.flatMap((product) => product.observedStoreIds));
  const observedPriceTypes = new Set(input.products.flatMap((product) => product.observedPriceTypes ?? []));
  const observedCommodities = new Set(input.products.flatMap((product) => product.observedCommodityIds ?? []));
  const observedOffers = new Set(input.products.flatMap((product) => product.observedOfferIds ?? []));
  const observedSources = new Set(input.products.flatMap((product) => product.observedSourceIds ?? []));

  const products = input.targetProducts ? summarizeCoverage(input.targetProducts, observedProductIds) : undefined;
  const categories = summarizeCoverage(input.targetCategories, observedCategories);
  const chains = summarizeCoverage(input.targetChains, observedChains);
  const stores = summarizeCoverage(input.targetStores, observedStores);
  const priceTypes = input.targetPriceTypes ? summarizeCoverage(input.targetPriceTypes, observedPriceTypes) : undefined;
  const commodities = input.targetCommodities ? summarizeCoverage(input.targetCommodities, observedCommodities) : undefined;
  const offers = input.targetOffers ? summarizeCoverage(input.targetOffers, observedOffers) : undefined;

  const targetProducts = [...new Set(input.targetProducts ?? [])].sort();
  const targetStores = [...new Set(input.targetStores)].sort();
  const targetPriceTypes = [...new Set(input.targetPriceTypes ?? [])].sort();
  const productsById = new Map(input.products.map((product) => [product.id, product]));
  const missingProductStorePairs = input.requireEveryProductInEveryStore
    ? targetProducts.flatMap((productId) => {
        const observedStoreIds = new Set(productsById.get(productId)?.observedStoreIds ?? []);
        return targetStores
          .filter((storeId) => !observedStoreIds.has(storeId))
          .map((storeId) => ({ productId, storeId }));
      })
    : [];

  const observedStorePriceTypes = new Set(input.products.flatMap((product) => product.observedStorePriceTypes ?? []));
  const missingStorePriceTypes = input.requireEveryStorePriceType
    ? targetStores.flatMap((storeId) => targetPriceTypes
      .filter((priceType) => !observedStorePriceTypes.has(`${storeId}:${priceType}`))
      .map((priceType) => ({ storeId, priceType })))
    : [];

  const requiredActions = [
    products ? actionFor('products', products.missing) : null,
    actionFor('categories', categories.missing),
    actionFor('chains', chains.missing),
    actionFor('stores', stores.missing),
    priceTypes ? actionFor('price_types', priceTypes.missing) : null,
    commodities ? actionFor('commodities', commodities.missing) : null,
    offers ? actionFor('offers', offers.missing) : null,
    input.minSourceDiversity && observedSources.size < input.minSourceDiversity ? `backfill_source_diversity:${observedSources.size}/${input.minSourceDiversity}` : null,
    freshnessAction(input.maxFreshnessHours, input.products),
    missingProductStorePairs.length > 0 ? `backfill_product_store_pairs:${missingProductStorePairs.length}` : null,
    missingStorePriceTypes.length > 0 ? `backfill_store_price_types:${missingStorePriceTypes.length}` : null
  ].filter(
    (action): action is string => action !== null
  );

  return {
    status: requiredActions.length === 0 ? 'complete' : 'incomplete',
    productCount: input.products.length,
    coverage: { ...(products ? { products } : {}), categories, chains, stores, ...(priceTypes ? { priceTypes } : {}), ...(commodities ? { commodities } : {}), ...(offers ? { offers } : {}) },
    missingProductStorePairs,
    ...(input.targetPriceTypes ? { missingStorePriceTypes } : {}),
    requiredActions
  };
}

export function buildCatalogCoverageReport(input: CatalogCoverageInput): CatalogCoverageReport {
  const root = buildSingleCatalogCoverageReport(input);
  if (!input.marketTargets || input.marketTargets.length === 0) return root;
  const marketCoverage = input.marketTargets.map((target) => ({
    market: target.market,
    ...buildSingleCatalogCoverageReport({
      ...target,
      products: input.products.filter((product) => !product.market || product.market === target.market)
    })
  }));
  const marketActions = marketCoverage.flatMap((market) => market.requiredActions.map((action) => `${market.market}:${action}`));
  return {
    ...root,
    status: root.status === 'complete' && marketActions.length === 0 ? 'complete' : 'incomplete',
    marketCoverage,
    requiredActions: [...root.requiredActions, ...marketActions]
  };
}

export function buildMyStoresCoverageReport(input: MyStoresCoverageInput): MyStoresCoverageReport {
  const favoriteStoreIds = [...new Set(input.favoriteStoreIds)].sort();
  const requiredCategoryIds = [...new Set(input.requiredCategoryIds)].sort();
  const favoriteStoreSet = new Set(favoriteStoreIds);

  const coveredProducts = input.products.filter((product) => product.observedStoreIds.some((storeId) => favoriteStoreSet.has(storeId)));
  const coveredProductIds = coveredProducts.map((product) => product.id).sort();
  const observedFavoriteStores = new Set(coveredProducts.flatMap((product) => product.observedStoreIds.filter((storeId) => favoriteStoreSet.has(storeId))));
  const coveredCategories = new Set(coveredProducts.map((product) => product.categoryId));

  const uncoveredStoreIds = favoriteStoreIds.filter((storeId) => !observedFavoriteStores.has(storeId));
  const missingCategoryIds = requiredCategoryIds.filter((categoryId) => !coveredCategories.has(categoryId));
  const categoryCoveragePercent = requiredCategoryIds.length === 0 ? 100 : roundPercent(((requiredCategoryIds.length - missingCategoryIds.length) / requiredCategoryIds.length) * 100);
  const storeCoveragePercent = favoriteStoreIds.length === 0 ? 0 : roundPercent(((favoriteStoreIds.length - uncoveredStoreIds.length) / favoriteStoreIds.length) * 100);
  const coveragePercent = roundPercent((categoryCoveragePercent + storeCoveragePercent) / 2);

  const mobileActions: MyStoresCoverageReport['mobileActions'] = [];
  if (coveredProductIds.length > 0) mobileActions.push('show_my_stores_deals');
  if (favoriteStoreIds.length < 2) mobileActions.push('ask_for_more_favorite_stores');
  if (uncoveredStoreIds.length > 0 || missingCategoryIds.length > 0) mobileActions.push('backfill_favorite_store_prices');
  if (coveragePercent < 80) mobileActions.push('broaden_to_nearby_stores');

  return {
    status: uncoveredStoreIds.length === 0 && missingCategoryIds.length === 0 && favoriteStoreIds.length > 0 ? 'ready' : 'limited',
    favoriteStoreCount: favoriteStoreIds.length,
    coveredProductIds,
    uncoveredStoreIds,
    missingCategoryIds,
    coveragePercent,
    mobileActions
  };
}
