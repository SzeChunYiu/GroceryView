export type BasketCostSortableStore = {
  missingCount: number;
  storeName: string;
  total: number | null;
};

export const basketCostSortDescription = 'Stores are sorted by total basket cost first, then missing basket rows, then store name.';

export function sortStoresByTotalBasketCost<TStore extends BasketCostSortableStore>(stores: readonly TStore[]): TStore[] {
  return [...stores].sort((left, right) => {
    const leftTotal = left.total ?? Number.POSITIVE_INFINITY;
    const rightTotal = right.total ?? Number.POSITIVE_INFINITY;
    if (leftTotal !== rightTotal) return leftTotal - rightTotal;
    if (left.missingCount !== right.missingCount) return left.missingCount - right.missingCount;
    return left.storeName.localeCompare(right.storeName, 'sv');
  });
}

export function basketCostWinner<TStore extends BasketCostSortableStore>(stores: readonly TStore[]): TStore | undefined {
  return sortStoresByTotalBasketCost(stores).find((store) => store.total !== null);
}

export type BasketOptimizerItem = {
  id: string;
  name: string;
  quantity?: string;
  matchedProductSlug?: string;
};

export type BasketOptimizerPriceRow = {
  productSlug: string;
  storeId: string;
  storeName: string;
  price: number;
};

export type OptimizedBasketStore = BasketCostSortableStore & {
  storeId: string;
  itemCount: number;
  coveredItemIds: string[];
  missingItemIds: string[];
};

export type OptimizedBasketSplitItem = {
  itemId: string;
  itemName: string;
  storeId: string | null;
  storeName: string | null;
  price: number | null;
};

export type OptimizedBasketPlan = {
  mode: 'single_store' | 'two_store_split';
  total: number | null;
  missingCount: number;
  stores: OptimizedBasketStore[];
  assignments: OptimizedBasketSplitItem[];
};

export type BasketOptimizationReport = {
  singleStorePlans: OptimizedBasketPlan[];
  bestSingleStore: OptimizedBasketPlan | null;
  bestTwoStoreSplit: OptimizedBasketPlan | null;
  recommendedPlan: OptimizedBasketPlan | null;
};

export function optimizeBasketByStore(
  items: readonly BasketOptimizerItem[],
  priceRows: readonly BasketOptimizerPriceRow[],
  options: { allowTwoStoreSplit?: boolean } = {}
): BasketOptimizationReport {
  const pricedItems = items.filter((item) => item.matchedProductSlug);
  const storeIds = [...new Set(priceRows.map((row) => row.storeId))].sort((a, b) => storeNameFor(priceRows, a).localeCompare(storeNameFor(priceRows, b), 'sv'));
  const singleStorePlans = sortPlans(storeIds.map((storeId) => singleStorePlan(storeId, items, priceRows)));
  const bestSingleStore = singleStorePlans.find((plan) => plan.total !== null) ?? null;
  const bestTwoStoreSplit = options.allowTwoStoreSplit === false || storeIds.length < 2
    ? null
    : sortPlans(storePairs(storeIds).map(([left, right]) => splitStorePlan([left, right], items, priceRows))).find((plan) => plan.total !== null) ?? null;
  const candidates = [bestSingleStore, bestTwoStoreSplit].filter((plan): plan is OptimizedBasketPlan => plan !== null);

  return {
    singleStorePlans,
    bestSingleStore,
    bestTwoStoreSplit,
    recommendedPlan: candidates.sort(comparePlans)[0] ?? (pricedItems.length ? null : singleStorePlans[0] ?? null)
  };
}

function singleStorePlan(storeId: string, items: readonly BasketOptimizerItem[], priceRows: readonly BasketOptimizerPriceRow[]): OptimizedBasketPlan {
  const storeName = storeNameFor(priceRows, storeId);
  const assignments = items.map((item) => {
    const row = item.matchedProductSlug ? priceForItemAtStore(item.matchedProductSlug, storeId, priceRows) : null;
    return {
      itemId: item.id,
      itemName: item.name,
      storeId: row ? storeId : null,
      storeName: row ? storeName : null,
      price: row?.price ?? null
    };
  });
  return planFromAssignments('single_store', assignments, [{ storeId, storeName }]);
}

