export type MustiSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'musti-se';
  retailerType: 'pet_specialty';
  code: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  variantSizes: string[];
  price: number;
  priceText: string;
  available: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchMustiSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const MUSTI_SE_BASE_URL = 'https://www.arkenzoo.se';
export const MUSTI_SE_DEFAULT_SOURCE_URLS = [
  `${MUSTI_SE_BASE_URL}/katt-kattmat`,
  `${MUSTI_SE_BASE_URL}/hund-hundmat`
] as const;
export const MUSTI_SE_PARSER_VERSION = 'musti-se-b17-listing-v1';

export async function fetchMustiSeProducts(options: FetchMustiSeProductsOptions = {}): Promise<MustiSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MustiSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? MUSTI_SE_DEFAULT_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 musti-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Musti SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Musti SE source failed for ${sourceUrl}: HTTP ${response.status}.`);

    for (const product of parseMustiSeProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseMustiSeProducts(html: string, sourceUrl: string, retrievedAt: string): MustiSeProduct[] {
  if (!sourceUrl.includes('arkenzoo.se')) throw new Error('Musti SE connector only accepts arkenzoo.se source URLs');
  if (/captcha|access denied|cloudflare|logga in|logg inn/i.test(html)) throw new Error('Musti SE source blocked/login page.');

  const pageCategory = categoryFromPage(html);
  const seen = new Set<string>();
  const rows: MustiSeProduct[] = [];
  for (const block of productBlocks(html)) {
    const row = normalizeMustiSeProduct(block, sourceUrl, retrievedAt, pageCategory);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
  }
  return rows;
}

export function normalizeMustiSeProduct(block: string, sourceUrl: string, retrievedAt: string, pageCategory = ''): MustiSeProduct | null {
  const productId = attr(block, 'data-id').split(':')[0];
  const productNos = attr(block, 'data-product_no').split(':').map((value) => value.trim()).filter(Boolean);
  const code = productNos[0] || productId;
  const name = attrByClass(block, 'prodbox_title', 'title') || titleText(block) || imageAlt(block);
  const price = money(priceTextFromBlock(block));
  if (!code || !productId || !name || price === null) return null;

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'musti-se',
    retailerType: 'pet_specialty',
    code,
    productId,
    name,
    brand: brandFromTitle(block, name),
    category: categoryFromFilters(block) || pageCategory,
    variantSizes: variantSizes(block),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    available: /\binv_yes\b|På lager|I lager/i.test(block) && !/\binv_no\b|Ej i lager|Slut/i.test(block),
    productUrl: absoluteUrl(productHref(block), sourceUrl),
    imageUrl: absoluteUrl(attr(block, 'data-b17-img') || attr(block, 'src'), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function productBlocks(html: string): string[] {
  const blocks: string[] = [];
  const blockRe = /<div class=["']prodbox\b[\s\S]*?(?=<div data-prod-wrapper\b|<div class=["']list_pager\b|<\/form>)/gi;
  for (const match of html.matchAll(blockRe)) blocks.push(match[0]);
  return blocks;
}

function priceTextFromBlock(block: string): string {
  const inclPrice = block.match(/<div class=["']prodbox_price\s+currency_sek_incl[\s\S]*?<span class=["']price["'][^>]*>([\s\S]*?)<\/span>\s*<\/span>/i)?.[1];
  const anyPrice = block.match(/<span class=["']price["'][^>]*>([\s\S]*?)<\/span>\s*<\/span>/i)?.[1];
  return stripTags(inclPrice ?? anyPrice ?? '');
}

function categoryFromPage(html: string): string {
  return decodeHtml(html.match(/'category':\s*\{\s*'tree':\s*'([^']+)'/i)?.[1] ?? '');
}

function categoryFromFilters(block: string): string {
  const filterValue = attr(block, 'value');
  const category = filterValue.match(/(?:^|[;|])category:([^;|]+)/i)?.[1] ?? '';
  return decodeHtml(category.replace(/&/g, ' > '));
}

function brandFromTitle(block: string, name: string): string {
  const brand = decodeHtml(block.match(/class=["']prodbox_title["'][\s\S]*?<span><b>([\s\S]*?)<\/b><\/span>/i)?.[1] ?? '');
  if (brand) return brand;
  return name.split(/\s+/)[0] ?? '';
}

function titleText(block: string): string {
  const titleBlock = block.match(/class=["']prodbox_title["'][\s\S]*?<\/div>/i)?.[0] ?? '';
  return stripTags(titleBlock);
}

function imageAlt(block: string): string {
  return attr(block, 'alt').replace(/\s+\([^)]*\)$/, '');
}

function variantSizes(block: string): string[] {
  const sizes: string[] = [];
  const sizeRe = /class=["'][^"']*\bprodbox_size\b[^"']*["'][\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of block.matchAll(sizeRe)) {
    const size = stripTags(match[1]);
    if (size && !sizes.includes(size)) sizes.push(size);
  }
  return sizes;
}

function productHref(block: string): string {
  return block.match(/class=["']prodbox_title["'][\s\S]*?<a\b[^>]*href=(["'])(.*?)\1/i)?.[2]
    ?? block.match(/<a\b[^>]*data-product-id=["'][^"']+["'][^>]*href=(["'])(.*?)\1/i)?.[2]
    ?? '';
}

function attrByClass(block: string, className: string, attrName: string): string {
  const tag = block.match(new RegExp(`<[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, 'i'))?.[0] ?? '';
  return attr(tag, attrName);
}

function attr(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}=("|')([\\s\\S]*?)\\1`, 'i'));
  return decodeHtml(match?.[2] ?? '');
}

function money(value: string): number | null {
  const normalized = value.replace(/\s/g, '').replace(/kr|sek/gi, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return '';
  }
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}
