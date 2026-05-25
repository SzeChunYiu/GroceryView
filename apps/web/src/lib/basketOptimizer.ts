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
