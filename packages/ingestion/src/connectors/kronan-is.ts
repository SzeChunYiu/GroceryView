export type KronanIsChain = 'kronan-is';

export type KronanIsProduct = {
  chain: KronanIsChain;
  code: string;
  name: string;
  price: number;
  priceText: string;
  currency: 'ISK';
  productUrl: string;
  imageUrl: string;
  category: string;
  inStock: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchKronanIsProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const KRONAN_IS_BASE_URL = 'https://kronan.is';
export const DEFAULT_KRONAN_IS_SOURCE_URLS = [
  `${KRONAN_IS_BASE_URL}/collections/oll-vara`
] as const;

export async function fetchKronanIsProducts(options: FetchKronanIsProductsOptions = {}): Promise<KronanIsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: KronanIsProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_KRONAN_IS_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) throw new Error(`Krónan request failed for ${sourceUrl}: ${response.status}`);
    const html = await response.text();
    if (/access denied|captcha|cloudflare|blocked/i.test(html)) {
      throw new Error(`Krónan request blocked for ${sourceUrl}`);
    }
    addRows(rows, seen, parseKronanIsProducts(html, sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) return rows;
  }

  return rows;
}

export function parseKronanIsProducts(html: string, sourceUrl: string, retrievedAt: string): KronanIsProduct[] {
  return [
    ...parseJsonLdProducts(html, sourceUrl, retrievedAt),
    ...parseProductCards(html, sourceUrl, retrievedAt)
  ];
}

function parseJsonLdProducts(html: string, sourceUrl: string, retrievedAt: string): KronanIsProduct[] {
  const rows: KronanIsProduct[] = [];
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const script of scripts) {
    const rawJson = firstMatch(script, /<script\b[^>]*>([\s\S]*?)<\/script>/i);
    const parsed = parseJson(rawJson);
    for (const product of flattenJsonLdProducts(parsed)) {
      const row = kronanProductFromJsonLd(product, sourceUrl, retrievedAt);
      if (row) rows.push(row);
    }
  }
  return rows;
}

function flattenJsonLdProducts(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLdProducts);
  if (!isRecord(value)) return [];
  const type = value['@type'];
  const types = Array.isArray(type) ? type : [type];
  const rows: JsonRecord[] = types.includes('Product') ? [value] : [];
  if (Array.isArray(value['@graph'])) rows.push(...value['@graph'].flatMap(flattenJsonLdProducts));
  if (Array.isArray(value.itemListElement)) {
    for (const item of value.itemListElement) {
      if (isRecord(item) && item.item) rows.push(...flattenJsonLdProducts(item.item));
    }
  }
  return rows;
}

function kronanProductFromJsonLd(product: JsonRecord, sourceUrl: string, retrievedAt: string): KronanIsProduct | null {
  const offers = isRecord(product.offers) ? product.offers : {};
  const name = stringValue(product.name);
  const productUrl = absoluteUrl(stringValue(product.url), sourceUrl);
  const code = stringValue(product.sku) || codeFromUrl(productUrl) || stableCode(name);
  const price = numberFromIcelandicPrice(stringValue(offers.price ?? product.price));
  if (!name || !productUrl || price === null) return null;
  const category = stringValue(product.category);
  const imageUrl = imageFromJsonLd(product.image, sourceUrl);
  const availability = stringValue(offers.availability);
  return {
    chain: 'kronan-is',
    code,
    name,
    price,
    priceText: formatIcelandicPrice(price),
    currency: 'ISK',
    productUrl,
    imageUrl,
    category,
    inStock: !/outofstock|soldout|uppselt/i.test(availability),
    sourceUrl,
    retrievedAt
  };
}

function parseProductCards(html: string, sourceUrl: string, retrievedAt: string): KronanIsProduct[] {
  const blocks = html.match(/<article\b[\s\S]*?<\/article>|<li\b[^>]*data-product[^>]*[\s\S]*?<\/li>/gi) ?? [];
  return blocks
    .map((block) => kronanProductFromCard(block, sourceUrl, retrievedAt))
    .filter((row): row is KronanIsProduct => row !== null);
}

function kronanProductFromCard(block: string, sourceUrl: string, retrievedAt: string): KronanIsProduct | null {
  const productUrl = absoluteUrl(firstMatch(block, /<a\b[^>]*href=["']([^"']+)["']/i), sourceUrl);
  const name = decodeHtml(stripTags(firstMatch(block, /<(?:h2|h3|a)\b[^>]*(?:class=["'][^"']*(?:title|name|product)[^"']*["'])?[^>]*>([\s\S]*?)<\/(?:h2|h3|a)>/i)));
  const priceText = decodeHtml(stripTags(firstMatch(block, /<(?:span|div)\b[^>]*class=["'][^"']*(?:price|amount)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i)));
  const price = numberFromIcelandicPrice(priceText);
  if (!name || !productUrl || price === null) return null;
  const code = firstMatch(block, /data-(?:product-id|sku)=["']([^"']+)["']/i) || codeFromUrl(productUrl) || stableCode(name);
  return {
    chain: 'kronan-is',
    code,
    name,
    price,
    priceText: priceText || formatIcelandicPrice(price),
    currency: 'ISK',
    productUrl,
    imageUrl: absoluteUrl(firstMatch(block, /<img\b[^>]*(?:data-src|src)=["']([^"']+)["']/i), sourceUrl),
    category: decodeHtml(firstMatch(block, /data-category=["']([^"']+)["']/i)),
    inStock: !/out-of-stock|uppselt|ekki\s+til/i.test(block),
    sourceUrl,
    retrievedAt
  };
}

function addRows(rows: KronanIsProduct[], seen: Set<string>, products: readonly KronanIsProduct[], maxRows: number | undefined): void {
  for (const product of products) {
    const key = `${product.chain}:${product.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) return;
  }
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(decodeHtml(value.trim()));
  } catch {
    return null;
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? decodeHtml(value).trim() : '';
}

function imageFromJsonLd(value: unknown, sourceUrl: string): string {
  if (typeof value === 'string') return absoluteUrl(value, sourceUrl);
  if (Array.isArray(value) && typeof value[0] === 'string') return absoluteUrl(value[0], sourceUrl);
  if (isRecord(value)) return absoluteUrl(stringValue(value.url), sourceUrl);
  return '';
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

function formatIcelandicPrice(value: number): string {
  return `${new Intl.NumberFormat('is-IS').format(value)} kr.`;
}

function codeFromUrl(productUrl: string): string {
  if (!productUrl) return '';
  const slug = new URL(productUrl).pathname.replace(/\/$/, '').split('/').pop() ?? '';
  return decodeURIComponent(slug).split('-')[0] ?? '';
}

function stableCode(name: string): string {
  return name.toLocaleLowerCase('is-IS').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  return new URL(value, baseUrl).toString();
}
