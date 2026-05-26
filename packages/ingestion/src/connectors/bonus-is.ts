import { inferBonusIsGroceryCategory, type GroceryCategoryInference } from '@groceryview/catalog';

export type BonusIsChain = 'bonus-is';

export const BONUS_IS_STORE_BASE_URL = 'https://verslun.bonus.is';
export const DEFAULT_BONUS_IS_PRODUCT_URLS = [
  `${BONUS_IS_STORE_BASE_URL}/`,
  `${BONUS_IS_STORE_BASE_URL}/en/`
] as const;

export type BonusIsProduct = {
  chain: BonusIsChain;
  code: string;
  name: string;
  categoryPath: string[];
  categorySlug: string;
  categoryConfidence: GroceryCategoryInference['confidence'];
  categoryMatchedKeyword: string;
  categorySource: GroceryCategoryInference['source'];
  price: number;
  priceText: string;
  currency: 'ISK';
  unitPrice: null;
  unitPriceText: null;
  productUrl: string;
  imageUrl: string;
  inStock: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

export const BONUS_IS_SOURCE_RESEARCH = {
  officialSite: 'https://bonus.is/',
  catalogUrl: BONUS_IS_STORE_BASE_URL,
  robotsTxt: 'https://verslun.bonus.is/robots.txt',
  accessStatus: 'public_woocommerce_html',
  legalConstraint: 'robots.txt allows the storefront and sitemap while blocking WooCommerce logs, uploads, wp-admin, and add-to-cart URLs; connector must avoid cart/session endpoints and keep request volume bounded.',
  priceEvidence: 'Storefront product cards expose ISK item prices in WooCommerce price spans.',
  unitPriceEvidence: 'No stable unit-price field is present in the public product-card HTML fixture, so unitPrice remains null instead of inferred from names or package text.',
  checkedAt: '2026-05-25T17:59:32.000Z'
} as const;

export type FetchBonusIsProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export type BonusIsConnectorHealth = {
  chain: BonusIsChain;
  checkedAt: string;
  sourceUrls: readonly string[];
  requestedMaxRows: number;
  rowCount: number;
  nonEmptyFields: {
    name: number;
    price: number;
    productUrl: number;
    imageUrl: number;
  };
  ok: boolean;
  error?: string;
};

export async function checkBonusIsConnectorHealth(options: FetchBonusIsProductsOptions = {}): Promise<BonusIsConnectorHealth> {
  const requestedMaxRows = options.maxRows ?? 5;
  const sourceUrls = options.sourceUrls ?? DEFAULT_BONUS_IS_PRODUCT_URLS;
  const checkedAt = options.retrievedAt ?? new Date().toISOString();

  try {
    const rows = await fetchBonusIsProducts({ ...options, sourceUrls, maxRows: requestedMaxRows, retrievedAt: checkedAt });
    const nonEmptyFields = countNonEmptyBonusIsFields(rows);
    const allRowsHaveRequiredFields = rows.length > 0
      && nonEmptyFields.name === rows.length
      && nonEmptyFields.price === rows.length
      && nonEmptyFields.productUrl === rows.length
      && nonEmptyFields.imageUrl === rows.length;

    return {
      chain: 'bonus-is',
      checkedAt,
      sourceUrls,
      requestedMaxRows,
      rowCount: rows.length,
      nonEmptyFields,
      ok: allRowsHaveRequiredFields
    };
  } catch (error) {
    return {
      chain: 'bonus-is',
      checkedAt,
      sourceUrls,
      requestedMaxRows,
      rowCount: 0,
      nonEmptyFields: { name: 0, price: 0, productUrl: 0, imageUrl: 0 },
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function fetchBonusIsProducts(options: FetchBonusIsProductsOptions = {}): Promise<BonusIsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: BonusIsProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_BONUS_IS_PRODUCT_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Bónus request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseBonusIsProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) return rows;
  }

  return rows;
}

export function parseBonusIsProducts(html: string, sourceUrl: string, retrievedAt: string): BonusIsProduct[] {
  const productBlocks = html.match(/<li\b[^>]*class=["'][^"']*\bproduct\b[^"']*["'][\s\S]*?<\/li>/gi) ?? [];
  return productBlocks
    .map((block) => normalizeBonusIsProduct(block, sourceUrl, retrievedAt))
    .filter((product): product is BonusIsProduct => product !== null);
}

export function normalizeBonusIsProduct(block: string, sourceUrl: string, retrievedAt: string): BonusIsProduct | null {
  const productUrl = absoluteUrl(firstMatch(block, /<a\b[^>]*href=["']([^"']+)["']/i), sourceUrl);
  const name = decodeHtml(stripTags(firstMatch(block, /<h2\b[^>]*class=["'][^"']*woocommerce-loop-product__title[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i)));
  const priceText = decodeHtml(stripTags(firstMatch(block, /<span\b[^>]*class=["'][^"']*woocommerce-Price-amount[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)));
  const price = numberFromIcelandicPrice(priceText);
  if (!name || !productUrl || price === null) return null;

  const code = decodeHtml(stripTags(firstMatch(block, /<(?:span|div|p)\b[^>]*class=["'][^"']*sku[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div|p)>/i)))
    || slugFromProductUrl(productUrl)
    || stableCode(name);
  const imageUrl = absoluteUrl(firstMatch(block, /<img\b[^>]*(?:data-src|src)=["']([^"']+)["']/i), sourceUrl);
  const outOfStock = /outofstock|out of stock|ekki\s+til\s+á\s+lager/i.test(block);
  const category = inferBonusIsGroceryCategory({ name, productUrl });

  return {
    chain: 'bonus-is',
    code,
    name,
    categoryPath: category.categoryPath,
    categorySlug: category.categorySlug,
    categoryConfidence: category.confidence,
    categoryMatchedKeyword: category.matchedKeyword,
    categorySource: category.source,
    price,
    priceText,
    currency: 'ISK',
    unitPrice: null,
    unitPriceText: null,
    productUrl,
    imageUrl,
    inStock: !outOfStock,
    sourceUrl,
    retrievedAt
  };
}

function countNonEmptyBonusIsFields(rows: readonly BonusIsProduct[]): BonusIsConnectorHealth['nonEmptyFields'] {
  return {
    name: rows.filter((row) => row.name.trim().length > 0).length,
    price: rows.filter((row) => Number.isFinite(row.price)).length,
    productUrl: rows.filter((row) => row.productUrl.trim().length > 0).length,
    imageUrl: rows.filter((row) => row.imageUrl.trim().length > 0).length
  };
}

function addRows(rows: BonusIsProduct[], seen: Set<string>, products: readonly BonusIsProduct[], maxRows: number | undefined): void {
  for (const product of products) {
    const key = `${product.chain}:${product.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) return;
  }
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function firstMatch(value: string, pattern: RegExp): string {
  return pattern.exec(value)?.[1]?.trim() ?? '';
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function numberFromIcelandicPrice(value: string): number | null {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugFromProductUrl(productUrl: string): string {
  const pathname = new URL(productUrl).pathname.replace(/\/$/, '');
  return decodeURIComponent(pathname.split('/').pop() ?? '');
}

function stableCode(name: string): string {
  return name.toLocaleLowerCase('is-IS').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  return new URL(value, baseUrl).toString();
}
