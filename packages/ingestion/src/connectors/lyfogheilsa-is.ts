export type LyfOgHeilsaChain = 'lyf-og-heilsa-is';

export type LyfOgHeilsaProductCategory = 'otc' | 'supplement' | 'beauty' | 'care';

export type LyfOgHeilsaProduct = {
  chain: LyfOgHeilsaChain;
  code: string;
  name: string;
  category: LyfOgHeilsaProductCategory;
  categorySlug: string;
  price: number;
  priceText: string;
  originalPrice: number | null;
  originalPriceText: string;
  discountPercent: number;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type LyfOgHeilsaPageDataProductGroup = {
  productGroupId?: unknown;
  title?: unknown;
  fullPrice?: unknown;
  discountPrice?: unknown;
  discountPercent?: unknown;
  category?: { slug?: unknown };
  images?: Array<{ largeUrl?: unknown; url?: unknown }>;
};

export type FetchLyfOgHeilsaProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const LYF_OG_HEILSA_BASE_URL = 'https://www.lyfogheilsa.is';

export const DEFAULT_LYF_OG_HEILSA_PAGE_DATA_PATHS = [
  '/page-data/gamla-apot/page-data.json',
  '/page-data/now/page-data.json',
  '/page-data/index/page-data.json'
] as const;

export async function fetchLyfOgHeilsaProducts(options: FetchLyfOgHeilsaProductsOptions = {}): Promise<LyfOgHeilsaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LyfOgHeilsaProduct[] = [];
  const seen = new Set<string>();

  for (const sourcePath of options.sourcePaths ?? DEFAULT_LYF_OG_HEILSA_PAGE_DATA_PATHS) {
    const sourceUrl = absoluteUrl(sourcePath, LYF_OG_HEILSA_BASE_URL);
    const response = await fetchImpl(sourceUrl, jsonHeaders());
    if (!response.ok) {
      throw new Error(`Lyf og heilsa request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseLyfOgHeilsaProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) return rows;
  }

  return rows;
}

export function parseLyfOgHeilsaProducts(payload: string, sourceUrl: string, retrievedAt: string): LyfOgHeilsaProduct[] {
  const data = parsePayload(payload);
  const products: LyfOgHeilsaPageDataProductGroup[] = [];
  visit(data, (value) => {
    const candidate = value as LyfOgHeilsaPageDataProductGroup;
    if (candidate.productGroupId && candidate.title && candidate.fullPrice !== undefined && candidate.discountPrice !== undefined) {
      products.push(candidate);
    }
  });

  return products
    .map((product) => normalizeLyfOgHeilsaProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is LyfOgHeilsaProduct => product !== null);
}

export function normalizeLyfOgHeilsaProduct(
  product: LyfOgHeilsaPageDataProductGroup,
  sourceUrl: string,
  retrievedAt: string
): LyfOgHeilsaProduct | null {
  const code = text(product.productGroupId);
  const name = text(product.title);
  const fullPrice = numberFromText(product.fullPrice);
  const discountPrice = numberFromText(product.discountPrice);
  if (!code || !name || fullPrice === null || discountPrice === null || discountPrice <= 0) return null;

  const categorySlug = text(product.category?.slug) || categorySlugFromSource(sourceUrl);
  const originalPrice = fullPrice > discountPrice ? fullPrice : null;
  const sourcePageUrl = pageUrlFromPageDataUrl(sourceUrl);

  return {
    chain: 'lyf-og-heilsa-is',
    code,
    name,
    category: lyfOgHeilsaCategory(categorySlug, name),
    categorySlug,
    price: discountPrice,
    priceText: `${Math.round(discountPrice)} ISK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${Math.round(originalPrice)} ISK`,
    discountPercent: numberFromText(product.discountPercent) ?? (originalPrice ? Math.round((1 - discountPrice / originalPrice) * 100) : 0),
    productUrl: `${sourcePageUrl}#product-${encodeURIComponent(code)}`,
    imageUrl: absoluteUrl(product.images?.[0]?.largeUrl ?? product.images?.[0]?.url, LYF_OG_HEILSA_BASE_URL),
    sourceUrl,
    retrievedAt
  };
}

function addRows(
  rows: LyfOgHeilsaProduct[],
  seen: Set<string>,
  products: readonly LyfOgHeilsaProduct[],
  maxRows: number | undefined
): void {
  for (const product of products) {
    const key = `${product.chain}:${product.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) return;
  }
}

function parsePayload(payload: string): unknown {
  const trimmed = payload.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed) as unknown;

  const pageDataMatch = trimmed.match(/<script[^>]+id=["']___GATSBY["'][^>]*>(.*?)<\/script>/s);
  if (pageDataMatch) return JSON.parse(pageDataMatch[1] ?? '{}') as unknown;

  throw new Error('Lyf og heilsa payload was not Gatsby page-data JSON');
}

function lyfOgHeilsaCategory(categorySlug: string, name: string): LyfOgHeilsaProductCategory {
  const value = `${categorySlug} ${name}`.toLocaleLowerCase('is-IS');
  if (matchesAny(value, ['verk', 'hiti', 'kvef', 'ofnæmi', 'melting', 'sár', 'vörtu', 'lyf', 'recept'])) return 'otc';
  if (matchesAny(value, ['vítamín', 'vitamin', 'bætiefni', 'fæðubót', 'steinefni', 'omega', 'now'])) return 'supplement';
  if (matchesAny(value, ['húð', 'snyrti', 'krem', 'serum', 'andlit', 'rakakrem', 'sól', 'hár'])) return 'beauty';
  return 'care';
}

function matchesAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function categorySlugFromSource(sourceUrl: string): string {
  const path = new URL(sourceUrl, LYF_OG_HEILSA_BASE_URL).pathname;
  const match = path.match(/\/page-data\/([^/]+)\//);
  return match?.[1] ?? '';
}

function pageUrlFromPageDataUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl, LYF_OG_HEILSA_BASE_URL);
  const match = url.pathname.match(/^\/page-data\/(.+)\/page-data\.json$/);
  if (!match) return url.toString();
  const pagePath = match[1] === 'index' ? '/' : `/${match[1]}`;
  return new URL(pagePath, LYF_OG_HEILSA_BASE_URL).toString();
}

function visit(value: unknown, onObject: (value: Record<string, unknown>) => void): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) visit(item, onObject);
    return;
  }
  onObject(value as Record<string, unknown>);
  for (const item of Object.values(value)) visit(item, onObject);
}

function jsonHeaders(): RequestInit {
  return {
    headers: {
      accept: 'application/json,text/html;q=0.8',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const url = text(value);
  if (!url) return '';
  return url.startsWith('https://') ? url : new URL(url, baseUrl).toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = text(value).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
