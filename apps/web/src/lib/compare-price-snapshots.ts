export const MAX_COMPARE_PRICE_SNAPSHOT_ITEMS = 4;

export type CompareItemIdsParam = string | string[] | null | undefined;

export type ComparePriceSnapshotStoreRow = {
  itemId: string;
  itemName: string;
  storeName: string;
  price: number | null;
  priceLabel: string;
  unitLabel: string;
  historyPoints?: ComparePriceSnapshotHistoryPoint[];
};

export type ComparePriceSnapshotHistoryPoint = {
  date: string;
  price: number;
  priceLabel: string;
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
  historyPoints?: unknown;
  priceHistory?: unknown;
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

function historyPointsFromPayload(value: unknown): ComparePriceSnapshotHistoryPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((point): point is { date?: unknown; time?: unknown; price?: unknown; value?: unknown; priceLabel?: unknown } => point !== null && typeof point === 'object')
    .map((point) => {
      const price = numberOrNull(point.price) ?? numberOrNull(point.value);
      const date = stringOrFallback(point.date, stringOrFallback(point.time, ''));
      if (!date || price === null) return null;
      return {
        date,
        price,
        priceLabel: stringOrFallback(point.priceLabel, `${price.toLocaleString('sv-SE')} kr`)
      };
    })
    .filter((point): point is ComparePriceSnapshotHistoryPoint => point !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12);
}

export function buildComparePriceSnapshotSparkline(points: readonly ComparePriceSnapshotHistoryPoint[], width = 140, height = 36) {
  if (points.length < 2) return '';
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
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
      const historyPoints = historyPointsFromPayload(row.historyPoints ?? row.priceHistory);
      return {
        itemId,
        itemName: stringOrFallback(row.itemName, itemId),
        storeName: stringOrFallback(row.storeName, 'Unknown store'),
        price: numberOrNull(row.price),
        priceLabel: stringOrFallback(row.priceLabel, 'Price unavailable'),
        unitLabel: stringOrFallback(row.unitLabel, 'Unit unavailable'),
        ...(historyPoints.length > 0 ? { historyPoints } : {})
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
        const historyPoints = historyPointsFromPayload(row.historyPoints ?? row.priceHistory);
        return {
          itemId,
          itemName,
          storeName: stringOrFallback(row.storeName, 'Unknown store'),
          price: numberOrNull(row.price),
          priceLabel: stringOrFallback(row.priceLabel, 'Price unavailable'),
          unitLabel: stringOrFallback(row.unitLabel, 'Unit unavailable'),
          ...(historyPoints.length > 0 ? { historyPoints } : {})
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
