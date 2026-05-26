export type MenyNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'meny-no';
  code: string;
  name: string;
  brand: string;
  category: string;
  packageText: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  unitPriceUnit: string;
  validFrom: string;
  validTo: string;
  onlineAvailability: 'available' | 'unavailable' | 'unknown';
  availabilityText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  taxonomy: {
    countryCode: 'NO';
    market: 'norway_grocery';
    chainSlug: 'meny-no';
    retailer: 'MENY';
    sourceType: 'product_search';
  };
  sourceLineage: {
    source: 'meny_no_product_search';
    parserVersion: typeof MENY_NO_PARSER_VERSION;
    access: typeof MENY_NO_ACCESS_POLICY;
  };
};

export type FetchMenyNoProductsOptions = {
  fetchImpl?: typeof fetch;
  queries: string[];
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export const MENY_NO_BASE_URL = 'https://meny.no';
export const MENY_NO_SEARCH_PATH = '/sok';
export const MENY_NO_PARSER_VERSION = 'meny-no-product-search-v2';
export const MENY_NO_ACCESS_POLICY = {
  status: 'public_page_probe',
  productSurface: 'https://meny.no/varer renders public catalogue shell content and client-loaded product rows.',
  offersSurface: 'https://meny.no/varer/tilbud renders weekly offer shell content and client-loaded products.',
  constraints: [
    'Do not use logged-in Trumf, cart, checkout, account, or customer-specific APIs.',
    'Respect MENY session, anti-forgery, and anonymous store-selection cookies; only parse recorded public fixtures or explicitly fetched public HTML/JSON.',
    'Treat online availability as unknown unless a public product payload explicitly exposes availability or stock status.'
  ]
} as const;

export function buildMenyNoSearchUrl(query: string, baseUrl = MENY_NO_BASE_URL): string {
  const url = new URL(MENY_NO_SEARCH_PATH, baseUrl);
  url.searchParams.set('query', query);
  return url.toString();
}

export async function fetchMenyNoProducts(options: FetchMenyNoProductsOptions): Promise<MenyNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MenyNoProduct[] = [];
  const seen = new Set<string>();

  for (const query of options.queries) {
    const sourceUrl = buildMenyNoSearchUrl(query, options.baseUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json,text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Meny Norway search request failed for ${query}: ${response.status}`);
    const contentType = response.headers?.get?.('content-type') ?? '';
    const payload = contentType.includes('json') ? await response.json() : await response.text();
    for (const product of parseMenyNoProducts(payload, sourceUrl, retrievedAt, options.baseUrl)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseMenyNoProducts(
  payload: unknown,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = MENY_NO_BASE_URL
): MenyNoProduct[] {
  const json = typeof payload === 'string' ? extractJsonPayload(payload) : payload;
  const rows: MenyNoProduct[] = [];
  const seen = new Set<string>();
  for (const candidate of collectProductCandidates(json)) {
    const product = normalizeMenyNoProduct(candidate, sourceUrl, retrievedAt, baseUrl);
    if (!product || seen.has(product.code)) continue;
    seen.add(product.code);
    rows.push(product);
  }
  return rows;
}

export function normalizeMenyNoProduct(
  candidate: unknown,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = MENY_NO_BASE_URL
): MenyNoProduct | null {
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
  const availabilityText = firstText(candidate, ['availabilityText', 'availability_text', 'availability', 'stockStatus', 'stock_status', 'onlineAvailability']);

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'meny-no',
    code,
    name,
    brand: firstText(candidate, ['brand', 'brandName', 'brand_name', 'manufacturer']) || firstText(brandRecord, ['name', 'title']),
    category: firstText(candidate, ['category', 'categoryName', 'category_name']) || firstText(categoryRecord, ['name', 'title']),
    packageText: firstText(candidate, ['packageText', 'package_text', 'unit', 'unitLabel', 'unit_label', 'size', 'displaySize']),
    price,
    priceText: priceText(firstDefined(candidate, ['price', 'currentPrice', 'current_price', 'grossPrice', 'gross_price', 'salesPrice'])) || `${price.toFixed(2)} kr`,
    unitPriceText,
    unitPriceUnit: firstText(candidate, ['unitPriceUnit', 'unit_price_unit', 'comparePriceUnit', 'compare_price_unit']) || unitFromText(unitPriceText),
    validFrom: firstText(candidate, ['validFrom', 'valid_from', 'offerValidFrom', 'offer_valid_from', 'campaignStartDate']),
    validTo: firstText(candidate, ['validTo', 'valid_to', 'offerValidTo', 'offer_valid_to', 'campaignEndDate']),
    onlineAvailability: availabilityFor(candidate, availabilityText),
    availabilityText,
    productUrl: productPath ? absoluteUrl(productPath, baseUrl) : '',
    imageUrl: imagePath ? absoluteUrl(imagePath, baseUrl) : '',
    sourceUrl,
    retrievedAt,
    taxonomy: {
      countryCode: 'NO',
      market: 'norway_grocery',
      chainSlug: 'meny-no',
      retailer: 'MENY',
      sourceType: 'product_search'
    },
    sourceLineage: {
      source: 'meny_no_product_search',
      parserVersion: MENY_NO_PARSER_VERSION,
      access: MENY_NO_ACCESS_POLICY
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

function availabilityFor(record: Record<string, unknown>, availabilityText: string): MenyNoProduct['onlineAvailability'] {
  const direct = firstDefined(record, ['onlineAvailability', 'isAvailableOnline', 'availableOnline', 'isAvailable', 'available', 'inStock']);
  if (typeof direct === 'boolean') return direct ? 'available' : 'unavailable';
  if (typeof direct === 'string') {
    if (/^(true|available|in stock|på lager|tilgjengelig)$/i.test(direct.trim())) return 'available';
    if (/^(false|unavailable|out of stock|ikke på lager|ikke tilgjengelig|utsolgt)$/i.test(direct.trim())) return 'unavailable';
  }
  if (/ikke tilgjengelig|ikke på lager|utsolgt|unavailable|out of stock/i.test(availabilityText)) return 'unavailable';
  if (/tilgjengelig|på lager|available|in stock/i.test(availabilityText)) return 'available';
  return 'unknown';
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
