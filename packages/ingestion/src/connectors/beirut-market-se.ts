export type BeirutMarketSeProduct = {
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  country: 'SE';
  currency: 'SEK';
  chain: 'beirut-market';
  retailer_type: 'ethnic_middle_eastern';
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type BeirutMarketRawProduct = Record<string, unknown>;

export const BEIRUT_MARKET_SE_BASE_URL = 'https://beirutmarket.se';
export const BEIRUT_MARKET_SE_PRODUCTS_PATHS = ['/collections/all', '/collections/matvaror'] as const;
export const BEIRUT_MARKET_ALLOWED_CATEGORIES = [
  'baljväxter',
  'basvaror',
  'bröd',
  'dryck',
  'frukt',
  'grönsaker',
  'kryddor',
  'mejeri',
  'oliver',
  'ris',
  'såser',
  'te'
] as const;

export type FetchBeirutMarketSeProductsOptions = {
  fetchImpl?: typeof fetch;
  paths?: readonly string[];
  maxRows?: number;
  minRows?: number;
  retrievedAt?: string;
};

export function buildBeirutMarketSeUrl(path: string): string {
  return new URL(path, BEIRUT_MARKET_SE_BASE_URL).toString();
}

export async function fetchBeirutMarketSeProducts(options: FetchBeirutMarketSeProductsOptions = {}): Promise<BeirutMarketSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const paths = options.paths ?? BEIRUT_MARKET_SE_PRODUCTS_PATHS;
  const maxRows = options.maxRows ?? 1000;
  const minRows = options.minRows ?? 0;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: BeirutMarketSeProduct[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const sourceUrl = buildBeirutMarketSeUrl(path);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Beirut Market SE request failed for ${path}: ${response.status}`);

    for (const product of parseBeirutMarketSeProducts(await response.text())) {
      const row = normalizeBeirutMarketSeProduct(product, sourceUrl, retrievedAt);
      if (!row || seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return ensureMinimumRows(rows, minRows);
    }
  }

  return ensureMinimumRows(rows, minRows);
}

export function parseBeirutMarketSeProducts(payload: string): BeirutMarketRawProduct[] {
  const rows: BeirutMarketRawProduct[] = [];
  for (const json of extractJsonCandidates(payload)) {
    try {
      collectProductObjects(JSON.parse(json), rows);
    } catch {
      // Continue with other embedded payloads.
    }
  }
  return dedupeProducts(rows);
}

export function normalizeBeirutMarketSeProduct(product: BeirutMarketRawProduct, sourceUrl: string, retrievedAt: string): BeirutMarketSeProduct | null {
  const name = text(product.name ?? product.title ?? product.productName);
  const category = normalizeCategory(text(product.category ?? product.categoryName ?? product.productType ?? product.tags));
  const price = numberOrNull(product.price ?? product.currentPrice ?? product.priceValue ?? product.amount);
  if (!name || price === null || !isAllowedBeirutMarketCategory(category)) return null;

  const code = text(product.sku ?? product.id ?? product.gtin ?? product.ean ?? product.productId) || stableCode(`${name}:${price}`);
  return {
    code,
    name,
    brand: text(product.brand ?? product.vendor ?? product.brandName),
    category,
    price,
    priceText: text(product.priceText ?? product.displayPrice) || `${price.toFixed(2)} SEK`,
    country: 'SE',
    currency: 'SEK',
    chain: 'beirut-market',
    retailer_type: 'ethnic_middle_eastern',
    productUrl: absoluteUrl(text(product.url ?? product.href ?? product.productUrl ?? product.handle), sourceUrl),
    imageUrl: absoluteUrl(text(product.imageUrl ?? product.image ?? product.featured_image), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

export function isAllowedBeirutMarketCategory(category: string): boolean {
  const normalized = normalizeCategory(category);
  return BEIRUT_MARKET_ALLOWED_CATEGORIES.some((allowed) => normalized.includes(allowed));
}

function ensureMinimumRows(rows: BeirutMarketSeProduct[], minRows: number): BeirutMarketSeProduct[] {
  if (rows.length < minRows) throw new Error(`Beirut Market SE fetch returned only ${rows.length} rows; minimum required is ${minRows}`);
  return rows;
}

function extractJsonCandidates(payload: string): string[] {
  const candidates: string[] = [];
  for (const match of payload.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/giu)) {
    if (match[1]) candidates.push(htmlDecode(match[1]));
  }
  for (const match of payload.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu)) {
    if (match[1]) candidates.push(htmlDecode(match[1]));
  }
  return candidates;
}

function collectProductObjects(value: unknown, rows: BeirutMarketRawProduct[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectProductObjects(item, rows);
    return;
  }
  const record = value as BeirutMarketRawProduct;
  const hasName = Boolean(record.name ?? record.title ?? record.productName);
  const hasPrice = Boolean(record.price ?? record.currentPrice ?? record.priceValue ?? record.amount ?? record.offers);
  if (hasName && hasPrice) rows.push(flattenOffer(record));
  for (const child of Object.values(record)) collectProductObjects(child, rows);
}

function flattenOffer(record: BeirutMarketRawProduct): BeirutMarketRawProduct {
  const offers = record.offers && typeof record.offers === 'object' ? record.offers as BeirutMarketRawProduct : {};
  return { ...record, price: record.price ?? offers.price, currency: record.currency ?? offers.priceCurrency };
}

function dedupeProducts(products: BeirutMarketRawProduct[]): BeirutMarketRawProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = text(product.sku ?? product.id ?? product.gtin ?? product.ean ?? product.name ?? product.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCategory(value: string): string {
  return value.toLocaleLowerCase('sv-SE').replace(/[,/|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const match = text(value).replace(/\s/g, '').replace(',', '.').match(/\d+(?:\.\d+)?/u);
  return match ? Number.parseFloat(match[0]) : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(' ');
  return '';
}

function htmlDecode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
}

function stableCode(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return `beirut-market-${Math.abs(hash)}`;
}
