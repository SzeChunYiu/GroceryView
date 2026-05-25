'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { parseMealPlanShoppingListExport } from '@/lib/meal-budgets';

export type ShoppingListItem = {
  checked: boolean;
  detail: string;
  id: string;
  importSource?: 'starter' | 'bulk-clipboard' | 'item-detail' | 'meal-plan';
  matchedProductName?: string;
  matchedProductSlug?: string;
  name: string;
  quantity: string;
};

export type BulkImportedListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'bulk-clipboard';
};

export type ProductListItemInput = Omit<ShoppingListItem, 'checked' | 'id' | 'importSource' | 'matchedProductName' | 'matchedProductSlug'> & {
  productId: string;
};

export type MealPlanListItemInput = Omit<ShoppingListItem, 'checked'> & {
  importSource: 'meal-plan';
};

type PersistedCustomListItemInput = BulkImportedListItemInput | MealPlanListItemInput | (Omit<ShoppingListItem, 'checked'> & {
  importSource: 'item-detail';
});

export type ShareLinkState = {
  error: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isValid: boolean;
  sharedItems: PersistedCustomListItemInput[];
  token: string;
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: PersistedCustomListItemInput[];
};

type SignedSharePayload = {
  expiresAt?: string | null;
  items?: PersistedCustomListItemInput[];
  listId?: string;
};

export type OfflineSavedListSnapshot = {
  checkedCount: number;
  items: ShoppingListItem[];
  lastSeenPriceEstimates: Record<string, OfflineSavedListPriceEstimate>;
  remainingCount: number;
  routes: string[];
  savedAt: string;
  syncStatus: 'synced' | 'pending';
  totalCount: number;
};

export type OfflineSavedListPriceEstimate = {
  itemId: string;
  label: string;
  matchedProductSlug?: string;
  observedAt: string;
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';
export const OFFLINE_SAVED_LIST_STORAGE_KEY = 'groceryview:offline-saved-list:v1';
export const OFFLINE_SAVED_LIST_SYNC_QUEUE_KEY = 'groceryview:offline-saved-list-sync-queue:v1';
export const OFFLINE_SAVED_LIST_UPDATED_EVENT = 'groceryview:offline-saved-list-updated';
export const OFFLINE_SAVED_LIST_SYNCED_EVENT = 'groceryview:offline-saved-list-synced';
const OFFLINE_SAVED_LIST_ROUTE_CACHE_NAME = 'groceryview-shopping-list-route-v1';
const OFFLINE_SAVED_LIST_BASE_ROUTES = ['/list', '/favourites'];
const OFFLINE_SAVED_LIST_MAX_ROUTES = 16;
const LIST_SHARE_PUBLIC_SECRET = process.env.NEXT_PUBLIC_LIST_SHARE_SECRET || 'local-list-share-development-secret';

export const BUDGET_HISTORY_STORAGE_KEY = 'groceryview:shopping-list:budget-history:v1';
export const BUDGET_HISTORY_SAVE_DELAY_MS = 400;

export type BudgetHistorySnapshot = {
  checkedCount: number;
  remainingCount: number;
  savedAt: string;
  total: number;
  totalCount: number;
};

export function budgetSnapshotSignature(snapshot: Pick<BudgetHistorySnapshot, 'checkedCount' | 'remainingCount' | 'total' | 'totalCount'>) {
  return [snapshot.total, snapshot.checkedCount, snapshot.totalCount, snapshot.remainingCount].join(':');
}

function budgetHistoryFromStorage(value: string | null): BudgetHistorySnapshot[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as BudgetHistorySnapshot[] | null;
    return Array.isArray(parsed)
      ? parsed.filter((snapshot): snapshot is BudgetHistorySnapshot => (
        snapshot !== null
        && typeof snapshot === 'object'
        && typeof snapshot.checkedCount === 'number'
        && typeof snapshot.remainingCount === 'number'
        && typeof snapshot.savedAt === 'string'
        && typeof snapshot.total === 'number'
        && typeof snapshot.totalCount === 'number'
      ))
      : [];
  } catch {
    return [];
  }
}

