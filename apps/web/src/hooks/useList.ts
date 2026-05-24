'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type ShoppingListItem = {
  checked: boolean;
  detail: string;
  estimatedTripCostSek?: number;
  id: string;
  importSource?: 'starter' | 'bulk-clipboard';
  matchedProductName?: string;
  matchedProductSlug?: string;
  name: string;
  quantity: string;
};

export type BulkImportedListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'bulk-clipboard';
};

type PersistedListState = {
  budgetCeilingSek?: number;
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';
export const DEFAULT_TRIP_BUDGET_SEK = 500;
export const SOFT_BUDGET_THRESHOLD = 0.8;

type ListStateSnapshot = {
  budgetCeilingSek: number;
  checkedById: Record<string, boolean>;
  importedItems: BulkImportedListItemInput[];
};

const baseListItems: Omit<ShoppingListItem, 'checked'>[] = [
  {
    id: 'coffee-weekly-top-up',
    name: 'Coffee',
    quantity: '1 package',
    estimatedTripCostSek: 58,
    detail: 'Weekly basket top-up item'
  },
  {
    id: 'oats-breakfast-staple',
    name: 'Oats',
    quantity: '1 bag',
    estimatedTripCostSek: 34,
    detail: 'Breakfast staple'
  },
  {
    id: 'milk-dairy-run',
    name: 'Milk or fil',
    quantity: '2 cartons',
    estimatedTripCostSek: 42,
    detail: 'Dairy aisle check'
  },
  {
    id: 'frozen-vegetables',
    name: 'Frozen vegetables',
    quantity: '1 bag',
    estimatedTripCostSek: 28,
    detail: 'Dinner backup item'
  },
  {
    id: 'fresh-fruit',
    name: 'Fresh fruit',
    quantity: '1 basket',
    estimatedTripCostSek: 65,
    detail: 'Snack and lunchbox item'
  }
];

function budgetCeilingFromValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : DEFAULT_TRIP_BUDGET_SEK;
}

function listStateFromStorage(value: string | null): ListStateSnapshot {
  const empty = { budgetCeilingSek: DEFAULT_TRIP_BUDGET_SEK, checkedById: {}, importedItems: [] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];
    const budgetCeilingSek = 'budgetCeilingSek' in parsed ? budgetCeilingFromValue(parsed.budgetCeilingSek) : DEFAULT_TRIP_BUDGET_SEK;

    const checkedById = maybeCheckedById && typeof maybeCheckedById === 'object' && !Array.isArray(maybeCheckedById)
      ? Object.fromEntries(
        Object.entries(maybeCheckedById)
          .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
      )
      : {};

    const importedItems = Array.isArray(maybeImportedItems)
      ? maybeImportedItems.filter((item): item is BulkImportedListItemInput => (
        item !== null
        && typeof item === 'object'
        && item.importSource === 'bulk-clipboard'
        && typeof item.id === 'string'
        && typeof item.name === 'string'
        && typeof item.quantity === 'string'
        && typeof item.detail === 'string'
        && (!('estimatedTripCostSek' in item) || typeof item.estimatedTripCostSek === 'number')
      ))
      : [];

    return { budgetCeilingSek, checkedById, importedItems };
  } catch {
    return empty;
  }
}

function withCheckedState(checkedById: Record<string, boolean>, importedItems: BulkImportedListItemInput[] = []): ShoppingListItem[] {
  const uniqueItems = new Map<string, Omit<ShoppingListItem, 'checked'>>();
  for (const item of baseListItems) uniqueItems.set(item.id, item);
  for (const item of importedItems) uniqueItems.set(item.id, item);

  return [...uniqueItems.values()].map((item) => ({
    ...item,
    checked: checkedById[item.id] === true
  }));
}

function persistListState(items: ShoppingListItem[], budgetCeilingSek: number) {
  try {
    const checkedById = Object.fromEntries(items.map((item) => [item.id, item.checked]));
    const importedItems = items
      .filter((item) => item.importSource === 'bulk-clipboard')
      .map((item) => ({
        detail: item.detail,
        estimatedTripCostSek: item.estimatedTripCostSek,
        id: item.id,
        importSource: 'bulk-clipboard' as const,
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: item.quantity
      }));
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ budgetCeilingSek, checkedById, importedItems }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}

export function useList() {
  const [budgetCeilingSek, setBudgetCeilingSekState] = useState(DEFAULT_TRIP_BUDGET_SEK);
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { budgetCeilingSek, checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setBudgetCeilingSekState(budgetCeilingSek);
      setItems(withCheckedState(checkedById, importedItems));
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistListState(items, budgetCeilingSek);
  }, [budgetCeilingSek, hasLoadedBrowserState, items]);

  const setBudgetCeilingSek = useCallback((nextBudgetCeilingSek: number) => {
    setBudgetCeilingSekState(budgetCeilingFromValue(nextBudgetCeilingSek));
  }, []);

  const toggleItemChecked = useCallback((itemId: string) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )));
  }, []);

  const resetCheckedState = useCallback(() => {
    setItems((currentItems) => currentItems.map((item) => ({ ...item, checked: false })));
  }, []);

  const addImportedItems = useCallback((importedItems: BulkImportedListItemInput[]) => {
    setItems((currentItems) => {
      const existingIds = new Set(currentItems.map((item) => item.id));
      const nextImportedItems = importedItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({ ...item, importSource: 'bulk-clipboard' as const, checked: false }));

      return [...currentItems, ...nextImportedItems];
    });
  }, []);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const runningTripTotalSek = useMemo(() => (
    items.reduce((total, item) => total + (item.checked ? item.estimatedTripCostSek ?? 0 : 0), 0)
  ), [items]);
  const projectedTripTotalSek = useMemo(() => (
    items.reduce((total, item) => total + (item.estimatedTripCostSek ?? 0), 0)
  ), [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;
  const budgetUsageRatio = budgetCeilingSek > 0 ? runningTripTotalSek / budgetCeilingSek : 0;
  const budgetRemainingSek = budgetCeilingSek - runningTripTotalSek;
  const budgetWarningLevel = budgetUsageRatio >= 1 ? 'hard' : budgetUsageRatio >= SOFT_BUDGET_THRESHOLD ? 'soft' : 'none';

  return {
    addImportedItems,
    budgetCeilingSek,
    budgetRemainingSek,
    budgetUsageRatio,
    budgetWarningLevel,
    checkedCount,
    items,
    projectedTripTotalSek,
    remainingCount,
    resetCheckedState,
    runningTripTotalSek,
    setBudgetCeilingSek,
    toggleItemChecked,
    totalCount
  };
}
