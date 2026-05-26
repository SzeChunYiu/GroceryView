import { mapWillysCategoryToInternal, type InternalCategoryMapping } from './categoryMap.js';
import { normalizeUnitQuantity, type NormalizedQuantity } from './unitNormalizer.js';

export const WILLYS_SEARCH_BASE_URL = 'https://www.willys.se/search';
export const WILLYS_CATEGORY_BASE_URL = 'https://www.willys.se/c';
export const WILLYS_CATEGORY_TREE_URL = 'https://www.willys.se/leftMenu/categorytree';
export const DEFAULT_WILLYS_PAGE_SIZE = 100;

export type WillysScrapedProduct = {
  retailer: 'willys';
  externalId: string;
  name: string;
  brand: string | null;
  categoryId: string;
  categoryPath: string[];
  categoryMappingConfidence: InternalCategoryMapping['confidence'];
  sourceCategory: string;
  packageText: string | null;
  normalizedPackage: NormalizedQuantity | null;
  price: number;
  currency: 'SEK';
  priceText: string;
  unitPriceText: string | null;
  imageUrl: string | null;
  productUrl: string;
  sourceUrl: string;
  observedAt: string;
};

export type FetchWillysScraperOptions = {
  categoryPaths?: readonly string[];
  fetchImpl?: typeof fetch;
  maxRows?: number;
  observedAt?: string;
  pageSize?: number;
  queries?: readonly string[];
  storeId?: string;
};

export type WillysApiProduct = {
  code?: unknown;
  name?: unknown;
  manufacturer?: unknown;
  productLine2?: unknown;
  pickupProductLine2?: unknown;
  googleAnalyticsCategory?: unknown;
  price?: unknown;
  priceValue?: unknown;
  comparePrice?: unknown;
  image?: { url?: unknown };
};

type WillysApiResponse = {
  results?: WillysApiProduct[];
  pagination?: {
    numberOfPages?: unknown;
  };
};

type WillysCategoryTreeNode = {
  title?: unknown;
  url?: unknown;
  valid?: unknown;
  children?: WillysCategoryTreeNode[];
};

