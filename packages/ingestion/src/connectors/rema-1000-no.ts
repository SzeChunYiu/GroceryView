export type Rema1000NoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'rema-1000-no';
  storeId: null;
  storeName: null;
  code: string;
  name: string;
  brand: string;
  category: string;
  packageText: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  unitPriceUnit: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  sourceFreshness: {
    retrievedAt: string;
    sourceUrl: string;
    parserVersion: string;
    sourceKind: 'public_search_fixture';
  };
  provenance: {
    source: 'rema_no_search';
    parserVersion: string;
    accessPolicy: 'public_read_only_search';
  };
};

export type FetchRema1000NoProductsOptions = {
  fetchImpl?: typeof fetch;
  queries: string[];
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export const REMA_1000_NO_BASE_URL = 'https://www.rema.no';
export const REMA_1000_NO_SEARCH_PATH = '/search';
export const REMA_1000_NO_PARSER_VERSION = 'rema-1000-no-search-v2';
export const REMA_1000_NO_ACCESS_POLICY = {
  source: 'rema_no_search',
  officialBaseUrl: REMA_1000_NO_BASE_URL,
  checkedAt: '2026-05-25',
  robotsTxtUrl: 'https://www.rema.no/robots.txt',
  allowedSurface: '/search?search={query}',
  blockedSurfaces: ['/search.php?search=', '/oppskrifter/?search=', '/butikker/?q='],
  constraints: [
    'Use public read-only REMA 1000 pages only; do not use authenticated REMA app traffic or personalized offers.',
    'Keep crawls query-bounded and attach sourceUrl plus retrievedAt to every normalized row.',
    'Treat rows as national/catalog search evidence unless a future allowed store-scoped source is documented.'
  ]
} as const;

export function buildRema1000NoSearchUrl(query: string, baseUrl = REMA_1000_NO_BASE_URL): string {
  const url = new URL(REMA_1000_NO_SEARCH_PATH, baseUrl);
  url.searchParams.set('search', query);
  return url.toString();
}

export async function fetchRema1000NoProducts(options: FetchRema1000NoProductsOptions): Promise<Rema1000NoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: Rema1000NoProduct[] = [];
  const seen = new Set<string>();

  for (const query of options.queries) {
    const sourceUrl = buildRema1000NoSearchUrl(query, options.baseUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json,text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`REMA 1000 Norway search request failed for ${query}: ${response.status}`);
    const contentType = response.headers?.get?.('content-type') ?? '';
    const payload = contentType.includes('json') ? await response.json() : await response.text();
    for (const product of parseRema1000NoProducts(payload, sourceUrl, retrievedAt, options.baseUrl)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseRema1000NoProducts(
  payload: unknown,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = REMA_1000_NO_BASE_URL
): Rema1000NoProduct[] {
  if (typeof payload === 'string' && /captcha|access denied|cloudflare|logg inn/i.test(payload)) {
    throw new Error('REMA 1000 Norway search source returned a blocked/login page.');
  }
  const json = typeof payload === 'string' ? extractJsonPayload(payload) : payload;
  const rows: Rema1000NoProduct[] = [];
  const seen = new Set<string>();
  for (const candidate of collectProductCandidates(json)) {
    const product = normalizeRema1000NoProduct(candidate, sourceUrl, retrievedAt, baseUrl);
    if (!product || seen.has(product.code)) continue;
    seen.add(product.code);
    rows.push(product);
  }
  return rows;
}

export function normalizeRema1000NoProduct(
  candidate: unknown,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = REMA_1000_NO_BASE_URL
): Rema1000NoProduct | null {
  if (!isRecord(candidate)) return null;
  const code = firstText(candidate, ['ean', 'gtin', 'barcode', 'code', 'productId', 'id', 'sku']);
  const name = firstText(candidate, ['name', 'title', 'displayName', 'display_name', 'productName']);
  const price = priceNumber(firstDefined(candidate, ['price', 'currentPrice', 'current_price', 'grossPrice', 'gross_price', 'salesPrice']));
  if (!code || !name || price === null) return null;

  const unitPriceValue = firstDefined(candidate, ['unitPrice', 'unit_price', 'comparePrice', 'compare_price', 'pricePerUnit']);
  const unitPriceText = priceText(unitPriceValue) || firstText(candidate, ['unitPriceText', 'unit_price_text', 'comparePriceText', 'compare_price_text']);
  const productPath = firstText(candidate, ['url', 'href', 'productUrl', 'product_url', 'canonicalUrl', 'canonical_url']);
  const imagePath = firstImage(candidate);
  const brandRecord = recordAt(candidate, ['brand', 'manufacturer', 'supplier']);
  const categoryRecord = recordAt(candidate, ['category', 'mainCategory', 'main_category']);

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'rema-1000-no',
    storeId: null,
    storeName: null,
    code,
    name,
    brand: firstText(candidate, ['brand', 'brandName', 'brand_name', 'manufacturer']) || firstText(brandRecord, ['name', 'title']),
    category: firstText(candidate, ['category', 'categoryName', 'category_name']) || firstText(categoryRecord, ['name', 'title']),
    packageText: firstText(candidate, ['packageText', 'package_text', 'unit', 'unitLabel', 'unit_label', 'size', 'displaySize']),
    price,
    priceText: priceText(firstDefined(candidate, ['price', 'currentPrice', 'current_price', 'grossPrice', 'gross_price', 'salesPrice'])) || `${price.toFixed(2)} kr`,
    unitPriceText,
    unitPriceUnit: firstText(candidate, ['unitPriceUnit', 'unit_price_unit', 'comparePriceUnit', 'compare_price_unit']) || unitFromText(unitPriceText),
    productUrl: productPath ? absoluteUrl(productPath, baseUrl) : '',
    imageUrl: imagePath ? absoluteUrl(imagePath, baseUrl) : '',
    sourceUrl,
    retrievedAt,
    sourceFreshness: {
      retrievedAt,
      sourceUrl,
      parserVersion: REMA_1000_NO_PARSER_VERSION,
      sourceKind: 'public_search_fixture'
    },
    provenance: {
      source: 'rema_no_search',
      parserVersion: REMA_1000_NO_PARSER_VERSION,
      accessPolicy: 'public_read_only_search'
    }
  };
}

function extractJsonPayload(html: string): unknown {
  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) return parseJson(nextData);
  const appState = html.match(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (appState) return parseJson(appState);
  return parseJson(html);
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(decodeHtml(value.trim()));
  } catch {
    return null;
  }
}

function collectProductCandidates(payload: unknown): unknown[] {
  const rows: unknown[] = [];
  const seenObjects = new Set<object>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      if (looksLikeProductArray(value)) rows.push(...value);
      for (const item of value) visit(item);
      return;
    }
    if (!isRecord(value) || seenObjects.has(value)) return;
    seenObjects.add(value);
    for (const key of ['products', 'productList', 'items', 'results', 'hits']) {
      const child = value[key];
      if (Array.isArray(child) && looksLikeProductArray(child)) rows.push(...child);
    }
    for (const child of Object.values(value)) visit(child);
  };
  visit(payload);
  return rows;
}