function splitStorePlan(storeIds: readonly [string, string], items: readonly BasketOptimizerItem[], priceRows: readonly BasketOptimizerPriceRow[]): OptimizedBasketPlan {
  const assignments = items.map((item) => {
    const candidates = item.matchedProductSlug
      ? storeIds
        .map((storeId) => priceForItemAtStore(item.matchedProductSlug!, storeId, priceRows))
        .filter((row): row is BasketOptimizerPriceRow => row !== null)
        .sort((left, right) => left.price - right.price || left.storeName.localeCompare(right.storeName, 'sv'))
      : [];
    const row = candidates[0] ?? null;
    return {
      itemId: item.id,
      itemName: item.name,
      storeId: row?.storeId ?? null,
      storeName: row?.storeName ?? null,
      price: row?.price ?? null
    };
  });
  return planFromAssignments('two_store_split', assignments, storeIds.map((storeId) => ({ storeId, storeName: storeNameFor(priceRows, storeId) })));
}

function planFromAssignments(
  mode: OptimizedBasketPlan['mode'],
  assignments: OptimizedBasketSplitItem[],
  stores: Array<{ storeId: string; storeName: string }>
): OptimizedBasketPlan {
  const missingItemIds = assignments.filter((assignment) => assignment.price === null).map((assignment) => assignment.itemId);
  const total = assignments.some((assignment) => assignment.price !== null)
    ? roundSek(assignments.reduce((sum, assignment) => sum + (assignment.price ?? 0), 0))
    : null;
  return {
    mode,
    total,
    missingCount: missingItemIds.length,
    stores: stores.map((store) => {
      const coveredItemIds = assignments.filter((assignment) => assignment.storeId === store.storeId && assignment.price !== null).map((assignment) => assignment.itemId);
      const storeTotal = assignments
        .filter((assignment) => assignment.storeId === store.storeId && assignment.price !== null)
        .reduce((sum, assignment) => sum + (assignment.price ?? 0), 0);
      return {
        ...store,
        total: coveredItemIds.length ? roundSek(storeTotal) : null,
        missingCount: missingItemIds.length,
        itemCount: coveredItemIds.length,
        coveredItemIds,
        missingItemIds
      };
    }),
    assignments
  };
}

function priceForItemAtStore(productSlug: string, storeId: string, priceRows: readonly BasketOptimizerPriceRow[]): BasketOptimizerPriceRow | null {
  return priceRows.find((row) => row.productSlug === productSlug && row.storeId === storeId) ?? null;
}

function storeNameFor(priceRows: readonly BasketOptimizerPriceRow[], storeId: string) {
  return priceRows.find((row) => row.storeId === storeId)?.storeName ?? storeId;
}

function storePairs(storeIds: readonly string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let left = 0; left < storeIds.length; left += 1) {
    for (let right = left + 1; right < storeIds.length; right += 1) {
      pairs.push([storeIds[left], storeIds[right]]);
    }
  }
  return pairs;
}

function sortPlans(plans: OptimizedBasketPlan[]) {
  return [...plans].sort(comparePlans);
}

function comparePlans(left: OptimizedBasketPlan, right: OptimizedBasketPlan) {
  const totalDelta = (left.total ?? Number.POSITIVE_INFINITY) - (right.total ?? Number.POSITIVE_INFINITY);
  if (totalDelta !== 0) return totalDelta;
  if (left.missingCount !== right.missingCount) return left.missingCount - right.missingCount;
  return left.stores.map((store) => store.storeName).join(' + ').localeCompare(right.stores.map((store) => store.storeName).join(' + '), 'sv');
}

function roundSek(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
