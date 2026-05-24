export type KronanIsProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: 'ISK';
  country: 'IS';
  unitPrice: number | null;
  unitPriceUnit: string;
  priceInfo: string;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  headers?: { get(name: string): string | null };
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}>;

type KronanApiProduct = {
  id?: unknown;
  sku?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  price?: unknown;
  currentPrice?: unknown;
  discountedPrice?: unknown;
  unitPrice?: unknown;
  unitPriceUnit?: unknown;
  pricePerKiloDisplay?: unknown;
  baseComparisonUnit?: unknown;
  priceInfo?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  thumbnail?: unknown;
  slug?: unknown;
};

export const KRONAN_IS_PRODUCTS_URL = 'https://www.kronan.is/snjallverslun/voruflokkar';
const KRONAN_IS_PRODUCT_BASE_URL = 'https://www.kronan.is/snjallverslun/vara/';

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function categoryName(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') return text((value as { name?: unknown }).name);
  return '';
}

function productArray(payload: unknown): KronanApiProduct[] {
  if (Array.isArray(payload)) return payload as KronanApiProduct[];
  if (payload && typeof payload === 'object') {
    const record = payload as { products?: unknown; data?: unknown; items?: unknown; marketingCollection?: { products?: unknown } };
    if (Array.isArray(record.products)) return record.products as KronanApiProduct[];
    if (Array.isArray(record.data)) return record.data as KronanApiProduct[];
    if (Array.isArray(record.items)) return record.items as KronanApiProduct[];
    if (Array.isArray(record.marketingCollection?.products)) return record.marketingCollection.products as KronanApiProduct[];
  }
  return [];
}

function extractFlightStrings(html: string): string {
  const parts: string[] = [];
  const marker = 'self.__next_f.push([1,"';
  let index = 0;
  while (index < html.length) {
    const markerIndex = html.indexOf(marker, index);
    if (markerIndex === -1) break;
    const start = markerIndex + marker.length - 1;
    let end = start + 1;
    let escaped = false;
    while (end < html.length) {
      const char = html[end];
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') break;
      end += 1;
    }
    try {
      parts.push(JSON.parse(html.slice(start, end + 1)) as string);
    } catch {
      // Ignore malformed flight fragments; other chunks can still carry products.
    }
    index = end + 1;
  }
  return parts.join('');
}

function extractJsonArrayAfter(source: string, markerIndex: number): unknown[] {
  const start = source.indexOf('[', markerIndex);
  if (start === -1) return [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, index + 1)) as unknown[];
    }
  }
  return [];
}

export function extractKronanIsProductsFromHtml(html: string): KronanApiProduct[] {
  const flight = extractFlightStrings(html);
  const products: KronanApiProduct[] = [];
  const seen = new Set<string>();
  let index = 0;
  while (index < flight.length) {
    const markerIndex = flight.indexOf('"products":[{', index);
    if (markerIndex === -1) break;
    const rows = extractJsonArrayAfter(flight, markerIndex) as KronanApiProduct[];
    for (const row of rows) {
      const key = text(row.sku) || text(row.id);
      if (key && !seen.has(key)) {
        seen.add(key);
        products.push(row);
      }
    }
    index = markerIndex + 1;
  }
  return products;
}

export function parseKronanIsProducts(payload: unknown, sourceUrl = KRONAN_IS_PRODUCTS_URL, retrievedAt = new Date().toISOString()): KronanIsProduct[] {
  const products = typeof payload === 'string' ? extractKronanIsProductsFromHtml(payload) : productArray(payload);
  return products.flatMap((product) => {
    const id = text(product.id) || text(product.sku);
    const sku = text(product.sku) || id;
    const name = text(product.name) || text(product.title);
    const price = numberOrNull(product.price) ?? numberOrNull(product.discountedPrice) ?? numberOrNull(product.currentPrice);
    if (!id || !name || price === null || price < 0) return [];
    const slug = text(product.slug);
    return [{
      id,
      sku,
      name,
      brand: text(product.brand),
      category: categoryName(product.category),
      price,
      currency: 'ISK' as const,
      country: 'IS' as const,
      unitPrice: numberOrNull(product.unitPrice) ?? numberOrNull(product.pricePerKiloDisplay),
      unitPriceUnit: text(product.unitPriceUnit) || text(product.baseComparisonUnit),
      priceInfo: text(product.priceInfo),
      imageUrl: text(product.thumbnail) || text(product.imageUrl) || text(product.image),
      productUrl: slug ? `${KRONAN_IS_PRODUCT_BASE_URL}${slug}` : sourceUrl,
      sourceUrl,
      retrievedAt
    }];
  });
}

export async function fetchKronanIsProducts(options: { fetchImpl?: FetchLike; sourceUrl?: string; retrievedAt?: string } = {}) {
  const sourceUrl = options.sourceUrl ?? KRONAN_IS_PRODUCTS_URL;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike | undefined);
  if (!fetchImpl) throw new Error('fetchKronanIsProducts requires a fetch implementation');
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      'user-agent': 'GroceryView/0.1'
    }
  });
  if (!response.ok) throw new Error(`Kronan IS product request failed: ${response.status}`);
  const contentType = response.headers?.get('content-type') ?? '';
  const payload = contentType.includes('application/json') && response.json ? await response.json() : await response.text?.();
  return parseKronanIsProducts(payload ?? {}, sourceUrl, options.retrievedAt ?? new Date().toISOString());
}
