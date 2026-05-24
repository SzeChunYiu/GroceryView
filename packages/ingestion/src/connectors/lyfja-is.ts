export type LyfjaProduct = {
  country: 'IS';
  currency: 'ISK';
  chain: 'lyfja';
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  originalPrice: number | null;
  originalPriceText: string;
  vatPercent: number | null;
  stockStatus: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchLyfjaProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const LYFJA_BASE_URL = 'https://www.lyfja.is';

export const DEFAULT_LYFJA_SOURCE_PATHS = [
  '/verslun/tilbod/',
  '/verslun/nytt/',
  '/verslun/lyf-an-lyfsedils/verkjalyf/',
  '/verslun/hudin/solarvarnir/'
] as const;

export async function fetchLyfjaProducts(options: FetchLyfjaProductsOptions = {}): Promise<LyfjaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LyfjaProduct[] = [];
  const seen = new Set<string>();

  for (const sourcePath of options.sourcePaths ?? DEFAULT_LYFJA_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(sourcePath, LYFJA_BASE_URL);
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Lyfja request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const product of parseLyfjaProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.sku)) continue;
      seen.add(product.sku);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseLyfjaProducts(html: string, sourceUrl: string, retrievedAt: string): LyfjaProduct[] {
  const rows: LyfjaProduct[] = [];
  for (const props of extractAstroProps(html, 'AddToCartButton')) {
    const normalized = normalizeLyfjaProduct(props, sourceUrl, retrievedAt);
    if (normalized) rows.push(normalized);
  }
  return rows;
}

export function normalizeLyfjaProduct(props: Record<string, unknown>, sourceUrl: string, retrievedAt: string): LyfjaProduct | null {
  const product = isRecord(props.product) ? props.product : {};
  const sku = text(props.sku) || text(product.sku);
  const name = text(product.title) || text(product.name) || text(lastBreadcrumb(product)?.name);
  const price = numberFromUnknown(valueAt(product, ['price', 'currentAmount', 'value']) ?? valueAt(product, ['price', 'amount']));
  if (!sku || !name || price === null) return null;

  const originalPrice = numberFromUnknown(
    valueAt(product, ['price', 'regularAmount', 'value']) ??
      valueAt(product, ['price', 'originalAmount', 'value']) ??
      valueAt(product, ['price', 'previousAmount', 'value'])
  );

  return {
    country: 'IS',
    currency: 'ISK',
    chain: 'lyfja',
    sku,
    name,
    brand: text(product.brand),
    category: categoryName(product),
    price,
    priceText: text(valueAt(product, ['price', 'currentAmount', 'currencyString'])) || `${Math.round(price).toLocaleString('is-IS')} kr`,
    originalPrice,
    originalPriceText: originalPrice === null
      ? ''
      : text(valueAt(product, ['price', 'regularAmount', 'currencyString'])) ||
        text(valueAt(product, ['price', 'originalAmount', 'currencyString'])) ||
        text(valueAt(product, ['price', 'previousAmount', 'currencyString'])) ||
        `${Math.round(originalPrice).toLocaleString('is-IS')} kr`,
    vatPercent: numberFromUnknown(valueAt(product, ['price', 'vat'])),
    stockStatus: stockStatus(product),
    productUrl: absoluteUrl(text(product.url) || text(lastBreadcrumb(product)?.url), LYFJA_BASE_URL),
    imageUrl: absoluteUrl(text(valueAt(product, ['images', 0, 'url'])) || text(valueAt(product, ['image', 'url'])), LYFJA_BASE_URL),
    sourceUrl,
    retrievedAt
  };
}

function extractAstroProps(html: string, componentExport: string): Record<string, unknown>[] {
  const props: Record<string, unknown>[] = [];
  const pattern = /<astro-island\b[^>]*>/g;
  for (const match of html.matchAll(pattern)) {
    const tag = match[0];
    if (!tag.includes(`component-export="${componentExport}"`)) continue;
    const propsMatch = tag.match(/\sprops="([^"]*)"/);
    if (!propsMatch) continue;
    const decoded = deserializeAstroValue(JSON.parse(decodeHtmlEntities(propsMatch[1])));
    if (isRecord(decoded)) props.push(decoded);
  }
  return props;
}

function deserializeAstroValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number') {
      if (value[0] === 0) return deserializeAstroValue(value[1]);
      if (value[0] === 1 && Array.isArray(value[1])) return value[1].map(deserializeAstroValue);
      return deserializeAstroValue(value[1]);
    }
    return value.map(deserializeAstroValue);
  }
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, deserializeAstroValue(entry)]));
}

function categoryName(product: Record<string, unknown>): string {
  const categories = Array.isArray(product.productCategories) ? product.productCategories : [];
  const first = categories.find(isRecord);
  return text(first?.title);
}

function lastBreadcrumb(product: Record<string, unknown>): Record<string, unknown> | undefined {
  const breadcrumbs = Array.isArray(product.breadcrumbs) ? product.breadcrumbs.filter(isRecord) : [];
  return breadcrumbs.at(-1);
}

function stockStatus(product: Record<string, unknown>): string {
  const maxSellable = numberFromUnknown(product.maxSellable);
  if (maxSellable !== null) return maxSellable > 0 ? 'in_stock' : 'out_of_stock';
  return text(product.stockStatus) || text(product.availability);
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const url = text(value);
  if (!url) return '';
  return url.startsWith('https://') ? url : new URL(url, baseUrl).toString();
}

function valueAt(value: unknown, path: Array<string | number>): unknown {
  let current = value;
  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[key];
    } else {
      if (!isRecord(current)) return undefined;
      current = current[key];
    }
  }
  return current;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = text(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
