export type HemkopProduct = {
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

type HemkopSearchProduct = {
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

type HemkopSearchResponse = {
  results?: HemkopSearchProduct[];
};

export const HEMKOP_SEARCH_BASE_URL = 'https://www.hemkop.se/search';

export const DEFAULT_HEMKOP_SEARCH_QUERIES = [
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

export type FetchHemkopProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildHemkopSearchUrl(query: string): string {
  const url = new URL(HEMKOP_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchHemkopProducts(options: FetchHemkopProductsOptions = {}): Promise<HemkopProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_HEMKOP_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? 75;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: HemkopProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildHemkopSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`Hemkop search request failed for ${query}: ${response.status}`);
    }

    const payload = await response.json() as HemkopSearchResponse;
    for (const product of payload.results ?? []) {
      const row = normalizeHemkopProduct(product, sourceUrl, retrievedAt);
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

export function normalizeHemkopProduct(
  product: HemkopSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): HemkopProduct | null {
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