function looksLikeProductArray(values: unknown[]): boolean {
  return values.some((value) => isRecord(value) && Boolean(firstText(value, ['name', 'title', 'displayName', 'productName'])) && firstDefined(value, ['price', 'currentPrice', 'current_price', 'grossPrice', 'gross_price', 'salesPrice']) !== undefined);
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function firstText(record: unknown, keys: string[]): string {
  if (!isRecord(record)) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function recordAt(record: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function firstImage(record: Record<string, unknown>): string {
  const direct = firstText(record, ['image', 'imageUrl', 'image_url', 'thumbnail', 'thumbnailUrl']);
  if (direct) return direct;
  const image = recordAt(record, ['image', 'images', 'media']);
  if (image) return firstText(image, ['url', 'src', 'href', 'large', 'medium']);
  if (Array.isArray(record.images)) {
    for (const candidate of record.images) {
      const imageUrl = firstText(candidate, ['url', 'src', 'href']);
      if (imageUrl) return imageUrl;
    }
  }
  return '';
}

function priceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isRecord(value)) return priceNumber(firstDefined(value, ['amount', 'value', 'price', 'currentPrice', 'formatted']));
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s/g, '').replace(/kr|nok/gi, '').replace(',', '.').match(/\d+(?:\.\d+)?/u)?.[0];
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(2)} kr`;
  if (isRecord(value)) return firstText(value, ['formatted', 'display', 'text', 'label']) || priceText(firstDefined(value, ['amount', 'value', 'price']));
  return '';
}

function unitFromText(value: string): string {
  return value.match(/\/(kg|g|l|stk|pk|m[l]?)/i)?.[1]?.toLowerCase() ?? '';
}

function absoluteUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
