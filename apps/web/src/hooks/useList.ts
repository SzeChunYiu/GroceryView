'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { queueListMutation, saveListOfflineSnapshot, subscribeToListOfflineSync, type ListOfflineSyncState } from '@/lib/offline-sync';

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

export type ShareLinkState = {
  error: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  isValid: boolean;
  token: string;
};

type PersistedListState = {
  checkedById?: Record<string, boolean>;
  importedItems?: BulkImportedListItemInput[];
};

type SignedSharePayload = {
  expiresAt?: string | null;
  listId?: string;
};

export const LIST_STORAGE_KEY = 'groceryview:shopping-list:checked:v1';
const LIST_SHARE_PUBLIC_SECRET = process.env.NEXT_PUBLIC_LIST_SHARE_SECRET || 'local-list-share-development-secret';

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
    return { token, expiresAt: null, isExpired: false, isValid: false, error: 'Invalid read-only list link signature.' };
  }

  const expectedSignature = await hmacSignature(encodedPayload);
  if (signature !== expectedSignature) {
    return { token, expiresAt: null, isExpired: false, isValid: false, error: 'Invalid read-only list link signature.' };
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SignedSharePayload;
  const expiresAt = typeof payload.expiresAt === 'string' ? payload.expiresAt : null;
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : Number.POSITIVE_INFINITY;
  const isExpired = Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();

  return {
    token,
    expiresAt,
    isExpired,
    isValid: !isExpired,
    error: isExpired ? 'This read-only shopping list link has expired.' : null
  };
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
  const [shareLink, setShareLink] = useState<ShareLinkState | null>(null);
  const [offlineSync, setOfflineSync] = useState<ListOfflineSyncState>({ isOnline: true, pendingCount: 0, lastReplayedAt: null });

  useEffect(() => {
    let cancelled = false;

    async function loadBrowserState() {
      try {
        const { checkedById, importedItems } = listStateFromStorage(localStorage.getItem(LIST_STORAGE_KEY));
        const token = new URLSearchParams(window.location.search).get('share');
        if (token) {
          const verifiedShare = await verifyShareToken(token);
          if (!cancelled) setShareLink(verifiedShare);
          if (!verifiedShare.isValid) return;
        }
        if (!cancelled) setItems(withCheckedState(checkedById, importedItems));
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
    saveListOfflineSnapshot(items);
  }, [hasLoadedBrowserState, items, shareLink?.isValid]);

  useEffect(() => subscribeToListOfflineSync(setOfflineSync), []);

  const toggleItemChecked = useCallback((itemId: string) => {
    if (!navigator.onLine) queueListMutation({ type: 'toggle-item', itemId });
    setItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )));
  }, []);

  const resetCheckedState = useCallback(() => {
    if (!navigator.onLine) queueListMutation({ type: 'reset-checked' });
    setItems((currentItems) => currentItems.map((item) => ({ ...item, checked: false })));
  }, []);

  const addImportedItems = useCallback((importedItems: BulkImportedListItemInput[]) => {
    if (!navigator.onLine) queueListMutation({ type: 'bulk-import', items: importedItems });
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

  return {
    addImportedItems,
    checkedCount,
    items,
    remainingCount,
    offlineSync,
    resetCheckedState,
    shareLink,
    toggleItemChecked,
    totalCount
  };
}
