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

export type ShoppingRouteMode = 'quick' | 'balanced' | 'accessible';

export type ShoppingTripEstimate = {
  activeItemCount: number;
  aisleCount: number;
  aisleTraversal: string[];
  estimatedMinutes: number;
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';

export const shoppingRouteModes: Array<{ description: string; label: string; value: ShoppingRouteMode }> = [
  { description: 'Shortest route through the active aisles.', label: 'Quick route', value: 'quick' },
  { description: 'Balanced pace with fewer missed-item backtracks.', label: 'Balanced route', value: 'balanced' },
  { description: 'Adds extra time for wider turns and slower aisle changes.', label: 'Accessible route', value: 'accessible' }
];

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

const aisleOrder = ['Produce', 'Pantry', 'Dairy', 'Frozen', 'Imported items'];

function aisleForItem(item: ShoppingListItem): string {
  const text = `${item.id} ${item.name} ${item.detail}`.toLowerCase();
  if (/fruit|produce|vegetable|veg/.test(text)) return 'Produce';
  if (/milk|fil|dairy|cheese|yogurt/.test(text)) return 'Dairy';
  if (/frozen/.test(text)) return 'Frozen';
  if (item.importSource === 'bulk-clipboard') return 'Imported items';
  return 'Pantry';
}

function estimateShoppingTrip(items: ShoppingListItem[], routeMode: ShoppingRouteMode): ShoppingTripEstimate {
  const activeItems = items.filter((item) => !item.checked);
  const aisles = [...new Set(activeItems.map(aisleForItem))]
    .sort((a, b) => aisleOrder.indexOf(a) - aisleOrder.indexOf(b));

  if (activeItems.length === 0) {
    return { activeItemCount: 0, aisleCount: 0, aisleTraversal: [], estimatedMinutes: 0 };
  }

  const modeSettings: Record<ShoppingRouteMode, { perAisle: number; perItem: number; setup: number }> = {
    quick: { perAisle: 1, perItem: 2, setup: 2 },
    balanced: { perAisle: 1.5, perItem: 2.5, setup: 3 },
    accessible: { perAisle: 2, perItem: 3, setup: 4 }
  };
  const settings = modeSettings[routeMode];
  const estimatedMinutes = Math.max(1, Math.ceil(settings.setup + activeItems.length * settings.perItem + aisles.length * settings.perAisle));

  return {
    activeItemCount: activeItems.length,
    aisleCount: aisles.length,
    aisleTraversal: aisles,
    estimatedMinutes
  };
}

export function useList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);
  const [routeMode, setRouteMode] = useState<ShoppingRouteMode>('balanced');

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
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;
  const tripEstimate = useMemo(() => estimateShoppingTrip(items, routeMode), [items, routeMode]);

  return {
    addImportedItems,
    checkedCount,
    items,
    remainingCount,
    resetCheckedState,
    routeMode,
    setRouteMode,
    toggleItemChecked,
    totalCount,
    tripEstimate
  };
}
