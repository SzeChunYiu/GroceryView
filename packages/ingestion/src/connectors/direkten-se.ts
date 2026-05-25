export type DirektenSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'direkten';
  code: string;
  name: string;
  category: string;
  price: number;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchDirektenSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const DIREKTEN_SE_BASE_URL = 'https://direkten.se';
export const DIREKTEN_SE_DEFAULT_SOURCE_URLS = [DIREKTEN_SE_BASE_URL, `${DIREKTEN_SE_BASE_URL}/kampanjer/`] as const;

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

function rowBlocks(html: string) {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|campaign|kampanj|offer|erbjudande)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
  return blocks.length > 0 ? blocks : [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? '');
}

export function parseDirektenSeProducts(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): DirektenSeProduct[] {
  if (!sourceUrl.includes('direkten.se')) throw new Error('Direkten SE connector only accepts direkten.se source URLs');
  if (/captcha|access denied|cloudflare|logga in/i.test(html)) throw new Error('Direkten SE source blocked/login page');

  const rows: DirektenSeProduct[] = [];
  const seen = new Set<string>();

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
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i]) || `direkten-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);
    rows.push({
      country: 'SE',
      currency: 'SEK',
      chain: 'direkten',
      code,
      name,
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'small-store',
      price,
      priceText: priceText || `${price.toLocaleString('sv-SE')} kr`,
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt
    });
    if (maxRows && rows.length >= maxRows) break;
  }

  return rows;
}

export async function fetchDirektenSeProducts(options: FetchDirektenSeProductsOptions = {}): Promise<DirektenSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? [...DIREKTEN_SE_DEFAULT_SOURCE_URLS];
  const rows: DirektenSeProduct[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 direkten-se-connector (fixture-friendly)'
      }
    });
    if (!response.ok) throw new Error(`Direkten SE request failed for ${sourceUrl}: ${response.status}`);
    rows.push(...parseDirektenSeProducts(await response.text(), sourceUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined));
    if (options.maxRows && rows.length >= options.maxRows) break;
  }

  if (rows.length === 0) throw new Error('Direkten SE connector found no parseable small-store offer rows.');
  return rows;
}
