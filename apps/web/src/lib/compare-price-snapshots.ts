export const MAX_COMPARE_PRICE_SNAPSHOT_ITEMS = 4;

export type CompareItemIdsParam = string | string[] | null | undefined;

export type ComparePriceSnapshotStoreRow = {
  itemId: string;
  itemName: string;
  storeName: string;
  price: number | null;
  priceLabel: string;
  unitLabel: string;
  chainName?: string;
  packSizeLabel?: string;
  normalizedUnitPrice?: number | null;
  normalizedUnitPriceLabel?: string;
};

export type ComparePriceSnapshotOverlayOption = {
  key: string;
  itemId: string;
  itemName: string;
  label: string;
  storeName: string;
  packSizeLabel: string;
  price: number | null;
  priceLabel: string;
  unitLabel: string;
  basis: 'chain' | 'pack-size' | 'store-price';
};

export type ComparePriceSnapshotsResult = {
  itemIds: string[];
  storeRows: ComparePriceSnapshotStoreRow[];
  missingItemIds: string[];
  endpointUnavailable: boolean;
};

type FetchLike = (input: string, init?: { cache?: 'no-store' }) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

type StorePriceRowPayload = {
  itemId?: unknown;
  itemName?: unknown;
  storeName?: unknown;
  price?: unknown;
  priceLabel?: unknown;
  unitLabel?: unknown;
  chainName?: unknown;
  packSizeLabel?: unknown;
  normalizedUnitPrice?: unknown;
  normalizedUnitPriceLabel?: unknown;
};

type CompareItemPayload = {
  slug?: unknown;
  id?: unknown;
  name?: unknown;
  storePrices?: unknown;
};

export type FetchComparePriceSnapshotsOptions = {
  endpoint?: string;
  fetcher?: FetchLike;
  maxItems?: number;
};

function unique(values: string[]) {
  return [...new Set(values)];
}

export function parseCompareItemIdsParam(value: CompareItemIdsParam, maxItems = MAX_COMPARE_PRICE_SNAPSHOT_ITEMS) {
  const values = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];

  return unique(
    values
      .flatMap((entry) => entry.split(','))
      .map((entry) => entry.trim())
      .filter(Boolean)
  ).slice(0, Math.max(0, maxItems));
}