export function appendBudgetSnapshotIfChanged(history: BudgetHistorySnapshot[], nextSnapshot: BudgetHistorySnapshot) {
  const lastSnapshot = history[history.length - 1];
  if (!lastSnapshot) return [nextSnapshot];
  if (budgetSnapshotSignature(lastSnapshot) === budgetSnapshotSignature(nextSnapshot)) return history;
  if (lastSnapshot.total === nextSnapshot.total) return history;

  return [...history, nextSnapshot];
}

function persistBudgetSnapshot(nextSnapshot: BudgetHistorySnapshot) {
  try {
    const history = budgetHistoryFromStorage(localStorage.getItem(BUDGET_HISTORY_STORAGE_KEY));
    const nextHistory = appendBudgetSnapshotIfChanged(history, nextSnapshot);
    if (nextHistory !== history) {
      localStorage.setItem(BUDGET_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    }
  } catch {
    // Keep the list UI usable even if budget history persistence is unavailable.
  }
}

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
      ? maybeImportedItems.filter((item): item is PersistedCustomListItemInput => (
        item !== null
        && typeof item === 'object'
        && (item.importSource === 'bulk-clipboard' || item.importSource === 'item-detail' || item.importSource === 'meal-plan')
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

function mealPlanItemsFromSearchParam(value: string): MealPlanListItemInput[] {
  const mealPlanExport = parseMealPlanShoppingListExport(value);
  if (!mealPlanExport) return [];

  return mealPlanExport.items.map((item) => ({
    detail: item.detail,
    id: item.id,
    importSource: 'meal-plan',
    matchedProductName: item.name,
    matchedProductSlug: item.productId,
    name: item.name,
    quantity: item.quantity
  }));
}

function withCheckedState(checkedById: Record<string, boolean>, importedItems: PersistedCustomListItemInput[] = []): ShoppingListItem[] {
  const uniqueItems = new Map<string, Omit<ShoppingListItem, 'checked'>>();
  for (const item of baseListItems) uniqueItems.set(item.id, item);
  for (const item of importedItems) uniqueItems.set(item.id, item);

  return [...uniqueItems.values()].map((item) => ({
    ...item,
    checked: checkedById[item.id] === true
  }));
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
}

function encodeSignature(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmacSignature(encodedPayload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(LIST_SHARE_PUBLIC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encodedPayload));
  return encodeSignature(signature);
}

async function verifyShareToken(token: string): Promise<ShareLinkState> {
  const [encodedPayload, signature, extra] = token.split('.');
  if (!encodedPayload || !signature || extra !== undefined) {
    return { token, expiresAt: null, isExpired: false, isValid: false, sharedItems: [], error: 'Invalid read-only list link signature.' };
  }

  const expectedSignature = await hmacSignature(encodedPayload);
  if (signature !== expectedSignature) {
    return { token, expiresAt: null, isExpired: false, isValid: false, sharedItems: [], error: 'Invalid read-only list link signature.' };
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SignedSharePayload;
  const expiresAt = typeof payload.expiresAt === 'string' ? payload.expiresAt : null;
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : Number.POSITIVE_INFINITY;
  const isExpired = Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();

  const sharedItems = Array.isArray(payload.items)
    ? payload.items.filter((item): item is PersistedCustomListItemInput => (
      item !== null
      && typeof item === 'object'
      && (item.importSource === 'bulk-clipboard' || item.importSource === 'item-detail' || item.importSource === 'meal-plan')
      && typeof item.id === 'string'
      && typeof item.name === 'string'
      && typeof item.quantity === 'string'
      && typeof item.detail === 'string'
    ))
    : [];

  return {
    token,
    expiresAt,
    isExpired,
    isValid: !isExpired,
    sharedItems,
    error: isExpired ? 'This read-only shopping list link has expired.' : null
  };
}

function persistCheckedState(items: ShoppingListItem[]) {
  try {
    const checkedById = Object.fromEntries(items.map((item) => [item.id, item.checked]));
    const importedItems = items
      .filter((item) => item.importSource === 'bulk-clipboard')
      .concat(items.filter((item) => item.importSource === 'item-detail'))
      .concat(items.filter((item) => item.importSource === 'meal-plan'))
      .map((item) => ({
        detail: item.detail,
        id: item.id,
        importSource: item.importSource,
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

function productListItemId(productId: string): string {
  return `product:${productId.trim().toLowerCase()}`;
}

function productRouteForOffline(slug: string) {
  const trimmedSlug = slug.trim();
  return trimmedSlug ? `/products/${encodeURIComponent(trimmedSlug)}` : null;
}

export function offlineSavedListRoutesForItems(items: ShoppingListItem[]) {
  const routes = new Set(OFFLINE_SAVED_LIST_BASE_ROUTES);
  for (const item of items) {
    const route = item.matchedProductSlug ? productRouteForOffline(item.matchedProductSlug) : null;
    if (route) routes.add(route);
  }

  return [...routes].slice(0, OFFLINE_SAVED_LIST_MAX_ROUTES);
}

function lastSeenPriceEstimatesForItems(items: ShoppingListItem[], observedAt: string): Record<string, OfflineSavedListPriceEstimate> {
  return Object.fromEntries(items.map((item) => [
    item.id,
    {
      itemId: item.id,
      label: item.matchedProductName
        ? `Last seen estimate cached for ${item.matchedProductName}`
        : 'No verified price estimate cached for this custom item yet',
      matchedProductSlug: item.matchedProductSlug,
      observedAt
    }
  ]));
}

function enqueueOfflineSavedListSync(snapshot: OfflineSavedListSnapshot) {
  if (navigator.onLine) return;

  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_SAVED_LIST_SYNC_QUEUE_KEY) || '[]') as OfflineSavedListSnapshot[] | null;
    const queue = Array.isArray(parsed) ? parsed : [];
    localStorage.setItem(OFFLINE_SAVED_LIST_SYNC_QUEUE_KEY, JSON.stringify([...queue.slice(-4), snapshot]));
  } catch {
    // Sync queue is best-effort; the latest snapshot remains in localStorage.
  }
}

function flushOfflineSavedListSyncQueue() {
  if (!navigator.onLine) return;

  try {
    const rawQueue = localStorage.getItem(OFFLINE_SAVED_LIST_SYNC_QUEUE_KEY);
    if (!rawQueue) return;
    localStorage.removeItem(OFFLINE_SAVED_LIST_SYNC_QUEUE_KEY);
    window.dispatchEvent(new CustomEvent(OFFLINE_SAVED_LIST_SYNCED_EVENT, { detail: JSON.parse(rawQueue) }));
  } catch {
    // Leave the UI usable even if sync metadata is malformed.
  }
}

function persistOfflineSavedListSnapshot(items: ShoppingListItem[]) {
  const checkedCount = items.filter((item) => item.checked).length;
  const savedAt = new Date().toISOString();
  const snapshot: OfflineSavedListSnapshot = {
    checkedCount,
    items,
    lastSeenPriceEstimates: lastSeenPriceEstimatesForItems(items, savedAt),
    remainingCount: items.length - checkedCount,
    routes: offlineSavedListRoutesForItems(items),
    savedAt,
    syncStatus: navigator.onLine ? 'synced' : 'pending',
    totalCount: items.length
  };

  try {
    localStorage.setItem(OFFLINE_SAVED_LIST_STORAGE_KEY, JSON.stringify(snapshot));
    enqueueOfflineSavedListSync(snapshot);
    window.dispatchEvent(new CustomEvent(OFFLINE_SAVED_LIST_UPDATED_EVENT, { detail: snapshot }));
  } catch {
    // Offline snapshots are a progressive enhancement; checked-item persistence remains authoritative.
  }
}

async function warmOfflineSavedListCompanions(items: ShoppingListItem[]) {
  if (typeof window === 'undefined' || !('caches' in window) || !navigator.onLine) return;

  try {
    const cache = await caches.open(OFFLINE_SAVED_LIST_ROUTE_CACHE_NAME);
    await Promise.allSettled(offlineSavedListRoutesForItems(items).map((route) => cache.add(route)));
  } catch {
    // Keep list interactions responsive even when Cache Storage is unavailable.
  }
}

export function useList() {
  const [items, setItems] = useState<ShoppingListItem[]>(() => withCheckedState({}));
  const [hasLoadedBrowserState, setHasLoadedBrowserState] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLinkState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBrowserState() {
      try {
        const { checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
        const params = new URLSearchParams(window.location.search);
        const token = params.get('share');
        if (token) {
          const verifiedShare = await verifyShareToken(token);
          if (!cancelled) setShareLink(verifiedShare);
          if (!verifiedShare.isValid) return;
          if (verifiedShare.sharedItems.length > 0) {
            if (!cancelled) setItems(withCheckedState({}, verifiedShare.sharedItems));
            return;
          }
        }
        const mealPlanItems = mealPlanItemsFromSearchParam(params.get('mealPlan') ?? '');
        if (!cancelled) setItems(withCheckedState(checkedById, [...importedItems, ...mealPlanItems]));
      } finally {
        if (!cancelled) setHasLoadedBrowserState(true);
      }
    }

    void loadBrowserState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedBrowserState || shareLink?.isValid) return;
    persistCheckedState(items);
    persistOfflineSavedListSnapshot(items);
    void warmOfflineSavedListCompanions(items);
    flushOfflineSavedListSyncQueue();
  }, [hasLoadedBrowserState, items, shareLink?.isValid]);

  useEffect(() => {
    if (!hasLoadedBrowserState) return undefined;
    window.addEventListener('online', flushOfflineSavedListSyncQueue);
    return () => window.removeEventListener('online', flushOfflineSavedListSyncQueue);
  }, [hasLoadedBrowserState]);

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

  const addProductItem = useCallback((input: ProductListItemInput) => {
    const item: PersistedCustomListItemInput = {
      detail: input.detail,
      id: productListItemId(input.productId),
      importSource: 'item-detail',
      matchedProductName: input.name,
      matchedProductSlug: input.productId,
      name: input.name,
      quantity: input.quantity
    };
    const alreadyOnList = items.some((currentItem) => currentItem.id === item.id);
    if (!alreadyOnList) {
      setItems((currentItems) => (
        currentItems.some((currentItem) => currentItem.id === item.id)
          ? currentItems
          : [...currentItems, { ...item, checked: false }]
      ));
    }
    return { added: !alreadyOnList, item };
  }, [items]);

  const checkedCount = useMemo(() => items.filter((item) => item.checked).length, [items]);
  const totalCount = items.length;
  const remainingCount = totalCount - checkedCount;
  const budgetSnapshot = useMemo(() => ({
    checkedCount,
    remainingCount,
    total: totalCount,
    totalCount
  }), [checkedCount, remainingCount, totalCount]);

  useEffect(() => {
    if (!hasLoadedBrowserState) return undefined;

    const timeoutId = window.setTimeout(() => {
      persistBudgetSnapshot({
        ...budgetSnapshot,
        savedAt: new Date().toISOString()
      });
    }, BUDGET_HISTORY_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [budgetSnapshot, hasLoadedBrowserState]);

  return {
    addProductItem,
    addImportedItems,
    checkedCount,
    hasLoadedBrowserState,
    items,
    remainingCount,
    resetCheckedState,
    shareLink,
    toggleItemChecked,
    totalCount
  };
}
