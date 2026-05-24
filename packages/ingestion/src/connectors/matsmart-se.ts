export type MatsmartSeProduct = {
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  regularPrice: number | null;
  discountPercent: number | null;
  packageText: string;
  is_clearance: true;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type MatsmartRawProduct = Record<string, unknown>;

export const MATSMART_SE_BASE_URL = 'https://www.matsmart.se';
export const DEFAULT_MATSMART_SE_PATHS = ['/mat', '/fynd', '/kampanj'] as const;
export const DEFAULT_MATSMART_SE_MAX_ROWS = 1000;

export type FetchMatsmartSeProductsOptions = {
  fetchImpl?: typeof fetch;
  paths?: readonly string[];
  maxRows?: number;
  minRows?: number;
  retrievedAt?: string;
};

export function buildMatsmartSeUrl(path: string): string {
  return new URL(path, MATSMART_SE_BASE_URL).toString();
}

export async function fetchMatsmartSeProducts(options: FetchMatsmartSeProductsOptions = {}): Promise<MatsmartSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const paths = options.paths ?? DEFAULT_MATSMART_SE_PATHS;
  const maxRows = options.maxRows ?? DEFAULT_MATSMART_SE_MAX_ROWS;
  const minRows = options.minRows ?? 0;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MatsmartSeProduct[] = [];
  const seen = new Set<string>();

  for (const path of paths) {
    const sourceUrl = buildMatsmartSeUrl(path);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Matsmart SE request failed for ${path}: ${response.status}`);

    for (const product of parseMatsmartSeProducts(await response.text())) {
      const row = normalizeMatsmartSeProduct(product, sourceUrl, retrievedAt);
      if (!row || seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return ensureMatsmartMinimumRows(rows, minRows);
    }
  }

  return ensureMatsmartMinimumRows(rows, minRows);
}

export function parseMatsmartSeProducts(payload: string): MatsmartRawProduct[] {
  const products: MatsmartRawProduct[] = [];
  for (const json of extractJsonCandidates(payload)) {
    try {
      collectProductObjects(JSON.parse(json), products);
    } catch {
      // Continue with other payload fragments.
    }
  }
  return dedupeProducts(products);
}

export function normalizeMatsmartSeProduct(product: MatsmartRawProduct, sourceUrl: string, retrievedAt: string): MatsmartSeProduct | null {
  const name = text(product.name ?? product.title ?? product.productName);
  const price = numberOrNull(product.price ?? product.currentPrice ?? product.salePrice ?? product.priceValue);
  if (!name || price === null) return null;

  const regularPrice = numberOrNull(product.regularPrice ?? product.originalPrice ?? product.compareAtPrice ?? product.previousPrice);
  const code = text(product.sku ?? product.id ?? product.gtin ?? product.ean ?? product.productId) || stableCode(`${name}:${price}`);
  const discountPercent = numberOrNull(product.discountPercent ?? product.discountPercentage) ?? (regularPrice && regularPrice > price
    ? Math.round(((regularPrice - price) / regularPrice) * 100)
    : null);

  return {
    code,
    name,
    brand: text(product.brand ?? product.brandName ?? product.manufacturer),
    category: text(product.category ?? product.categoryName ?? product.productType),
    price,
    regularPrice,
    discountPercent,
    packageText: text(product.packageText ?? product.size ?? product.quantity ?? product.weight),
    is_clearance: true,
    productUrl: absoluteUrl(text(product.url ?? product.href ?? product.productUrl ?? product.slug), sourceUrl),
    imageUrl: absoluteUrl(text(product.imageUrl ?? product.image ?? product.imagePath), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function ensureMatsmartMinimumRows(rows: MatsmartSeProduct[], minRows: number): MatsmartSeProduct[] {
  if (rows.length < minRows) throw new Error(`Matsmart SE fetch returned only ${rows.length} rows; minimum required is ${minRows}`);
  return rows;
}

function extractJsonCandidates(payload: string): string[] {
  const candidates: string[] = [];
  for (const match of payload.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/giu)) {
    if (match[1]) candidates.push(htmlDecode(match[1]));
  }
  const nextDataMatch = payload.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/iu);
  if (nextDataMatch?.[1]) candidates.push(htmlDecode(nextDataMatch[1]));
  return candidates;
}

function collectProductObjects(value: unknown, products: MatsmartRawProduct[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectProductObjects(item, products);
    return;
  }
  const record = value as MatsmartRawProduct;
  const hasName = Boolean(record.name ?? record.title ?? record.productName);
  const hasPrice = Boolean(record.price ?? record.currentPrice ?? record.salePrice ?? record.priceValue);
  if (hasName && hasPrice) products.push(record);
  for (const child of Object.values(record)) collectProductObjects(child, products);
}

function dedupeProducts(products: MatsmartRawProduct[]): MatsmartRawProduct[] {
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
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function htmlDecode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
}

function stableCode(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return `matsmart-se-${Math.abs(hash)}`;
}
