import type { BulkImportedListItemInput, ShoppingListItem } from '@/hooks/useList';

export const SHOPPING_LIST_SHARE_PARAM = 'share';

type ShareListPayload = {
  v: 1;
  items: Array<Pick<ShoppingListItem, 'detail' | 'id' | 'matchedProductName' | 'matchedProductSlug' | 'name' | 'quantity'>>;
};

const maxShareItems = 100;

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeShareItem(item: unknown): BulkImportedListItemInput | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const candidate = item as Record<string, unknown>;
  const id = cleanString(candidate.id);
  const name = cleanString(candidate.name);
  const quantity = cleanString(candidate.quantity);
  const detail = cleanString(candidate.detail);
  if (!id || !name || !quantity || !detail) return null;
  const matchedProductName = cleanString(candidate.matchedProductName);
  const matchedProductSlug = cleanString(candidate.matchedProductSlug);
  return {
    detail,
    id,
    importSource: 'bulk-clipboard',
    ...(matchedProductName ? { matchedProductName } : {}),
    ...(matchedProductSlug ? { matchedProductSlug } : {}),
    name,
    quantity
  };
}

export function encodeShoppingListShare(items: ShoppingListItem[]) {
  const payload: ShareListPayload = {
    v: 1,
    items: items.slice(0, maxShareItems).map((item) => ({
      detail: item.detail,
      id: item.id,
      matchedProductName: item.matchedProductName,
      matchedProductSlug: item.matchedProductSlug,
      name: item.name,
      quantity: item.quantity
    }))
  };
  return toBase64Url(JSON.stringify(payload));
}

export function decodeShoppingListShare(encoded: string): BulkImportedListItemInput[] {
  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as Partial<ShareListPayload> | null;
    if (!payload || payload.v !== 1 || !Array.isArray(payload.items)) return [];
    return payload.items.slice(0, maxShareItems).map(normalizeShareItem).filter((item): item is BulkImportedListItemInput => item !== null);
  } catch {
    return [];
  }
}

export function buildShoppingListShareUrl(items: ShoppingListItem[], origin = window.location.origin) {
  const url = new URL('/list', origin);
  url.searchParams.set(SHOPPING_LIST_SHARE_PARAM, encodeShoppingListShare(items));
  return url.toString();
}
