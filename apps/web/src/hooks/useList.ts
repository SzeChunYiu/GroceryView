'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/Toast';

export type ShoppingListItem = {
  checked: boolean;
  detail: string;
  id: string;
  name: string;
  quantity: string;
};

export type AddShoppingListItemInput = {
  detail?: string;
  name: string;
  quantity?: string;
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  items?: Omit<ShoppingListItem, 'checked'>[];
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v2';

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

function checkedStateFromStorage(value: string | null): PersistedListState {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as PersistedListState | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const parsedEntries =
      'checkedById' in parsed && parsed.checkedById && typeof parsed.checkedById === 'object' && !Array.isArray(parsed.checkedById)
        ? parsed.checkedById
        : {};

    const parsedItems =
      'items' in parsed && Array.isArray(parsed.items)
        ? parsed.items.filter(
            (item): item is Omit<ShoppingListItem, 'checked'> =>
              !!item &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              typeof item.name === 'string' &&
              typeof item.quantity === 'string' &&
              typeof item.detail === 'string'
          )
        : [];

    return {
      checkedById: Object.fromEntries(
        Object.entries(parsedEntries).filter(
          ([, value]) => typeof value === 'boolean'
        ) as [string, boolean][]
      ),
      items: parsedItems.length > 0 ? parsedItems : undefined
    };
  } catch {
    return {};
  }
}

function normalizePersistedItems(items: Omit<ShoppingListItem, 'checked'>[] | undefined): Omit<ShoppingListItem, 'checked'>[] {
  if (!items || items.length === 0) {
    return [...baseListItems];
  }

  const sanitized = items
    .filter(
      (item): item is Omit<ShoppingListItem, 'checked'> =>
        !!item &&
        typeof item.id === 'string' &&
        item.id.trim() !== '' &&
        typeof item.name === 'string' &&
        item.name.trim() !== '' &&
        typeof item.quantity === 'string' &&
        typeof item.detail === 'string'
    )
    .map((item) => ({
      id: item.id.trim(),
      detail: item.detail.trim() || 'Added from shopping trip',
      name: item.name.trim(),
      quantity: item.quantity.trim() || '1 piece'
    }));

  if (sanitized.length === 0) {
    return [...baseListItems];
  }

  return sanitized;
}

function withCheckedState(
  items: Omit<ShoppingListItem, 'checked'>[],
  checkedById: Record<string, boolean> = {}
): ShoppingListItem[] {
  return items.map((item) => ({
    ...item,
    checked: checkedById[item.id] === true
  }));
}

function persistCheckedState(items: ShoppingListItem[]) {
  try {
    const checkedById = Object.fromEntries(items.map((item) => [item.id, item.checked]));
    const persistedItems = items.map(({ checked: _checked, ...item }) => item);
    localStorage.setItem(
      LIST_STORAGE_KEY,
      JSON.stringify({ checkedById, items: persistedItems })
    );
  } catch {
    // Keep the check-off UI usable even when localStorage is blocked.
  }
}

export function useList() {
  const { showToast } = useToast();
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    const persisted = checkedStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
    const persistedItems = normalizePersistedItems(persisted.items);
    return withCheckedState(persistedItems, persisted.checkedById);
  });

  useEffect(() => {
    setItems((current) => {
      const persisted = checkedStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      const persistedItems = normalizePersistedItems(
        persisted.items || baseListItems
      );
      const currentById = Object.fromEntries(current.map((item) => [item.id, item.checked]));

      if (persistedItems.length !== persisted.items?.length && persisted.items && persisted.items.length > 0) {
        return current;
      }

      return withCheckedState(
        persistedItems.length > 0 ? persistedItems : baseListItems,
        persisted.checkedById || currentById
      );
    });
  }, []);

  useEffect(() => {
    persistCheckedState(items);
  }, [items]);

  const addItem = useCallback(
    (input: AddShoppingListItemInput) => {
      const normalizedName = input.name.trim();
      if (!normalizedName) return;

      const newItem: ShoppingListItem = {
        checked: false,
        detail: input.detail?.trim() || 'Added from shopping trip',
        id: `user-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: normalizedName,
        quantity: input.quantity?.trim() || '1 piece'
      };

      setItems((current) => [newItem, ...current]);
      showToast(`Added "${normalizedName}" to your shopping list`);
    },
    [showToast]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((current) => {
        const target = current.find((item) => item.id === itemId);
        if (!target) return current;
        showToast(`Removed "${target.name}" from your shopping list`);
        return current.filter((item) => item.id !== itemId);
      });
    },
    [showToast]
  );

  const toggleItemChecked = useCallback((itemId: string) => {
    setItems((current) => current.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    ));
  }, []);

  const resetCheckedState = useCallback(() => {
    setItems((currentItems) => currentItems.map((item) => ({ ...item, checked: false })));
  }, []);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    addItem,
    checkedCount,
    items,
    removeItem,
    remainingCount,
    resetCheckedState,
    toggleItemChecked,
    totalCount
  };
}
