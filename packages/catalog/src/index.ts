export type CatalogProductCoverage = {
  id: string;
  categoryId: string;
  observedChainIds: string[];
  observedStoreIds: string[];
};

export type CatalogCoverageInput = {
  targetCategories: string[];
  targetChains: string[];
  targetStores: string[];
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
    categories: CoverageDimension;
    chains: CoverageDimension;
    stores: CoverageDimension;
  };
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
export type CatalogFreshnessProduct = {
  id: string;
  categoryId: string;
  lastObservedAt?: string;
};

export type CatalogFreshnessInput = {
  now: string;
  maxAgeDays: number;
  products: CatalogFreshnessProduct[];
};

export type CatalogFreshnessProductStatus = CatalogFreshnessProduct & {
  ageDays: number | null;
  status: 'fresh' | 'stale' | 'never_observed';
};

export type CatalogFreshnessReport = {
  status: 'fresh' | 'stale';
  productCount: number;
  freshCount: number;
  staleCount: number;
  neverObservedCount: number;
  products: CatalogFreshnessProductStatus[];
  requiredActions: string[];
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
  const observedCategories = new Set(input.products.map((product) => product.categoryId));
  const observedChains = new Set(input.products.flatMap((product) => product.observedChainIds));
  const observedStores = new Set(input.products.flatMap((product) => product.observedStoreIds));

  const categories = summarizeCoverage(input.targetCategories, observedCategories);
  const chains = summarizeCoverage(input.targetChains, observedChains);
  const stores = summarizeCoverage(input.targetStores, observedStores);
  const requiredActions = [actionFor('categories', categories.missing), actionFor('chains', chains.missing), actionFor('stores', stores.missing)].filter(
    (action): action is string => action !== null
  );

  return {
    status: requiredActions.length === 0 ? 'complete' : 'incomplete',
    productCount: input.products.length,
    coverage: { categories, chains, stores },
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
function parseIsoDate(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${label} must be an ISO date.`);
  return parsed;
}

function roundDays(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildCatalogFreshnessReport(input: CatalogFreshnessInput): CatalogFreshnessReport {
  if (input.maxAgeDays < 0) throw new Error('maxAgeDays must be non-negative.');
  const nowMs = parseIsoDate(input.now, 'now');
  const staleProductIds: string[] = [];
  const products = input.products
    .map((product): CatalogFreshnessProductStatus => {
      if (!product.lastObservedAt) {
        staleProductIds.push(product.id);
        return { ...product, ageDays: null, status: 'never_observed' };
      }

      const observedMs = parseIsoDate(product.lastObservedAt, `lastObservedAt for ${product.id}`);
      if (observedMs > nowMs) throw new Error(`lastObservedAt for ${product.id} cannot be in the future.`);
      const ageDays = roundDays((nowMs - observedMs) / (24 * 60 * 60 * 1000));
      if (ageDays > input.maxAgeDays) {
        staleProductIds.push(product.id);
        return { ...product, ageDays, status: 'stale' };
      }

      return { ...product, ageDays, status: 'fresh' };
    })
    .sort((a, b) => a.categoryId.localeCompare(b.categoryId) || a.id.localeCompare(b.id));

  const staleCount = products.filter((product) => product.status === 'stale').length;
  const neverObservedCount = products.filter((product) => product.status === 'never_observed').length;
  const requiredActions = staleProductIds.length === 0 ? [] : [`backfill_stale_catalog:${[...staleProductIds].sort().join(',')}`];

  return {
    status: requiredActions.length === 0 ? 'fresh' : 'stale',
    productCount: products.length,
    freshCount: products.length - staleCount - neverObservedCount,
    staleCount,
    neverObservedCount,
    products,
    requiredActions
  };
}