function endpointForItems(endpoint: string, itemIds: string[]) {
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}items=${encodeURIComponent(itemIds.join(','))}`;
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function overlayBasisFor(row: Pick<ComparePriceSnapshotStoreRow, 'chainName' | 'packSizeLabel' | 'storeName' | 'unitLabel'>): ComparePriceSnapshotOverlayOption['basis'] {
  if (row.chainName && row.chainName !== row.storeName) return 'chain';
  if (row.packSizeLabel && row.packSizeLabel !== row.unitLabel) return 'pack-size';
  return 'store-price';
}

export function comparePriceSnapshotOverlayOptions(storeRows: ComparePriceSnapshotStoreRow[], maxItems = 2): ComparePriceSnapshotOverlayOption[] {
  return storeRows
    .filter((row) => row.price !== null || (row.normalizedUnitPrice !== undefined && row.normalizedUnitPrice !== null))
    .map((row) => {
      const price = row.normalizedUnitPrice ?? row.price;
      const priceLabel = row.normalizedUnitPriceLabel ?? row.priceLabel;
      const packSizeLabel = row.packSizeLabel ?? row.unitLabel;
      const label = `${row.chainName ?? row.storeName} · ${packSizeLabel}`;

      return {
        key: `${row.itemId}-${row.storeName}-${packSizeLabel}`,
        itemId: row.itemId,
        itemName: row.itemName,
        label,
        storeName: row.chainName ?? row.storeName,
        packSizeLabel,
        price,
        priceLabel,
        unitLabel: row.unitLabel,
        basis: overlayBasisFor(row)
      };
    })
    .sort((left, right) => {
      if (left.price === null && right.price === null) return left.label.localeCompare(right.label);
      if (left.price === null) return 1;
      if (right.price === null) return -1;
      return left.price - right.price;
    })
    .slice(0, Math.max(0, maxItems));
}

function fallbackResult(itemIds: string[]): ComparePriceSnapshotsResult {
  return {
    itemIds,
    storeRows: [],
    missingItemIds: itemIds,
    endpointUnavailable: true
  };
}

function itemPayloads(payload: unknown): CompareItemPayload[] {
  if (!payload || typeof payload !== 'object' || !('items' in payload)) return [];
  const items = (payload as { items?: unknown }).items;
  return Array.isArray(items) ? items.filter((item): item is CompareItemPayload => item !== null && typeof item === 'object') : [];
}

function missingIdsFromPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('missingItemIds' in payload)) return [];
  const missingItemIds = (payload as { missingItemIds?: unknown }).missingItemIds;
  return Array.isArray(missingItemIds) ? missingItemIds.filter((item): item is string => typeof item === 'string') : [];
}

function directStoreRowsFromPayload(payload: unknown): ComparePriceSnapshotStoreRow[] {
  if (!payload || typeof payload !== 'object' || !('storeRows' in payload)) return [];
  const storeRows = (payload as { storeRows?: unknown }).storeRows;
  if (!Array.isArray(storeRows)) return [];

  return storeRows
    .filter((row): row is StorePriceRowPayload => row !== null && typeof row === 'object')
    .map((row) => {
      const itemId = stringOrFallback(row.itemId, 'unknown-item');
      const storeName = stringOrFallback(row.storeName, 'Unknown store');
      const unitLabel = stringOrFallback(row.unitLabel, 'Unit unavailable');
      return {
        itemId,
        itemName: stringOrFallback(row.itemName, itemId),
        storeName,
        price: numberOrNull(row.price),
        priceLabel: stringOrFallback(row.priceLabel, 'Price unavailable'),
        unitLabel,
        chainName: stringOrFallback(row.chainName, storeName),
        packSizeLabel: stringOrFallback(row.packSizeLabel, unitLabel),
        normalizedUnitPrice: numberOrNull(row.normalizedUnitPrice),
        normalizedUnitPriceLabel: stringOrFallback(row.normalizedUnitPriceLabel, '') || undefined
      };
    });
}

function nestedStoreRowsFromPayload(payload: unknown): ComparePriceSnapshotStoreRow[] {
  return itemPayloads(payload).flatMap((item) => {
    const itemId = stringOrFallback(item.slug, stringOrFallback(item.id, 'unknown-item'));
    const itemName = stringOrFallback(item.name, itemId);
    const storePrices = Array.isArray(item.storePrices) ? item.storePrices : [];

    return storePrices
      .filter((row): row is StorePriceRowPayload => row !== null && typeof row === 'object')
      .map((row) => {
        const storeName = stringOrFallback(row.storeName, 'Unknown store');
        const unitLabel = stringOrFallback(row.unitLabel, 'Unit unavailable');
        return {
          itemId,
          itemName,
          storeName,
          price: numberOrNull(row.price),
          priceLabel: stringOrFallback(row.priceLabel, 'Price unavailable'),
          unitLabel,
          chainName: stringOrFallback(row.chainName, storeName),
          packSizeLabel: stringOrFallback(row.packSizeLabel, unitLabel),
          normalizedUnitPrice: numberOrNull(row.normalizedUnitPrice),
          normalizedUnitPriceLabel: stringOrFallback(row.normalizedUnitPriceLabel, '') || undefined
        };
      });
  });
}

function storeRowsFromPayload(payload: unknown): ComparePriceSnapshotStoreRow[] {
  return [...directStoreRowsFromPayload(payload), ...nestedStoreRowsFromPayload(payload)];
}

function matchedIdsFromPayload(payload: unknown, storeRows: ComparePriceSnapshotStoreRow[]) {
  return new Set([
    ...storeRows.map((row) => row.itemId),
    ...itemPayloads(payload).map((item) => stringOrFallback(item.slug, stringOrFallback(item.id, 'unknown-item')))
  ]);
}

export async function fetchComparePriceSnapshots(
  value: CompareItemIdsParam,
  options: FetchComparePriceSnapshotsOptions = {}
): Promise<ComparePriceSnapshotsResult> {
  const itemIds = parseCompareItemIdsParam(value, options.maxItems);
  if (itemIds.length === 0) {
    return {
      itemIds,
      storeRows: [],
      missingItemIds: [],
      endpointUnavailable: false
    };
  }

  const fetcher = options.fetcher ?? globalThis.fetch?.bind(globalThis);
  if (!fetcher) return fallbackResult(itemIds);

  try {
    const response = await fetcher(endpointForItems(options.endpoint ?? '/api/compare/items', itemIds), { cache: 'no-store' });
    if (!response.ok) return fallbackResult(itemIds);

    const payload = await response.json();
    const storeRows = storeRowsFromPayload(payload);
    const matchedItemIds = matchedIdsFromPayload(payload, storeRows);

    return {
      itemIds,
      storeRows,
      missingItemIds: unique([
        ...missingIdsFromPayload(payload),
        ...itemIds.filter((itemId) => !matchedItemIds.has(itemId))
      ]),
      endpointUnavailable: false
    };
  } catch {
    return fallbackResult(itemIds);
  }
}
