export type CatalogProductCoverage = {
  id: string;
  categoryId: string;
  observedChainIds: string[];
  observedStoreIds: string[];
};

export { COMMODITIES, STAPLE_BASKET, findCommodity, type Commodity, type ComparableUnit } from './commodities.js';

export type CatalogCoverageInput = {
  targetProducts?: string[];
  targetCategories: string[];
  targetChains: string[];
  targetStores: string[];
  requireEveryProductInEveryStore?: boolean;
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
  };
  missingProductStorePairs: Array<{ productId: string; storeId: string }>;
  requiredActions: string[];
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

export function buildCatalogCoverageReport(input: CatalogCoverageInput): CatalogCoverageReport {
  const observedProductIds = new Set(input.products.map((product) => product.id));
  const observedCategories = new Set(input.products.map((product) => product.categoryId));
  const observedChains = new Set(input.products.flatMap((product) => product.observedChainIds));
  const observedStores = new Set(input.products.flatMap((product) => product.observedStoreIds));

  const products = input.targetProducts ? summarizeCoverage(input.targetProducts, observedProductIds) : undefined;
  const categories = summarizeCoverage(input.targetCategories, observedCategories);
  const chains = summarizeCoverage(input.targetChains, observedChains);
  const stores = summarizeCoverage(input.targetStores, observedStores);

  const targetProducts = [...new Set(input.targetProducts ?? [])].sort();
  const targetStores = [...new Set(input.targetStores)].sort();
  const productsById = new Map(input.products.map((product) => [product.id, product]));
  const missingProductStorePairs = input.requireEveryProductInEveryStore
    ? targetProducts.flatMap((productId) => {
        const observedStoreIds = new Set(productsById.get(productId)?.observedStoreIds ?? []);
        return targetStores
          .filter((storeId) => !observedStoreIds.has(storeId))
          .map((storeId) => ({ productId, storeId }));
      })
    : [];

  const requiredActions = [
    products ? actionFor('products', products.missing) : null,
    actionFor('categories', categories.missing),
    actionFor('chains', chains.missing),
    actionFor('stores', stores.missing),
    missingProductStorePairs.length > 0 ? `backfill_product_store_pairs:${missingProductStorePairs.length}` : null
  ].filter(
    (action): action is string => action !== null
  );

  return {
    status: requiredActions.length === 0 ? 'complete' : 'incomplete',
    productCount: input.products.length,
    coverage: { ...(products ? { products } : {}), categories, chains, stores },
    missingProductStorePairs,
    requiredActions
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
