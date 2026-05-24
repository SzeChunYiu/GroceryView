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
};

export type BulkImportedListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'bulk-clipboard';
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

type UseListOptions = {
  readOnly?: boolean;
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';

const baseListItems: Omit<ShoppingListItem, 'checked'>[] = [
  {
    id: 'coffee-weekly-top-up',
    name: 'Coffee',
    quantity: '1 package',
    detail: 'Weekly basket top-up item'
  },
  {
    id: 'oats-breakfast-staple',
    name: 'Oats',
    quantity: '1 bag',
    detail: 'Breakfast staple'
  },
  {
    id: 'milk-dairy-run',
    name: 'Milk or fil',
    quantity: '2 cartons',
    detail: 'Dairy aisle check'
  },
  {
    id: 'frozen-vegetables',
    name: 'Frozen vegetables',
    quantity: '1 bag',
    detail: 'Dinner backup item'
  },
  {
    id: 'fresh-fruit',
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
        detail: item.detail,
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

export function useList({ readOnly = false }: UseListOptions = {}) {
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
    if (readOnly) return;
    persistCheckedState(items);
  }, [hasLoadedBrowserState, items, readOnly]);

  const toggleItemChecked = useCallback((itemId: string) => {
    if (readOnly) return;
    setItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )));
  }, [readOnly]);

  const resetCheckedState = useCallback(() => {
    if (readOnly) return;
    setItems((currentItems) => currentItems.map((item) => ({ ...item, checked: false })));
  }, [readOnly]);

  const addImportedItems = useCallback((importedItems: BulkImportedListItemInput[]) => {
    if (readOnly) return;
    setItems((currentItems) => {
      const existingIds = new Set(currentItems.map((item) => item.id));
      const nextImportedItems = importedItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({ ...item, importSource: 'bulk-clipboard' as const, checked: false }));

      return [...currentItems, ...nextImportedItems];
    });
  }, [readOnly]);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    addImportedItems,
    checkedCount,
    items,
    remainingCount,
    resetCheckedState,
    toggleItemChecked,
    totalCount
  };
}
