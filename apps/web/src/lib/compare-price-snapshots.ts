export type ComparePriceSnapshot = {
  requestedItemId: string;
  productId: string;
  productSlug: string;
  productName: string;
  storeId: string;
  storeSlug: string | null;
  storeName: string | null;
  chainId: string | null;
  chainSlug: string | null;
  chainName: string | null;
  observationId: string | null;
  price: number;
  regularPrice: number | null;
  unitPrice: number | null;
  currency: string | null;
  priceType: string | null;
  observedAt: string | null;
  confidence: number | null;
  isAvailable: boolean;
};

export type ComparePriceSnapshotsReport = {
  itemIds: string[];
  stores: Record<string, Record<string, ComparePriceSnapshot>>;
  missingItemIds: string[];
};

export type ComparePriceSnapshotsState = ComparePriceSnapshotsReport & {
  storeRows: Array<{
    storeId: string;
    storeName: string;
    chainName: string;
    snapshots: Record<string, ComparePriceSnapshot>;
  }>;
  sourceLabel: string;
  error: string | null;
};

const maxCompareItems = 4;

function normalizeCompareId(value: string): string {
  return value.trim().toLowerCase();
}

export function parseCompareItemIdsParam(input: string | string[] | null | undefined): string[] {
  const itemIdsParam = Array.isArray(input) ? input.join(',') : (input ?? '');
  const seen = new Set<string>();
  return itemIdsParam.split(',')
    .map(normalizeCompareId)
    .filter((value) => value.length > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, maxCompareItems);
}

function apiBaseUrl(): string | null {
  const configured = process.env.GROCERYVIEW_API_BASE_URL ?? process.env.NEXT_PUBLIC_GROCERYVIEW_API_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
}

function emptyState(itemIds: string[], sourceLabel: string, error: string | null): ComparePriceSnapshotsState {
  return {
    itemIds,
    stores: {},
    missingItemIds: itemIds,
    storeRows: [],
    sourceLabel,
    error
  };
}

function compareEndpointUrl(itemIds: string[]): URL | null {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) return null;
  const url = new URL('/api/compare', baseUrl);
  url.searchParams.set('itemIds', itemIds.join(','));
  return url;
}

function toStoreRows(stores: ComparePriceSnapshotsReport['stores']): ComparePriceSnapshotsState['storeRows'] {
  return Object.entries(stores)
    .map(([storeId, snapshots]) => {
      const firstSnapshot = Object.values(snapshots)[0];
      return {
        storeId,
        storeName: firstSnapshot?.storeName ?? firstSnapshot?.storeSlug ?? storeId,
        chainName: firstSnapshot?.chainName ?? firstSnapshot?.chainSlug ?? 'Unknown chain',
        snapshots
      };
    })
    .sort((left, right) => left.storeName.localeCompare(right.storeName, 'sv-SE'));
}

export async function fetchComparePriceSnapshots(itemIds: string[]): Promise<ComparePriceSnapshotsState> {
  if (itemIds.length === 0) {
    return emptyState([], 'GET /api/compare?itemIds=...', null);
  }

  const endpoint = compareEndpointUrl(itemIds);
  if (!endpoint) {
    return emptyState(itemIds, 'GET /api/compare?itemIds=... (GROCERYVIEW_API_BASE_URL not configured)', 'compare_api_base_url_missing');
  }

  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) {
      return emptyState(itemIds, `GET /api/compare?itemIds=... (${response.status})`, 'compare_api_request_failed');
    }

    const report = await response.json() as ComparePriceSnapshotsReport;
    return {
      itemIds: report.itemIds,
      stores: report.stores,
      missingItemIds: report.missingItemIds,
      storeRows: toStoreRows(report.stores),
      sourceLabel: 'GET /api/compare?itemIds=... store-level latest price snapshots',
      error: null
    };
  } catch {
    return emptyState(itemIds, 'GET /api/compare?itemIds=... (request failed)', 'compare_api_request_failed');
  }
}
