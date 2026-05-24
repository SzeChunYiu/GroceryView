export type ArkenZooSeProduct = {
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  country: 'SE';
  currency: 'SEK';
  chain: 'arkenzoo';
  retailer_type: 'specialty_pet';
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type ArkenZooRawProduct = Record<string, unknown>;

export const ARKENZOO_SE_BASE_URL = 'https://www.arkenzoo.se';
export const ARKENZOO_SE_PATHS = ['/hund/hundmat', '/katt/kattmat', '/smadjur'] as const;

export type FetchArkenZooSeProductsOptions = {
  fetchImpl?: typeof fetch;
  paths?: readonly string[];
  maxRows?: number;
  minRows?: number;
  retrievedAt?: string;
};

export function buildArkenZooSeUrl(path: string): string {
  return new URL(path, ARKENZOO_SE_BASE_URL).toString();
}

export async function fetchArkenZooSeProducts(options: FetchArkenZooSeProductsOptions = {}): Promise<ArkenZooSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const paths = options.paths ?? ARKENZOO_SE_PATHS;
  const maxRows = options.maxRows ?? 1000;
  const minRows = options.minRows ?? 0;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: ArkenZooSeProduct[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const sourceUrl = buildArkenZooSeUrl(path);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Arken Zoo SE request failed for ${path}: ${response.status}`);

    for (const product of parseArkenZooSeProducts(await response.text())) {
      const row = normalizeArkenZooSeProduct(product, sourceUrl, retrievedAt);
      if (!row || seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return ensureMinimumRows(rows, minRows);
    }
  }
  return ensureMinimumRows(rows, minRows);
}

export function parseArkenZooSeProducts(payload: string): ArkenZooRawProduct[] {
  const rows: ArkenZooRawProduct[] = [];
  for (const json of extractJsonCandidates(payload)) {
    try { collectProductObjects(JSON.parse(json), rows); } catch { /* continue */ }
  }
  return dedupeProducts(rows);
}

export function normalizeArkenZooSeProduct(product: ArkenZooRawProduct, sourceUrl: string, retrievedAt: string): ArkenZooSeProduct | null {
  const name = text(product.name ?? product.title ?? product.productName);
  const price = numberOrNull(product.price ?? product.currentPrice ?? product.priceValue ?? product.amount);
  if (!name || price === null) return null;
  const code = text(product.sku ?? product.id ?? product.gtin ?? product.ean ?? product.productId) || stableCode(`${name}:${price}`);

  return {
    code,
    name,
    brand: text(product.brand ?? product.vendor ?? product.brandName ?? product.manufacturer),
    category: text(product.category ?? product.categoryName ?? product.productType ?? product.tags),
    price,
    priceText: text(product.priceText ?? product.displayPrice) || `${price.toFixed(2)} SEK`,
    country: 'SE',
    currency: 'SEK',
    chain: 'arkenzoo',
    retailer_type: 'specialty_pet',
    productUrl: absoluteUrl(text(product.url ?? product.href ?? product.productUrl ?? product.handle), sourceUrl),
    imageUrl: absoluteUrl(text(product.imageUrl ?? product.image ?? product.featured_image), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function ensureMinimumRows(rows: ArkenZooSeProduct[], minRows: number): ArkenZooSeProduct[] {
  if (rows.length < minRows) throw new Error(`Arken Zoo SE fetch returned only ${rows.length} rows; minimum required is ${minRows}`);
  return rows;
}

function extractJsonCandidates(payload: string): string[] {
  const candidates: string[] = [];
  for (const match of payload.matchAll(/<script[^>]+type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/giu)) {
    if (match[1]) candidates.push(htmlDecode(match[1]));
  }
  const nextDataMatch = payload.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/iu);
  if (nextDataMatch?.[1]) candidates.push(htmlDecode(nextDataMatch[1]));
  return candidates;
}

function collectProductObjects(value: unknown, rows: ArkenZooRawProduct[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { for (const item of value) collectProductObjects(item, rows); return; }
  const record = flattenOffer(value as ArkenZooRawProduct);
  const hasName = Boolean(record.name ?? record.title ?? record.productName);
  const hasPrice = Boolean(record.price ?? record.currentPrice ?? record.priceValue ?? record.amount);
  if (hasName && hasPrice) rows.push(record);
  for (const child of Object.values(value as Record<string, unknown>)) collectProductObjects(child, rows);
}

function flattenOffer(record: ArkenZooRawProduct): ArkenZooRawProduct {
  const offers = record.offers && typeof record.offers === 'object' ? record.offers as ArkenZooRawProduct : {};
  return { ...record, price: record.price ?? offers.price, currency: record.currency ?? offers.priceCurrency };
}

function dedupeProducts(products: ArkenZooRawProduct[]): ArkenZooRawProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = text(product.sku ?? product.id ?? product.gtin ?? product.ean ?? product.name ?? product.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try { return new URL(value, baseUrl).toString(); } catch { return ''; }
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
  return `arkenzoo-${Math.abs(hash)}`;
}
