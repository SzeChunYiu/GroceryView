import type { ApohemProduct, PharmacyProductCategory } from './apohem.js';

export type LloydsApotekProduct = ApohemProduct & { chain: 'lloyds-apotek-se' };

export type FetchLloydsApotekProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const LLOYDS_APOTEK_BASE_URL = 'https://dozapotek.se';
export const LLOYDS_APOTEK_LEGACY_BASE_URL = 'https://www.lloydsapotek.se';

export const DEFAULT_LLOYDS_APOTEK_SOURCE_URLS = [
  'https://dozapotek.se/egenvard/feber-och-vark/febernedsattande/paracetamol',
  'https://dozapotek.se/egenvard/mage-och-tarm',
  'https://dozapotek.se/kost-halsa/kosttillskott-och-vitaminer',
  'https://dozapotek.se/skonhet-kroppsvard/solskydd-och-solkram',
  'https://dozapotek.se/mun-och-tander'
] as const;

export async function fetchLloydsApotekProducts(options: FetchLloydsApotekProductsOptions = {}): Promise<LloydsApotekProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LloydsApotekProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_LLOYDS_APOTEK_SOURCE_URLS) {
    const absoluteSourceUrl = absoluteUrl(sourceUrl, LLOYDS_APOTEK_BASE_URL);
    const response = await fetchImpl(absoluteSourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Lloyds Apotek request failed for ${absoluteSourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseLloydsApotekProducts(await response.text(), absoluteSourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) {
      return rows;
    }
  }

  return rows;
}

export function parseLloydsApotekProducts(html: string, sourceUrl: string, retrievedAt: string): LloydsApotekProduct[] {
  const products: LloydsApotekProduct[] = [];
  const seenChunks = new Set<string>();

  for (const match of html.matchAll(/<form\b[\s\S]*?\bproduct-item\b[\s\S]*?<\/form>/gi)) {
    const chunk = match[0];
    seenChunks.add(chunk);
    const product = parseProductCard(chunk, sourceUrl, retrievedAt);
    if (product) products.push(product);
  }

  for (const match of html.matchAll(/<div\b[^>]*\blipscore-rating-small\b[^>]*>/gi)) {
    const chunk = match[0];
    if (seenChunks.has(chunk)) continue;
    const product = parseLipscoreProduct(chunk, sourceUrl, retrievedAt);
    if (product) products.push(product);
  }

  const deduped = new Map<string, LloydsApotekProduct>();
  for (const product of products) {
    const key = product.ean || product.code;
    if (!deduped.has(key)) deduped.set(key, product);
  }
  return [...deduped.values()];
}

function parseProductCard(chunk: string, sourceUrl: string, retrievedAt: string): LloydsApotekProduct | null {
  const code = attributeValue(chunk, /<input\b[^>]*name=["']product["'][^>]*>/i, 'value')
    || attributeValue(chunk, /data-product-id=["'][^"']+["']/i, 'data-product-id')
    || productCodeFromUrl(attributeValue(chunk, /<a\b[^>]*\bproduct-item-link\b[^>]*>/i, 'href'));
  const productUrl = absoluteUrl(attributeValue(chunk, /<a\b[^>]*\bproduct-item-link\b[^>]*>/i, 'href'), LLOYDS_APOTEK_BASE_URL);
  const imageUrl = absoluteUrl(attributeValue(chunk, /<img\b(?=[^>]*\b(?:small_image|object-contain|catalog\/product)\b)[^>]*>/i, 'src'), LLOYDS_APOTEK_BASE_URL);
  const ean = eanFromImageUrl(imageUrl) || eanFromText(chunk);
  const name = cleanText(innerHtml(chunk, /<a\b[^>]*\bproduct-item-link\b[^>]*>([\s\S]*?)<\/a>/i))
    || decodeHtml(attributeValue(chunk, /<img\b(?=[^>]*\b(?:small_image|object-contain|catalog\/product)\b)[^>]*>/i, 'alt'));
  const price = numberFromText(attributeValue(chunk, /<span\b(?=[^>]*data-price-type=["']finalPrice["'])[^>]*>/i, 'data-price-amount'));

  if (!code || !ean || !name || price === null) {
    return null;
  }

  const originalPrice = numberFromText(attributeValue(chunk, /<span\b(?=[^>]*data-price-type=["']oldPrice["'])[^>]*>/i, 'data-price-amount'));
  return {
    chain: 'lloyds-apotek-se',
    code,
    ean,
    name,
    brand: brandFromName(name),
    category: lloydsCategory(sourceUrl, chunk),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} SEK`,
    vatPercent: null,
    stockStatus: stockStatus(chunk),
    productUrl,
    imageUrl,
    isOtc: isOtcProduct(sourceUrl, chunk),
    sourceUrl,
    retrievedAt
  };
}

function parseLipscoreProduct(chunk: string, sourceUrl: string, retrievedAt: string): LloydsApotekProduct | null {
  const code = decodeHtml(attribute(chunk, 'data-ls-sku'));
  const productUrl = absoluteUrl(attribute(chunk, 'data-ls-product-url'), LLOYDS_APOTEK_BASE_URL);
  const imageUrl = absoluteUrl(attribute(chunk, 'data-ls-image-url'), LLOYDS_APOTEK_BASE_URL);
  const ean = eanFromText(attribute(chunk, 'data-ls-gtin')) || eanFromImageUrl(imageUrl);
  const name = decodeHtml(attribute(chunk, 'data-ls-product-name'));
  const price = numberFromText(attribute(chunk, 'data-ls-price'));
  if (!code || !ean || !name || price === null) {
    return null;
  }
  return {
    chain: 'lloyds-apotek-se',
    code,
    ean,
    name,
    brand: decodeHtml(attribute(chunk, 'data-ls-brand')) || brandFromName(name),
    category: lloydsCategory(sourceUrl, `${chunk} ${attribute(chunk, 'data-ls-category')}`),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    originalPrice: null,
    originalPriceText: '',
    vatPercent: null,
    stockStatus: attribute(chunk, 'data-ls-availability') === '0' ? 'out_of_stock' : 'in_stock',
    productUrl,
    imageUrl,
    isOtc: isOtcProduct(sourceUrl, chunk),
    sourceUrl,
    retrievedAt
  };
}

function addRows(
  rows: LloydsApotekProduct[],
  seen: Set<string>,
  products: readonly LloydsApotekProduct[],
  maxRows: number | undefined
): void {
  for (const product of products) {
    const key = `${product.chain}:${product.ean}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) return;
  }
}

function lloydsCategory(sourceUrl: string, chunk: string): PharmacyProductCategory {
  const haystack = `${sourceUrl} ${decodeHtml(chunk)}`.toLowerCase();
  if (haystack.includes('läkemedel') || haystack.includes('lakemedel') || haystack.includes('bipacksedeln') || haystack.includes('/egenvard/')) {
    return 'otc';
  }
  if (haystack.includes('kost') || haystack.includes('vitamin') || haystack.includes('mineral') || haystack.includes('protein')) {
    return 'supplement';
  }
  return 'beauty';
}

function isOtcProduct(sourceUrl: string, chunk: string): boolean {
  return lloydsCategory(sourceUrl, chunk) === 'otc';
}

function stockStatus(chunk: string): string {
  if (/Ej\s+i\s+lager|Slut\s+i\s+lager|data-ls-availability=["']0["']/i.test(decodeHtml(chunk))) {
    return 'out_of_stock';
  }
  if (/<button\b[^>]*aria-label=["']K/i.test(chunk) || />\s*Köp\s*</i.test(decodeHtml(chunk))) {
    return 'in_stock';
  }
  return '';
}

function brandFromName(name: string): string {
  const trimmed = name.trim();
  const firstPart = trimmed.split(',')[0]?.trim() ?? trimmed;
  const words = firstPart.split(/\s+/).filter(Boolean);
  return words.slice(0, Math.min(words.length, 2)).join(' ');
}

function productCodeFromUrl(url: string): string {
  const match = url.match(/-(\d{5,8})(?:[/?#]|$)/);
  return match?.[1] ?? '';
}

function eanFromImageUrl(url: string): string {
  const decoded = decodeURIComponent(url);
  const candidates = [...decoded.matchAll(/(?:^|\D)(\d{8,14})(?:\D|$)/g)].map((match) => match[1]);
  return candidates.find((candidate) => candidate.length >= 8 && candidate.length <= 14) ?? '';
}

function eanFromText(value: unknown): string {
  const ean = text(value).replace(/\D/g, '');
  return ean.length >= 8 && ean.length <= 14 ? ean : '';
}

function attributeValue(chunk: string, tagPattern: RegExp, name: string): string {
  const tag = chunk.match(tagPattern)?.[0] ?? '';
  return decodeHtml(attribute(tag, name));
}

function attribute(tag: string, name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`${escapedName}=["']([^"']*)["']`, 'i'));
  return match?.[1] ?? '';
}

function innerHtml(chunk: string, pattern: RegExp): string {
  return chunk.match(pattern)?.[1] ?? '';
}

function cleanText(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: unknown): string {
  return text(value)
    .replace(/&nbsp;|&#xA0;/gi, ' ')
    .replace(/&#x([\da-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = text(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const url = decodeHtml(value);
  if (!url) return '';
  return url.startsWith('https://') ? url : new URL(url, baseUrl).toString();
}
