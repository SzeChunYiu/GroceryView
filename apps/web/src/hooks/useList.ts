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

export type SharedListActivityEvent = {
  action: 'added' | 'removed';
  actor: string;
  id: string;
  itemId: string;
  itemName: string;
  occurredAt: string;
  sourceList: string;
};

type PersistedListState = {
  activityEvents?: SharedListActivityEvent[];
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';
const MAX_ACTIVITY_EVENTS = 20;

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
  const empty = { activityEvents: [], checkedById: {}, importedItems: [] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];
    const maybeActivityEvents = 'activityEvents' in parsed ? parsed.activityEvents : [];

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

    const activityEvents = Array.isArray(maybeActivityEvents)
      ? maybeActivityEvents.filter((event): event is SharedListActivityEvent => (
        event !== null
        && typeof event === 'object'
        && (event.action === 'added' || event.action === 'removed')
        && typeof event.actor === 'string'
        && typeof event.id === 'string'
        && typeof event.itemId === 'string'
        && typeof event.itemName === 'string'
        && typeof event.occurredAt === 'string'
        && typeof event.sourceList === 'string'
      )).slice(0, MAX_ACTIVITY_EVENTS)
      : [];

    return { activityEvents, checkedById, importedItems };
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

function persistCheckedState(items: ShoppingListItem[], activityEvents: SharedListActivityEvent[]) {
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
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ activityEvents, checkedById, importedItems }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}

function sourceListForItem(item: Pick<ShoppingListItem, 'importSource'>) {
  return item.importSource === 'bulk-clipboard' ? 'Bulk import' : 'Today\'s basket';
}

export function useList() {
  const [activityEvents, setActivityEvents] = useState<SharedListActivityEvent[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { activityEvents: storedActivityEvents, checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setActivityEvents(storedActivityEvents);
      setItems(withCheckedState(checkedById, importedItems));
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistCheckedState(items, activityEvents);
  }, [activityEvents, hasLoadedBrowserState, items]);

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

      if (nextImportedItems.length > 0) {
        const occurredAt = new Date().toISOString();
        setActivityEvents((currentEvents) => [
          ...nextImportedItems.map((item, index) => ({
            action: 'added' as const,
            actor: 'You',
            id: `activity-added-${occurredAt}-${index}-${item.id}`,
            itemId: item.id,
            itemName: item.name,
            occurredAt,
            sourceList: sourceListForItem(item)
          })),
          ...currentEvents
        ].slice(0, MAX_ACTIVITY_EVENTS));
      }

      return [...currentItems, ...nextImportedItems];
    });
  }, []);

  const removeCheckedItems = useCallback(() => {
    setItems((currentItems) => {
      const removedItems = currentItems.filter((item) => item.checked);
      if (removedItems.length === 0) return currentItems;

      const occurredAt = new Date().toISOString();
      setActivityEvents((currentEvents) => [
        ...removedItems.map((item, index) => ({
          action: 'removed' as const,
          actor: 'You',
          id: `activity-removed-${occurredAt}-${index}-${item.id}`,
          itemId: item.id,
          itemName: item.name,
          occurredAt,
          sourceList: sourceListForItem(item)
        })),
        ...currentEvents
      ].slice(0, MAX_ACTIVITY_EVENTS));

      return currentItems.filter((item) => !item.checked);
    });
  }, []);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    activityEvents,
    addImportedItems,
    checkedCount,
    items,
    remainingCount,
    removeCheckedItems,
    resetCheckedState,
    toggleItemChecked,
    totalCount
  };
}
