export type WillysProduct = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  unitPriceUnit: string;
  imageUrl: string;
  labels: string[];
  online: boolean;
  outOfStock: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

type WillysSearchProduct = {
  code?: unknown;
  name?: unknown;
  manufacturer?: unknown;
  productLine2?: unknown;
  pickupProductLine2?: unknown;
  googleAnalyticsCategory?: unknown;
  priceValue?: unknown;
  price?: unknown;
  comparePrice?: unknown;
  comparePriceUnit?: unknown;
  image?: { url?: unknown };
  labels?: unknown;
  online?: unknown;
  outOfStock?: unknown;
};

type WillysSearchResponse = {
  results?: WillysSearchProduct[];
};

export const WILLYS_SEARCH_BASE_URL = 'https://www.willys.se/search';

export const DEFAULT_WILLYS_SEARCH_QUERIES = [
  'makaroner',
  'mjolk',
  'kaffe',
  'ris',
  'pasta',
  'yoghurt',
  'brod',
  'ost',
  'agg',
  'smor',
  'potatis',
  'banan',
  'kyckling',
  'ketchup',
  'havregryn'
] as const;

export type FetchWillysProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildWillysSearchUrl(query: string): string {
  const url = new URL(WILLYS_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchWillysProducts(options: FetchWillysProductsOptions = {}): Promise<WillysProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_WILLYS_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? 75;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: WillysProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildWillysSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`Willys search request failed for ${query}: ${response.status}`);
    }

    const payload = await response.json() as WillysSearchResponse;
    for (const product of payload.results ?? []) {
      const row = normalizeWillysProduct(product, sourceUrl, retrievedAt);
      if (!row || seenCodes.has(row.code)) {
        continue;
      }
      seenCodes.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export function normalizeWillysProduct(
  product: WillysSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): WillysProduct | null {
  const code = text(product.code);
  const name = text(product.name);
  const price = numberOrNull(product.priceValue);
  if (!code || !name || price === null) {
    return null;
  }

  return {
    code,
    name,
    brand: text(product.manufacturer),
    packageText: text(product.productLine2) || text(product.pickupProductLine2),
    category: text(product.googleAnalyticsCategory),
    price,
    priceText: text(product.price),
    unitPriceText: text(product.comparePrice),
    unitPriceUnit: text(product.comparePriceUnit),
    imageUrl: text(product.image?.url),
    labels: stringArray(product.labels),
    online: product.online === true,
    outOfStock: product.outOfStock === true,
    sourceUrl,
    retrievedAt
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
