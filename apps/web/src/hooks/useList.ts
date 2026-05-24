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

export type ShoppingListSummary = {
  id: string;
  name: string;
};

type PersistedSingleListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

type PersistedShoppingList = ShoppingListSummary & Required<PersistedSingleListState>;

type PersistedListState = {
  activeListId?: string;
  lists?: PersistedShoppingList[];
} & PersistedSingleListState;

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';
export const DEFAULT_LIST_ID = 'weekly-basics';
export const DEFAULT_LIST_NAME = 'Weekly basics';

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

function emptySingleListState(): Required<PersistedSingleListState> {
  return { checkedById: {}, importedItems: [] };
}

function defaultList(overrides: Partial<PersistedShoppingList> = {}): PersistedShoppingList {
  return {
    id: DEFAULT_LIST_ID,
    name: DEFAULT_LIST_NAME,
    ...emptySingleListState(),
    ...overrides
  };
}

function validCheckedById(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(
      Object.entries(value)
        .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
    )
    : {};
}

function validImportedItems(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is BulkImportedListItemInput => (
      item !== null
      && typeof item === 'object'
      && item.importSource === 'bulk-clipboard'
      && typeof item.id === 'string'
      && typeof item.name === 'string'
      && typeof item.quantity === 'string'
      && typeof item.detail === 'string'
    ))
    : [];
}

function normalizeList(value: unknown): PersistedShoppingList | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const maybeList = value as Partial<PersistedShoppingList>;
  if (typeof maybeList.id !== 'string' || typeof maybeList.name !== 'string') return null;

  return {
    id: maybeList.id,
    name: maybeList.name,
    checkedById: validCheckedById(maybeList.checkedById),
    importedItems: validImportedItems(maybeList.importedItems)
  };
}

function listStateFromStorage(value: string | null): { activeListId: string; lists: PersistedShoppingList[] } {
  const empty = { activeListId: DEFAULT_LIST_ID, lists: [defaultList()] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    if (Array.isArray((parsed as PersistedListState).lists)) {
      const lists = (parsed as PersistedListState).lists?.map(normalizeList).filter((list): list is PersistedShoppingList => list !== null) ?? [];
      if (lists.length === 0) return empty;
      const activeListId = typeof (parsed as PersistedListState).activeListId === 'string'
        && lists.some((list) => list.id === (parsed as PersistedListState).activeListId)
        ? (parsed as PersistedListState).activeListId as string
        : lists[0].id;
      return { activeListId, lists };
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];

    return {
      activeListId: DEFAULT_LIST_ID,
      lists: [defaultList({
        checkedById: validCheckedById(maybeCheckedById),
        importedItems: validImportedItems(maybeImportedItems)
      })]
    };
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

function stateForItems(items: ShoppingListItem[]): Required<PersistedSingleListState> {
  return {
    checkedById: Object.fromEntries(items.map((item) => [item.id, item.checked])),
    importedItems: items
      .filter((item) => item.importSource === 'bulk-clipboard')
      .map((item) => ({
        detail: item.detail,
        id: item.id,
        importSource: 'bulk-clipboard' as const,
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: item.quantity
      }))
  };
}

function persistListState(activeListId: string, lists: PersistedShoppingList[]) {
  try {
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ activeListId, lists }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}

function slugFromName(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shopping-list';
}

export function useList() {
  const [activeListId, setActiveListId] = useState(DEFAULT_LIST_ID);
  const [lists, setLists] = useState<PersistedShoppingList[]>(() => [defaultList()]);
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const storedState = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setActiveListId(storedState.activeListId);
      setLists(storedState.lists);
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistListState(activeListId, lists);
  }, [activeListId, hasLoadedBrowserState, lists]);

  const activeList = lists.find((list) => list.id === activeListId) ?? lists[0] ?? defaultList();
  const items = useMemo(() => withCheckedState(activeList.checkedById, activeList.importedItems), [activeList]);

  const updateActiveListItems = useCallback((updater: (items: ShoppingListItem[]) => ShoppingListItem[]) => {
    setLists((currentLists) => currentLists.map((list) => {
      if (list.id !== activeListId) return list;
      return { ...list, ...stateForItems(updater(withCheckedState(list.checkedById, list.importedItems))) };
    }));
  }, [activeListId]);

  const toggleItemChecked = useCallback((itemId: string) => {
    updateActiveListItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )));
  }, [updateActiveListItems]);

  const resetCheckedState = useCallback(() => {
    updateActiveListItems((currentItems) => currentItems.map((item) => ({ ...item, checked: false })));
  }, [updateActiveListItems]);

  const addImportedItems = useCallback((importedItems: BulkImportedListItemInput[]) => {
    updateActiveListItems((currentItems) => {
      const existingIds = new Set(currentItems.map((item) => item.id));
      const nextImportedItems = importedItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({ ...item, importSource: 'bulk-clipboard' as const, checked: false }));

      return [...currentItems, ...nextImportedItems];
    });
  }, [updateActiveListItems]);

  const createList = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const id = `${slugFromName(trimmedName)}-${Date.now().toString(36)}`;
    setLists((currentLists) => [...currentLists, defaultList({ id, name: trimmedName })]);
    setActiveListId(id);
  }, []);

  const deleteList = useCallback((listId: string) => {
    setLists((currentLists) => {
      if (currentLists.length <= 1) return currentLists;
      const nextLists = currentLists.filter((list) => list.id !== listId);
      if (listId === activeListId && nextLists.length > 0) setActiveListId(nextLists[0].id);
      return nextLists.length > 0 ? nextLists : currentLists;
    });
  }, [activeListId]);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    activeListId,
    activeListName: activeList.name,
    addImportedItems,
    checkedCount,
    createList,
    deleteList,
    items,
    listSummaries: lists.map(({ id, name }) => ({ id, name })),
    remainingCount,
    resetCheckedState,
    switchList: setActiveListId,
    toggleItemChecked,
    totalCount
  };
}
