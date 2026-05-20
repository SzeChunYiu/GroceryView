export type CatalogProductCoverage = {
  id: string;
  categoryId: string;
  observedChainIds: string[];
  observedStoreIds: string[];
  observedPriceCount?: number;
  freshPriceCount?: number;
  medianConfidenceScore?: number;
};

export type CatalogCoverageInput = {
  targetCategories: string[];
  targetChains: string[];
  targetStores: string[];
  products: CatalogProductCoverage[];
  minimumObservationsPerProduct?: number;
  minimumFreshPriceShare?: number;
  minimumMedianConfidenceScore?: number;
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
  quality: {
    observedPriceCount: number;
    freshPriceCount: number;
    freshPriceShare: number;
    observationsPerProduct: number;
    medianConfidenceScore: number | null;
  };
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

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? roundPercent((sorted[middle - 1] + sorted[middle]) / 2) : roundPercent(sorted[middle]);
}

function buildQualityActions(
  quality: CatalogCoverageReport['quality'],
  input: CatalogCoverageInput
): string[] {
  const requiredActions: string[] = [];
  if (input.minimumObservationsPerProduct !== undefined && quality.observationsPerProduct < input.minimumObservationsPerProduct) {
    requiredActions.push(`increase_price_observation_depth:min_${input.minimumObservationsPerProduct}_per_product`);
  }
  if (input.minimumFreshPriceShare !== undefined && quality.freshPriceShare < input.minimumFreshPriceShare) {
    requiredActions.push(`refresh_price_observations:min_${roundPercent(input.minimumFreshPriceShare * 100)}_percent_fresh`);
  }
  if (
    input.minimumMedianConfidenceScore !== undefined &&
    (quality.medianConfidenceScore === null || quality.medianConfidenceScore < input.minimumMedianConfidenceScore)
  ) {
    requiredActions.push(`raise_source_confidence:min_${input.minimumMedianConfidenceScore}`);
  }
  return requiredActions;
}

export function buildCatalogCoverageReport(input: CatalogCoverageInput): CatalogCoverageReport {
  const observedCategories = new Set(input.products.map((product) => product.categoryId));
  const observedChains = new Set(input.products.flatMap((product) => product.observedChainIds));
  const observedStores = new Set(input.products.flatMap((product) => product.observedStoreIds));
  const observedPriceCount = input.products.reduce((total, product) => total + (product.observedPriceCount ?? 0), 0);
  const freshPriceCount = input.products.reduce((total, product) => total + (product.freshPriceCount ?? 0), 0);
  const quality = {
    observedPriceCount,
    freshPriceCount,
    freshPriceShare: observedPriceCount === 0 ? 0 : roundPercent(freshPriceCount / observedPriceCount),
    observationsPerProduct: input.products.length === 0 ? 0 : roundPercent(observedPriceCount / input.products.length),
    medianConfidenceScore: median(input.products.flatMap((product) => (product.medianConfidenceScore === undefined ? [] : [product.medianConfidenceScore])))
  };

  const categories = summarizeCoverage(input.targetCategories, observedCategories);
  const chains = summarizeCoverage(input.targetChains, observedChains);
  const stores = summarizeCoverage(input.targetStores, observedStores);
  const requiredActions = [
    actionFor('categories', categories.missing),
    actionFor('chains', chains.missing),
    actionFor('stores', stores.missing),
    ...buildQualityActions(quality, input)
  ].filter((action): action is string => action !== null);

  return {
    status: requiredActions.length === 0 ? 'complete' : 'incomplete',
    productCount: input.products.length,
    quality,
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
  };
}
