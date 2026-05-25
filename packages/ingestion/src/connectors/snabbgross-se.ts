export type SnabbgrossSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'snabbgross';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  packageText: string;
  storeId: string;
  storeName: string;
  customerSegment: 'business';
  consumerRelevantForBulkShoppers: true;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchSnabbgrossSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const SNABBGROSS_SE_BASE_URL = 'https://www.snabbgross.se';
export const SNABBGROSS_SE_DEFAULT_SOURCE_URLS = [
  `${SNABBGROSS_SE_BASE_URL}/sortiment/`,
  `${SNABBGROSS_SE_BASE_URL}/kampanjer/`
] as const;

export function parseSnabbgrossSeProducts(
  html: string,
  sourceUrl: string,
  retrievedAt: string,
  maxRows?: number
): SnabbgrossSeProduct[] {
  assertSnabbgrossSource(sourceUrl);
  if (/captcha|access denied|cloudflare|logga in/i.test(html)) throw new Error('Snabbgross SE source blocked/login page');

  const rows: SnabbgrossSeProduct[] = [];
  const seen = new Set<string>();
  const storeId = firstMatch(html, [/data-store-id=["']([^"']+)["']/i, /"storeId"\s*:\s*"([^"]+)"/i]) || 'snabbgross-se-chainwide';
  const storeName = textFromHtml(firstMatch(html, [/data-store-name=["']([^"']+)["']/i, /"storeName"\s*:\s*"([^"]+)"/i])) || 'Snabbgross SE';

  for (const block of rowBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [
      /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
      /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /data-name=["']([^"']+)["']/i
    ]));
    const priceText = textFromHtml(firstMatch(block, [
      /class=["'][^"']*(?:price|pris)[^"']*["'][^>]*>([\s\S]*?)</i,
      /"price"\s*:\s*"?([0-9,.]+)"?/i,
      /data-price=["']([^"']+)["']/i
    ]));
    const price = parseSwedishPrice(priceText);
    if (!name || price === null) continue;

    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i]) || `snabbgross-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);

    rows.push({
      country: 'SE',
      currency: 'SEK',
      chain: 'snabbgross',
      code,
      name,
      brand: textFromHtml(firstMatch(block, [/data-brand=["']([^"']+)["']/i, /"brand"\s*:\s*"([^"]+)"/i])) || 'Snabbgross',
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'wholesale-grocery',
      price,
      priceText: priceText || `${price.toLocaleString('sv-SE')} kr`,
      unitPriceText: textFromHtml(firstMatch(block, [/data-unit-price=["']([^"']+)["']/i, /class=["'][^"']*(?:unit-price|jamforpris|jämförpris)[^"']*["'][^>]*>([\s\S]*?)</i])) || '',
      packageText: textFromHtml(firstMatch(block, [/data-package=["']([^"']+)["']/i, /class=["'][^"']*(?:package|storlek|forpackning|förpackning)[^"']*["'][^>]*>([\s\S]*?)</i])) || '',
      storeId,
      storeName,
      customerSegment: 'business',
      consumerRelevantForBulkShoppers: true,
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt
    });
    if (maxRows && rows.length >= maxRows) break;
  }

  return rows;
}

export async function fetchSnabbgrossSeProducts(options: FetchSnabbgrossSeProductsOptions = {}): Promise<SnabbgrossSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? [...SNABBGROSS_SE_DEFAULT_SOURCE_URLS];
  const rows: SnabbgrossSeProduct[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 snabbgross-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Snabbgross SE request failed for ${sourceUrl}: ${response.status}`);
    rows.push(...parseSnabbgrossSeProducts(await response.text(), sourceUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined));
    if (options.maxRows && rows.length >= options.maxRows) break;
  }

  if (rows.length === 0) throw new Error('Snabbgross SE connector found no parseable wholesale product rows.');
  return rows;
}

function rowBlocks(html: string) {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|produkt|campaign|kampanj|offer|erbjudande)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
  return blocks.length > 0 ? blocks : [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? '');
}

function assertSnabbgrossSource(sourceUrl: string): void {
  const hostname = new URL(sourceUrl).hostname;
  if (hostname !== 'snabbgross.se' && hostname !== 'www.snabbgross.se') {
    throw new Error('Snabbgross SE connector only accepts snabbgross.se source URLs');
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aring;/gi, 'å')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö');
}

function textFromHtml(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(value: string, sourceUrl: string) {
  try {
    return new URL(decodeHtml(value), sourceUrl).toString();
  } catch {
    return '';
  }
}

function slugFor(value: string) {
  return value.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseSwedishPrice(value: string) {
  const match = textFromHtml(value).replace(/\s/g, '').match(/(\d+(?:(?:,|\.)\d{1,2})?)/);
  return match ? Number(match[1]!.replace(',', '.')) : null;
}

function firstMatch(value: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}
