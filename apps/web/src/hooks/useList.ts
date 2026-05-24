'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type ShoppingListItem = {
  category: string;
  checked: boolean;
  detail: string;
  estimatedPrice: number;
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

export type ListBudgetBucket = {
  budget: number;
  category: string;
  itemCount: number;
  remaining: number;
  spent: number;
  status: 'under' | 'over';
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';

export const listCategoryBudgets: Record<string, number> = {
  breakfast: 50,
  coffee: 80,
  dairy: 90,
  frozen: 70,
  pantry: 100,
  produce: 120,
  uncategorized: 75
};

const baseListItems: Omit<ShoppingListItem, 'checked'>[] = [
  {
    id: 'coffee-weekly-top-up',
    category: 'coffee',
    estimatedPrice: 49.9,
    name: 'Coffee',
    quantity: '1 package',
    detail: 'Weekly basket top-up item'
  },
  {
    id: 'oats-breakfast-staple',
    category: 'breakfast',
    estimatedPrice: 24.9,
    name: 'Oats',
    quantity: '1 bag',
    detail: 'Breakfast staple'
  },
  {
    id: 'milk-dairy-run',
    category: 'dairy',
    estimatedPrice: 35.8,
    name: 'Milk or fil',
    quantity: '2 cartons',
    detail: 'Dairy aisle check'
  },
  {
    id: 'frozen-vegetables',
    category: 'frozen',
    estimatedPrice: 29.9,
    name: 'Frozen vegetables',
    quantity: '1 bag',
    detail: 'Dinner backup item'
  },
  {
    id: 'fresh-fruit',
    category: 'produce',
    estimatedPrice: 64.5,
    name: 'Fresh fruit',
    quantity: '1 basket',
    detail: 'Snack and lunchbox item'
  }
];

function listStateFromStorage(value: string | null): Required<PersistedListState> {
  const empty = { checkedById: {}, importedItems: [] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];

    const checkedById = maybeCheckedById && typeof maybeCheckedById === 'object' && !Array.isArray(maybeCheckedById)
      ? Object.fromEntries(
        Object.entries(maybeCheckedById)
          .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
      )
      : {};

    const importedItems = Array.isArray(maybeImportedItems)
      ? maybeImportedItems
        .filter((item): item is BulkImportedListItemInput => (
          item !== null
          && typeof item === 'object'
          && item.importSource === 'bulk-clipboard'
          && typeof item.id === 'string'
          && typeof item.name === 'string'
          && typeof item.quantity === 'string'
          && typeof item.detail === 'string'
        ))
        .map((item) => ({
          ...item,
          category: typeof item.category === 'string' && item.category.trim() ? item.category : 'uncategorized',
          estimatedPrice: typeof item.estimatedPrice === 'number' && Number.isFinite(item.estimatedPrice) ? item.estimatedPrice : 0
        }))
      : [];

    return { checkedById, importedItems };
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

function persistCheckedState(items: ShoppingListItem[]) {
  try {
    const checkedById = Object.fromEntries(items.map((item) => [item.id, item.checked]));
    const importedItems = items
      .filter((item) => item.importSource === 'bulk-clipboard')
      .map((item) => ({
        category: item.category,
        detail: item.detail,
        estimatedPrice: item.estimatedPrice,
        id: item.id,
        importSource: 'bulk-clipboard' as const,
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: item.quantity
      }));
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ checkedById, importedItems }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}


export function summarizeListBudgetBuckets(items: ShoppingListItem[]): ListBudgetBucket[] {
  const byCategory = new Map<string, { itemCount: number; spent: number }>();
  for (const item of items) {
    const category = item.category || 'uncategorized';
    const current = byCategory.get(category) ?? { itemCount: 0, spent: 0 };
    byCategory.set(category, {
      itemCount: current.itemCount + 1,
      spent: Math.round((current.spent + item.estimatedPrice) * 100) / 100
    });
  }

  return [...byCategory.entries()]
    .map(([category, summary]) => {
      const budget = listCategoryBudgets[category] ?? listCategoryBudgets.uncategorized;
      const remaining = Math.round((budget - summary.spent) * 100) / 100;
      return {
        budget,
        category,
        itemCount: summary.itemCount,
        remaining,
        spent: summary.spent,
        status: remaining < 0 ? 'over' : 'under'
      } satisfies ListBudgetBucket;
    })
    .sort((left, right) => (left.status === right.status ? left.category.localeCompare(right.category) : left.status === 'over' ? -1 : 1));
}

export function useList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setItems(withCheckedState(checkedById, importedItems));
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistCheckedState(items);
  }, [hasLoadedBrowserState, items]);

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
  const budgetBuckets = useMemo(() => summarizeListBudgetBuckets(items), [items]);
  const budgetAlerts = useMemo(() => budgetBuckets.filter((bucket) => bucket.status === 'over'), [budgetBuckets]);
  const estimatedTotal = useMemo(() => Math.round(items.reduce((sum, item) => sum + item.estimatedPrice, 0) * 100) / 100, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    addImportedItems,
    budgetAlerts,
    budgetBuckets,
    checkedCount,
    estimatedTotal,
    items,
    remainingCount,
    resetCheckedState,
    toggleItemChecked,
    totalCount
  };
}
