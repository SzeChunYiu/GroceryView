'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type ShoppingListItem = {
  checked: boolean;
  detail: string;
  id: string;
  importSource?: 'starter' | 'bulk-clipboard';
  matchedProductName?: string;
  matchedProductSlug?: string;
  name: string;
  quantity: string;
  category?: string;
  estimatedCost?: number;
};

export type BulkImportedListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'bulk-clipboard';
};

export type ListCategoryBudget = {
  category: string;
  limit: number;
  spent: number;
  isOverBudget: boolean;
};

type PersistedListState = {
  categoryBudgets?: Record<string, number>;
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
    category: 'Pantry',
    estimatedCost: 59
  },
  {
    id: 'oats-breakfast-staple',
    name: 'Oats',
    quantity: '1 bag',
    detail: 'Breakfast staple',
    category: 'Pantry',
    estimatedCost: 34
  },
  {
    id: 'milk-dairy-run',
    name: 'Milk or fil',
    quantity: '2 cartons',
    detail: 'Dairy aisle check',
    category: 'Dairy',
    estimatedCost: 42
  },
  {
    id: 'frozen-vegetables',
    name: 'Frozen vegetables',
    quantity: '1 bag',
    detail: 'Dinner backup item',
    category: 'Frozen',
    estimatedCost: 28
  },
  {
    id: 'fresh-fruit',
    name: 'Fresh fruit',
    quantity: '1 basket',
    detail: 'Snack and lunchbox item',
    category: 'Produce',
    estimatedCost: 45
  }
];

const defaultListCategoryBudgets: Record<string, number> = {
  Dairy: 60,
  Frozen: 45,
  Pantry: 100,
  Produce: 75
};

function listStateFromStorage(value: string | null): Required<PersistedListState> {
  const empty = { categoryBudgets: defaultListCategoryBudgets, checkedById: {}, importedItems: [] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];
    const maybeCategoryBudgets = 'categoryBudgets' in parsed ? parsed.categoryBudgets : defaultListCategoryBudgets;

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
      ))
      : [];

    const storedCategoryBudgets = maybeCategoryBudgets && typeof maybeCategoryBudgets === 'object' && !Array.isArray(maybeCategoryBudgets)
      ? Object.fromEntries(
        Object.entries(maybeCategoryBudgets)
          .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
          .map(([category, limit]) => [category, Math.max(0, limit)])
      )
      : {};
    const categoryBudgets = { ...defaultListCategoryBudgets, ...storedCategoryBudgets };

    return { categoryBudgets, checkedById, importedItems };
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
        detail: item.detail,
        id: item.id,
        importSource: 'bulk-clipboard' as const,
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: item.quantity
      }));
    const stored = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ categoryBudgets: stored.categoryBudgets, checkedById, importedItems }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}

export function useList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [categoryBudgetLimits, setCategoryBudgetLimits] = useState<Record<string, number>>(defaultListCategoryBudgets);
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { categoryBudgets, checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setCategoryBudgetLimits(categoryBudgets);
      setItems(withCheckedState(checkedById, importedItems));
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistCheckedState(items);
  }, [hasLoadedBrowserState, items]);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    try {
      const { checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ categoryBudgets: categoryBudgetLimits, checkedById, importedItems }));
    } catch {
      // Keep the list usable even when budget preferences cannot be saved.
    }
  }, [categoryBudgetLimits, hasLoadedBrowserState]);

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

  const updateCategoryBudgetLimit = useCallback((category: string, limit: number) => {
    setCategoryBudgetLimits((currentLimits) => ({
      ...currentLimits,
      [category]: Math.max(0, limit)
    }));
  }, []);

  const categoryBudgets = useMemo<ListCategoryBudget[]>(() => {
    const spentByCategory = new Map<string, number>();
    for (const item of items) {
      if (!item.category || typeof item.estimatedCost !== 'number') continue;
      spentByCategory.set(item.category, (spentByCategory.get(item.category) ?? 0) + item.estimatedCost);
    }

    return Object.keys(categoryBudgetLimits).sort().map((category) => {
      const spent = spentByCategory.get(category) ?? 0;
      const limit = categoryBudgetLimits[category];
      return { category, limit, spent, isOverBudget: spent > limit };
    });
  }, [categoryBudgetLimits, items]);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    addImportedItems,
    categoryBudgets,
    checkedCount,
    items,
    remainingCount,
    resetCheckedState,
    toggleItemChecked,
    totalCount,
    updateCategoryBudgetLimit
  };
}
