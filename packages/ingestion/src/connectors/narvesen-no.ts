export type NarvesenNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'narvesen-no';
  code: string;
  name: string;
  category: string;
  price: number;
  priceText: string;
  promotionText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchNarvesenNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const NARVESEN_NO_BASE_URL = 'https://www.narvesen.no';
export const NARVESEN_NO_DEFAULT_SOURCE_URLS = [
  `${NARVESEN_NO_BASE_URL}/`,
  `${NARVESEN_NO_BASE_URL}/kampanjer/`,
  `${NARVESEN_NO_BASE_URL}/mat-og-drikke/`
] as const;

export function parseNarvesenNoProducts(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): NarvesenNoProduct[] {
  if (!isNarvesenSource(sourceUrl)) throw new Error('Narvesen NO connector only accepts narvesen.no source URLs.');
  if (/captcha|access denied|cloudflare|logg inn/i.test(html)) throw new Error('Narvesen NO source returned a blocked/login page.');

  const rows: NarvesenNoProduct[] = [];
  const seen = new Set<string>();
  for (const block of rowBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [
      /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
      /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /data-name=["']([^"']+)["']/i
    ]));
    const priceText = textFromHtml(firstMatch(block, [
      /class=["'][^"']*(?:price|pris|tilbudspris)[^"']*["'][^>]*>([\s\S]*?)</i,
      /"price"\s*:\s*"?([0-9,.\s]+)"?/i,
      /data-price=["']([^"']+)["']/i
    ]));
    const price = parseNorwegianPrice(priceText);
    if (!name || price === null) continue;

    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /data-product-id=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i, /"id"\s*:\s*"([^"]+)"/i]) || `narvesen-no-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);

    rows.push({
      country: 'NO',
      currency: 'NOK',
      chain: 'narvesen-no',
      code,
      name,
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'convenience',
      price,
      priceText: priceText || `${price.toLocaleString('nb-NO')} kr`,
      promotionText: textFromHtml(firstMatch(block, [/data-promotion=["']([^"']+)["']/i, /class=["'][^"']*(?:campaign|kampanje|offer|tilbud)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i])),
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt
    });
    if (maxRows && rows.length >= maxRows) break;
  }

  if (rows.length === 0) throw new Error('Narvesen NO connector found no parseable convenience rows.');
  return rows;
}

export async function fetchNarvesenNoProducts(options: FetchNarvesenNoProductsOptions = {}): Promise<NarvesenNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? NARVESEN_NO_DEFAULT_SOURCE_URLS;
  const rows: NarvesenNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 narvesen-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Narvesen NO source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Narvesen NO request failed for ${sourceUrl}: ${response.status}`);

    for (const row of parseNarvesenNoProducts(await response.text(), sourceUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

function rowBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|produkt|campaign|kampanje|tilbud|offer|card)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
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

function textFromHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function parseNorwegianPrice(value: string): number | null {
  const match = textFromHtml(value).replace(/\s/g, '').match(/(\d+(?:(?:,|\.)\d{1,2})?)/);
  return match ? Number(match[1]!.replace(',', '.')) : null;
}

function absoluteUrl(value: string, sourceUrl: string): string {
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string): string {
  return value.toLowerCase().replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isNarvesenSource(sourceUrl: string): boolean {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '').toLowerCase() === 'narvesen.no';
  } catch {
    return false;
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