export function buildWillysSearchUrl(query: string, storeId?: string): string {
  const url = new URL(WILLYS_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export function buildWillysCategoryUrl(categoryPath: string, page = 0, size = DEFAULT_WILLYS_PAGE_SIZE, storeId?: string): string {
  const safePath = categoryPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const url = new URL(`${WILLYS_CATEGORY_BASE_URL}/${safePath}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export async function fetchWillysCategoryPaths(options: { fetchImpl?: typeof fetch } = {}): Promise<string[]> {
  const response = await (options.fetchImpl ?? fetch)(WILLYS_CATEGORY_TREE_URL, jsonRequestInit());
  if (!response.ok) throw new Error(`Willys category tree request failed: ${response.status}`);
  const payload = await response.json() as WillysCategoryTreeNode;
  const paths: string[] = [];
  collectCategoryPaths(payload, paths);
  if (paths.length === 0) throw new Error('Willys category tree returned no usable category paths.');
  return paths;
}

export async function fetchWillysProducts(options: FetchWillysScraperOptions = {}): Promise<WillysScrapedProduct[]> {
  const observedAt = options.observedAt ?? new Date().toISOString();
  const pageSize = options.pageSize ?? DEFAULT_WILLYS_PAGE_SIZE;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const rows: WillysScrapedProduct[] = [];
  const seen = new Set<string>();

  if (options.queries?.length) {
    for (const query of options.queries) {
      const sourceUrl = buildWillysSearchUrl(query, options.storeId);
      await appendWillysPageRows(sourceUrl, observedAt, rows, seen, maxRows, options.fetchImpl);
      if (rows.length >= maxRows) return rows;
    }
    return rows;
  }

  const categoryPaths = options.categoryPaths ?? await fetchWillysCategoryPaths({ fetchImpl: options.fetchImpl });
  for (const categoryPath of categoryPaths) {
    let page = 0;
    let pageCount: number | null = null;
    while (rows.length < maxRows && (pageCount === null || page < pageCount)) {
      const sourceUrl = buildWillysCategoryUrl(categoryPath, page, pageSize, options.storeId);
      const payload = await readWillysProductPage(sourceUrl, options.fetchImpl);
      pageCount = positiveInteger(payload.pagination?.numberOfPages) ?? page + 1;
      appendNormalizedProducts(payload.results ?? [], sourceUrl, observedAt, rows, seen, maxRows, categoryPath);
      if ((payload.results ?? []).length === 0) break;
      page += 1;
    }
    if (rows.length >= maxRows) return rows;
  }

  return rows;
}

export function normalizeWillysProduct(product: WillysApiProduct, sourceUrl: string, observedAt: string, sourceCategory = ''): WillysScrapedProduct | null {
  const externalId = text(product.code);
  const name = text(product.name);
  const price = numberOrNull(product.priceValue);
  if (!externalId || !name || price === null) return null;

  const packageText = text(product.productLine2) || text(product.pickupProductLine2);
  const categorySource = text(product.googleAnalyticsCategory) || sourceCategory;
  const mappedCategory = mapWillysCategoryToInternal(categorySource);

  return {
    retailer: 'willys',
    externalId,
    name,
    brand: text(product.manufacturer) || null,
    categoryId: mappedCategory.categoryId,
    categoryPath: mappedCategory.categoryPath,
    categoryMappingConfidence: mappedCategory.confidence,
    sourceCategory: categorySource,
    packageText: packageText || null,
    normalizedPackage: normalizePackageText(packageText),
    price,
    currency: 'SEK',
    priceText: text(product.price) || `${price.toLocaleString('sv-SE')} kr`,
    unitPriceText: text(product.comparePrice) || null,
    imageUrl: text(product.image?.url) || null,
    productUrl: `https://www.willys.se/produkt/${encodeURIComponent(externalId)}`,
    sourceUrl,
    observedAt
  };
}

async function appendWillysPageRows(
  sourceUrl: string,
  observedAt: string,
  rows: WillysScrapedProduct[],
  seen: Set<string>,
  maxRows: number,
  fetchImpl?: typeof fetch
): Promise<void> {
  const payload = await readWillysProductPage(sourceUrl, fetchImpl);
  appendNormalizedProducts(payload.results ?? [], sourceUrl, observedAt, rows, seen, maxRows);
}

async function readWillysProductPage(sourceUrl: string, fetchImpl?: typeof fetch): Promise<WillysApiResponse> {
  const response = await (fetchImpl ?? fetch)(sourceUrl, jsonRequestInit());
  if (!response.ok) throw new Error(`Willys product request failed for ${sourceUrl}: ${response.status}`);
  return await response.json() as WillysApiResponse;
}

function appendNormalizedProducts(
  products: readonly WillysApiProduct[],
  sourceUrl: string,
  observedAt: string,
  rows: WillysScrapedProduct[],
  seen: Set<string>,
  maxRows: number,
  sourceCategory = ''
): void {
  for (const product of products) {
    const row = normalizeWillysProduct(product, sourceUrl, observedAt, sourceCategory);
    if (!row || seen.has(row.externalId)) continue;
    seen.add(row.externalId);
    rows.push(row);
    if (rows.length >= maxRows) return;
  }
}

function collectCategoryPaths(node: WillysCategoryTreeNode, paths: string[]): void {
  const path = text(node.url).replace(/^\/+|\/c\/?$/g, '');
  if (path && node.valid !== false) paths.push(path);
  for (const child of node.children ?? []) collectCategoryPaths(child, paths);
}

function normalizePackageText(value: string): NormalizedQuantity | null {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*(kg|g|l|ml|st|styck|pack)\b/i);
  if (!match) return null;
  const quantity = Number.parseFloat((match[1] ?? '').replace(',', '.'));
  const unit = (match[2] ?? '').toLowerCase();
  if (!Number.isFinite(quantity)) return null;
  try {
    if (unit === 'st' || unit === 'styck') return normalizeUnitQuantity(quantity, 'unit');
    return normalizeUnitQuantity(quantity, unit);
  } catch {
    return null;
  }
}

function jsonRequestInit(): RequestInit {
  return {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 willys-scraper (+https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(text(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = numberOrNull(value);
  return parsed !== null && parsed > 0 ? Math.floor(parsed) : null;
}
