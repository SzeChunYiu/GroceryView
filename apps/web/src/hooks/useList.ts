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

type ListOfflineMutation =
  | { checked: boolean; createdAt: string; id: string; itemId: string; type: 'item_checked' }
  | { createdAt: string; id: string; type: 'reset_checked' }
  | { createdAt: string; id: string; items: BulkImportedListItemInput[]; type: 'import_items' };

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';
export const LIST_OFFLINE_QUEUE_STORAGE_KEY = 'groceryview:shopping-list:offline-queue:v1';

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

function offlineQueueFromStorage(value: string | null): ListOfflineMutation[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as ListOfflineMutation[] | null;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((mutation): mutation is ListOfflineMutation => {
      if (!mutation || typeof mutation !== 'object' || typeof mutation.id !== 'string' || typeof mutation.createdAt !== 'string') return false;
      if (mutation.type === 'item_checked') return typeof mutation.itemId === 'string' && typeof mutation.checked === 'boolean';
      if (mutation.type === 'reset_checked') return true;
      if (mutation.type === 'import_items') return Array.isArray(mutation.items);
      return false;
    });
  } catch {
    return [];
  }
}

function shouldQueueListMutation(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function canReplayQueuedListMutations(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function createOfflineMutationId(type: ListOfflineMutation['type']): string {
  return `${type}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function enqueueListMutation(mutation: ListOfflineMutation) {
  try {
    const queue = offlineQueueFromStorage(localStorage.getItem(LIST_OFFLINE_QUEUE_STORAGE_KEY));
    localStorage.setItem(LIST_OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify([...queue, mutation]));
  } catch {
    // Keep list writes available even when offline queue persistence is blocked.
  }
}

function applyQueuedListMutation(items: ShoppingListItem[], mutation: ListOfflineMutation): ShoppingListItem[] {
  if (mutation.type === 'item_checked') {
    return items.map((item) => (item.id === mutation.itemId ? { ...item, checked: mutation.checked } : item));
  }

  if (mutation.type === 'reset_checked') {
    return items.map((item) => ({ ...item, checked: false }));
  }

  const existingIds = new Set(items.map((item) => item.id));
  const nextImportedItems = mutation.items
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({ ...item, importSource: 'bulk-clipboard' as const, checked: false }));

  return [...items, ...nextImportedItems];
}

function replayQueuedListMutations(items: ShoppingListItem[]): ShoppingListItem[] {
  if (!canReplayQueuedListMutations()) return items;

  try {
    const queue = offlineQueueFromStorage(localStorage.getItem(LIST_OFFLINE_QUEUE_STORAGE_KEY));
    if (queue.length === 0) return items;

    localStorage.removeItem(LIST_OFFLINE_QUEUE_STORAGE_KEY);
    return queue.reduce(applyQueuedListMutation, items);
  } catch {
    return items;
  }
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

export function useList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setItems(replayQueuedListMutations(withCheckedState(checkedById, importedItems)));
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistCheckedState(items);
  }, [hasLoadedBrowserState, items]);

  useEffect(() => {
    function handleOnline() {
      setItems((currentItems) => replayQueuedListMutations(currentItems));
    }

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const toggleItemChecked = useCallback((itemId: string) => {
    setItems((currentItems) => {
      let queuedChecked: boolean | null = null;
      const nextItems = currentItems.map((item) => {
        if (item.id !== itemId) return item;
        queuedChecked = !item.checked;
        return { ...item, checked: !item.checked };
      });

      if (queuedChecked !== null && shouldQueueListMutation()) {
        enqueueListMutation({ checked: queuedChecked, createdAt: new Date().toISOString(), id: createOfflineMutationId('item_checked'), itemId, type: 'item_checked' });
      }

      return nextItems;
    });
  }, []);

  const resetCheckedState = useCallback(() => {
    setItems((currentItems) => {
      if (shouldQueueListMutation()) {
        enqueueListMutation({ createdAt: new Date().toISOString(), id: createOfflineMutationId('reset_checked'), type: 'reset_checked' });
      }

      return currentItems.map((item) => ({ ...item, checked: false }));
    });
  }, []);

  const addImportedItems = useCallback((importedItems: BulkImportedListItemInput[]) => {
    setItems((currentItems) => {
      const existingIds = new Set(currentItems.map((item) => item.id));
      const nextImportedItems = importedItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({ ...item, importSource: 'bulk-clipboard' as const, checked: false }));

      if (nextImportedItems.length > 0 && shouldQueueListMutation()) {
        enqueueListMutation({
          createdAt: new Date().toISOString(),
          id: createOfflineMutationId('import_items'),
          items: nextImportedItems.map(({ checked: _checked, ...item }) => item),
          type: 'import_items'
        });
      }

      return [...currentItems, ...nextImportedItems];
    });
  }, []);

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
