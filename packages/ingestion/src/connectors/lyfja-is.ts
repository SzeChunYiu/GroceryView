export const LYFJA_IS_BASE_URL = 'https://www.lyfja.is';
export const LYFJA_IS_STORE_URL = `${LYFJA_IS_BASE_URL}/store/`;
export const LYFJA_IS_OFFERS_URL = `${LYFJA_IS_BASE_URL}/verslun/tilbod/`;
export const LYFJA_IS_PARSER_VERSION = 'lyfja-is-html-products-v1';

export type LyfjaIsProductCategory = 'otc' | 'supplement' | 'beauty' | 'care' | 'gift';

export type LyfjaIsProductRow = {
  country: 'IS';
  currency: 'ISK';
  chain: 'lyfja';
  retailerType: 'pharmacy';
  code: string;
  name: string;
  category: LyfjaIsProductCategory;
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
  provenance: {
    source: 'lyfja_is_store_page';
    parserVersion: typeof LYFJA_IS_PARSER_VERSION;
    evidenceText: string;
  };
};

export type FetchLyfjaIsProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

export async function fetchLyfjaIsProducts(options: FetchLyfjaIsProductsOptions = {}): Promise<LyfjaIsProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LyfjaIsProductRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? [LYFJA_IS_STORE_URL, LYFJA_IS_OFFERS_URL]) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 lyfja-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Lyfja IS source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Lyfja IS source failed with HTTP ${response.status}.`);
    for (const row of parseLyfjaIsProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  if (rows.length === 0) throw new Error('Lyfja IS source had no parseable product rows.');
  return rows;
}

export function parseLyfjaIsProducts(html: string, sourceUrl = LYFJA_IS_STORE_URL, retrievedAt = new Date().toISOString()): LyfjaIsProductRow[] {
  assertLyfjaSource(sourceUrl);
  if (/captcha|access denied|cloudflare|innskr[aá]|logg/i.test(html)) throw new Error('Lyfja IS source returned a blocked/login page.');

  const rows: LyfjaIsProductRow[] = [];
  const seen = new Set<string>();
  for (const block of productBlocks(html)) {
    const row = normalizeProductBlock(block, sourceUrl, retrievedAt);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
  }
  return rows;
}

function normalizeProductBlock(block: string, sourceUrl: string, retrievedAt: string): LyfjaIsProductRow | null {
  const evidenceText = textFromHtml(block);
  const name = textFromHtml(firstMatch(block, [
    /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
    /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
    /"name"\s*:\s*"([^"]+)"/i,
    /data-name=["']([^"']+)["']/i
  ]));
  const priceTexts = priceTextMatches(block, evidenceText);
  const prices = priceTexts.map(parseIcelandicPrice).filter((price): price is number => price !== null);
  if (!name || prices.length === 0) return null;

  const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
  const productUrl = href ? absoluteUrl(href, sourceUrl) : sourceUrl;
  const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i, /"id"\s*:\s*"([^"]+)"/i]) || codeFromUrlOrName(productUrl, name);
  const image = firstMatch(block, [/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
  const discountPercent = parseDiscountPercent(evidenceText);
  const price = prices[prices.length - 1]!;
  const originalPrice = prices.length > 1 && prices[0]! > price ? prices[0]! : null;
  const categorySlug = categorySlugFromSource(sourceUrl);

  return {
    country: 'IS',
    currency: 'ISK',
    chain: 'lyfja',
    retailerType: 'pharmacy',
    code,
    name,
    category: lyfjaCategory(`${categorySlug} ${name}`),
    categorySlug,
    price,
    priceText: priceTexts[priceTexts.length - 1] ?? `${Math.round(price)} kr.`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : priceTexts[0] ?? `${Math.round(originalPrice)} kr.`,
    discountPercent,
    productUrl,
    imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
    sourceUrl,
    retrievedAt,
    provenance: { source: 'lyfja_is_store_page', parserVersion: LYFJA_IS_PARSER_VERSION, evidenceText: evidenceText.slice(0, 240) }
  };
}

function assertLyfjaSource(sourceUrl: string): void {
  if (!/^https:\/\/(?:www\.)?lyfja\.is\//i.test(sourceUrl)) throw new Error('Lyfja connector only accepts lyfja.is source URLs.');
}

function productBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|vara|woocommerce|card|item)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
  if (blocks.length > 0) return blocks;
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? '');
}

function firstMatch(value: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

function priceTextMatches(block: string, evidenceText: string): string[] {
  const classPrices = [...block.matchAll(/class=["'][^"']*(?:price|verd|ver[ðd]|amount)[^"']*["'][^>]*>([\s\S]*?)</gi)]
    .map((match) => textFromHtml(match[1] ?? ''))
    .filter((value) => /\d/.test(value));
  if (classPrices.length > 0) return classPrices;
  return [...evidenceText.matchAll(/\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?\s*kr\.?/gi)].map((match) => match[0]);
}

function textFromHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function parseIcelandicPrice(value: string): number | null {
  const match = textFromHtml(value).match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (!match) return null;
  const parsed = Number(match[1]!.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDiscountPercent(value: string): number {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*%/);
  if (!match) return 0;
  const parsed = Number(match[1]!.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function lyfjaCategory(value: string): LyfjaIsProductCategory {
  const normalized = value.toLocaleLowerCase('is-IS');
  if (matchesAny(normalized, ['gjafabréf', 'gjafapoki'])) return 'gift';
  if (matchesAny(normalized, ['verk', 'hiti', 'kvef', 'ofnæmi', 'melting', 'lyf', 'nefúði', 'mg ', 'mcg'])) return 'otc';
  if (matchesAny(normalized, ['vítamín', 'vitamin', 'bætiefni', 'fæðubót', 'omega', 'steinefni'])) return 'supplement';
  if (matchesAny(normalized, ['húð', 'snyrti', 'krem', 'cream', 'serum', 'andlit', 'sól', 'hár', 'spf'])) return 'beauty';
  return 'care';
}

function matchesAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function categorySlugFromSource(sourceUrl: string): string {
  const segments = new URL(sourceUrl, LYFJA_IS_BASE_URL).pathname.split('/').filter(Boolean);
  const categoryIndex = segments.findIndex((segment) => segment === 'verslun' || segment === 'voerumerki');
  return categoryIndex >= 0 ? segments[categoryIndex + 1] ?? 'store' : segments[0] ?? 'store';
}

function codeFromUrlOrName(productUrl: string, name: string): string {
  const segments = new URL(productUrl, LYFJA_IS_BASE_URL).pathname.split('/').filter(Boolean);
  return segments.at(-1) ?? slugFor(name);
}

function absoluteUrl(value: string, sourceUrl: string): string {
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string): string {
  return value.toLocaleLowerCase('is-IS').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[ðþ]/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}
