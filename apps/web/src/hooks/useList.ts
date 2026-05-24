'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type ShoppingListItem = {
  checked: boolean;
  detail: string;
  id: string;
  importSource?: 'starter' | 'bulk-clipboard' | 'recurring-template';
  matchedProductName?: string;
  matchedProductSlug?: string;
  name: string;
  quantity: string;
};

export type BulkImportedListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'bulk-clipboard';
};

type UserCreatedListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'bulk-clipboard' | 'recurring-template';
};

export type RecurringListFrequency = 'weekly' | 'biweekly';

type RecurringTemplateItem = Omit<ShoppingListItem, 'checked' | 'id' | 'importSource'>;

export type RecurringListTemplate = {
  createdAt: string;
  frequency: RecurringListFrequency;
  id: string;
  items: RecurringTemplateItem[];
  lastGeneratedAt?: string;
  name: string;
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: UserCreatedListItemInput[];
  recurringTemplates?: RecurringListTemplate[];
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
  const empty = { checkedById: {}, importedItems: [], recurringTemplates: [] };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value) as PersistedListState | Record<string, boolean> | null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return empty;
    }

    const maybeCheckedById = 'checkedById' in parsed ? parsed.checkedById : parsed;
    const maybeImportedItems = 'importedItems' in parsed ? parsed.importedItems : [];
    const maybeRecurringTemplates = 'recurringTemplates' in parsed ? parsed.recurringTemplates : [];

    const checkedById = maybeCheckedById && typeof maybeCheckedById === 'object' && !Array.isArray(maybeCheckedById)
      ? Object.fromEntries(
        Object.entries(maybeCheckedById)
          .filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
      )
      : {};

    const importedItems = Array.isArray(maybeImportedItems)
      ? maybeImportedItems.filter((item): item is UserCreatedListItemInput => (
        item !== null
        && typeof item === 'object'
        && (item.importSource === 'bulk-clipboard' || item.importSource === 'recurring-template')
        && typeof item.id === 'string'
        && typeof item.name === 'string'
        && typeof item.quantity === 'string'
        && typeof item.detail === 'string'
      ))
      : [];

    const recurringTemplates = Array.isArray(maybeRecurringTemplates)
      ? maybeRecurringTemplates.filter((template): template is RecurringListTemplate => (
        template !== null
        && typeof template === 'object'
        && typeof template.id === 'string'
        && typeof template.name === 'string'
        && (template.frequency === 'weekly' || template.frequency === 'biweekly')
        && typeof template.createdAt === 'string'
        && Array.isArray(template.items)
        && template.items.every((item) => (
          item !== null
          && typeof item === 'object'
          && typeof item.name === 'string'
          && typeof item.quantity === 'string'
          && typeof item.detail === 'string'
        ))
      ))
      : [];

    return { checkedById, importedItems, recurringTemplates };
  } catch {
    return empty;
  }
}

function withCheckedState(checkedById: Record<string, boolean>, importedItems: UserCreatedListItemInput[] = []): ShoppingListItem[] {
  const uniqueItems = new Map<string, Omit<ShoppingListItem, 'checked'>>();
  for (const item of baseListItems) uniqueItems.set(item.id, item);
  for (const item of importedItems) uniqueItems.set(item.id, item);

  return [...uniqueItems.values()].map((item) => ({
    ...item,
    checked: checkedById[item.id] === true
  }));
}

function persistCheckedState(items: ShoppingListItem[], recurringTemplates: RecurringListTemplate[]) {
  try {
    const checkedById = Object.fromEntries(items.map((item) => [item.id, item.checked]));
    const importedItems = items
      .filter((item) => item.importSource === 'bulk-clipboard' || item.importSource === 'recurring-template')
      .map((item) => ({
        detail: item.detail,
        id: item.id,
        importSource: item.importSource as 'bulk-clipboard' | 'recurring-template',
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: item.quantity
      }));
    localStorage.setItem(LIST_STORAGE_KEY, JSON.stringify({ checkedById, importedItems, recurringTemplates }));
  } catch {
    // Keep the check-off UI usable even when a browser blocks localStorage.
  }
}

function slugifyListPart(value: string) {
  return value
    .toLocaleLowerCase('sv-SE')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'item';
}

export function useList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringListTemplate[]>([]);
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);

  useEffect(() => {
    try {
      const { checkedById, importedItems, recurringTemplates: storedRecurringTemplates } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
      setItems(withCheckedState(checkedById, importedItems));
      setRecurringTemplates(storedRecurringTemplates);
    } finally {
      setHasLoadedBrowserState(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState) return;
    persistCheckedState(items, recurringTemplates);
  }, [hasLoadedBrowserState, items, recurringTemplates]);

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

  const saveRecurringTemplate = useCallback((name: string, frequency: RecurringListFrequency) => {
    const now = new Date().toISOString();
    const templateItems = items.map((item) => ({
      detail: item.detail,
      matchedProductName: item.matchedProductName,
      matchedProductSlug: item.matchedProductSlug,
      name: item.name,
      quantity: item.quantity
    }));
    const templateName = name.trim() || `${frequency === 'weekly' ? 'Weekly' : 'Biweekly'} shopping list`;

    setRecurringTemplates((currentTemplates) => [
      {
        createdAt: now,
        frequency,
        id: `recurring-template-${Date.now()}-${slugifyListPart(templateName)}`,
        items: templateItems,
        name: templateName
      },
      ...currentTemplates
    ]);
  }, [items]);

  const generateNextRecurringList = useCallback((templateId: string) => {
    const template = recurringTemplates.find((candidate) => candidate.id === templateId);
    if (!template) return;

    const now = new Date().toISOString();
    const generationId = Date.now();
    const generatedItems: ShoppingListItem[] = template.items.map((item, index) => ({
      ...item,
      checked: false,
      detail: `${item.detail} · Generated from ${template.frequency} recurring list`,
      id: `recurring-${template.id}-${generationId}-${index}-${slugifyListPart(item.name)}`,
      importSource: 'recurring-template'
    }));

    setItems((currentItems) => [...currentItems, ...generatedItems]);
    setRecurringTemplates((currentTemplates) => currentTemplates.map((candidate) => (
      candidate.id === templateId ? { ...candidate, lastGeneratedAt: now } : candidate
    )));
  }, [recurringTemplates]);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;

  return {
    addImportedItems,
    checkedCount,
    generateNextRecurringList,
    items,
    remainingCount,
    recurringTemplates,
    resetCheckedState,
    saveRecurringTemplate,
    toggleItemChecked,
    totalCount
  };
}
