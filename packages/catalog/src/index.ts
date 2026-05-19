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
