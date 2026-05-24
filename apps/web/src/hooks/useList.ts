'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type ShoppingListItem = {
  checked: boolean;
  detail: string;
  estimatedPriceSek?: number;
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
  budgetTargetSek?: number;
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';

const baseListItems: Omit<ShoppingListItem, 'checked'>[] = [
  {
    id: 'coffee-weekly-top-up',
    name: 'Coffee',
    quantity: '1 package',
    detail: 'Weekly basket top-up item',
    estimatedPriceSek: 65
  },
  {
    id: 'oats-breakfast-staple',
    name: 'Oats',
    quantity: '1 bag',
    detail: 'Breakfast staple',
    estimatedPriceSek: 28
  },
  {
    id: 'milk-dairy-run',
    name: 'Milk or fil',
    quantity: '2 cartons',
    detail: 'Dairy aisle check',
    estimatedPriceSek: 36
  },
  {
    id: 'frozen-vegetables',
    name: 'Frozen vegetables',
    quantity: '1 bag',
    detail: 'Dinner backup item',
    estimatedPriceSek: 32
  },
  {
    id: 'fresh-fruit',
    name: 'Fresh fruit',
    quantity: '1 basket',
    detail: 'Snack and lunchbox item',
    estimatedPriceSek: 45
  }
];

function listStateFromStorage(value: string | null): Required<PersistedListState> {
  const empty = { budgetTargetSek: 350, checkedById: {}, importedItems: [] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];
    const budgetTargetSek = 'budgetTargetSek' in parsed && typeof parsed.budgetTargetSek === 'number' && Number.isFinite(parsed.budgetTargetSek)
      ? Math.max(0, parsed.budgetTargetSek)
      : empty.budgetTargetSek;

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
        && (item.estimatedPriceSek === undefined || typeof item.estimatedPriceSek === 'number')
      ))
      : [];

    return { budgetTargetSek, checkedById, importedItems };
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

function persistCheckedState(items: ShoppingListItem[], budgetTargetSek: number) {
  try {
    const checkedById = Object.fromEntries(items.map((item) => [item.id, item.checked]));
    const importedItems = items
      .filter((item) => item.importSource === 'bulk-clipboard')
      .map((item) => ({
        detail: item.detail,
        estimatedPriceSek: item.estimatedPriceSek,
        id: item.id,
        importSource: 'bulk-clipboard' as const,
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: item.quantity
      }));
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ budgetTargetSek, checkedById, importedItems }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}

export function useList() {
  const [budgetTargetSek, setBudgetTargetSek] = useState(350);
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { budgetTargetSek: storedBudgetTargetSek, checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setBudgetTargetSek(storedBudgetTargetSek);
      setItems(withCheckedState(checkedById, importedItems));
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistCheckedState(items, budgetTargetSek);
  }, [budgetTargetSek, hasLoadedBrowserState, items]);

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
  const estimatedTripTotalSek = useMemo(() => items.reduce((total, item) => (
    total + (item.checked ? item.estimatedPriceSek ?? 0 : 0)
  ), 0), [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;
  const budgetRemainingSek = budgetTargetSek - estimatedTripTotalSek;
  const budgetUsageRatio = budgetTargetSek > 0 ? estimatedTripTotalSek / budgetTargetSek : 0;

  return {
    addImportedItems,
    budgetRemainingSek,
    budgetTargetSek,
    budgetUsageRatio,
    checkedCount,
    estimatedTripTotalSek,
    items,
    remainingCount,
    resetCheckedState,
    setBudgetTargetSek,
    toggleItemChecked,
    totalCount
  };
}
