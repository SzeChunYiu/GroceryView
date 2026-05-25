export type EuroprisNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'europris';
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

export type FetchEuroprisNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const EUROPRIS_NO_BASE_URL = 'https://www.europris.no';
export const EUROPRIS_NO_DEFAULT_SOURCE_URLS = [`${EUROPRIS_NO_BASE_URL}/kampanje`, `${EUROPRIS_NO_BASE_URL}/dagligvare`] as const;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function decodeHtml(value: string) {
  return value.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function textFromHtml(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value: string, sourceUrl: string) {
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string) {
  return value.toLowerCase().replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseNorwegianPrice(value: string) {
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

function productBlocks(html: string) {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|produkt|campaign|tilbud|offer)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
  return blocks.length > 0 ? blocks : [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? '');
}

export function parseEuroprisNoProducts(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): EuroprisNoProduct[] {
  if (!sourceUrl.includes('europris.no')) throw new Error('Europris NO connector only accepts europris.no source URLs');
  if (/captcha|access denied|cloudflare|logg inn/i.test(html)) throw new Error('Europris NO source blocked/login page');

  const rows: EuroprisNoProduct[] = [];
  const seen = new Set<string>();
  for (const block of productBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i, /itemprop=["']name["'][^>]*>([\s\S]*?)</i, /"name"\s*:\s*"([^"]+)"/i, /data-name=["']([^"']+)["']/i]));
    const priceText = textFromHtml(firstMatch(block, [/class=["'][^"']*(?:price|pris)[^"']*["'][^>]*>([\s\S]*?)</i, /"price"\s*:\s*"?([0-9,.]+)"?/i, /data-price=["']([^"']+)["']/i]));
    const price = parseNorwegianPrice(priceText);
    if (!name || price === null) continue;
    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i]) || `europris-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);
    rows.push({ country: 'NO', currency: 'NOK', chain: 'europris', code, name, category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'variety-discount', price, priceText: priceText || `${price.toLocaleString('nb-NO')} kr`, productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl, imageUrl: image ? absoluteUrl(image, sourceUrl) : '', sourceUrl, retrievedAt });
    if (maxRows && rows.length >= maxRows) break;
  }
  return rows;
}

export async function fetchEuroprisNoProducts(options: FetchEuroprisNoProductsOptions = {}): Promise<EuroprisNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: EuroprisNoProduct[] = [];
  for (const sourceUrl of options.sourceUrls ?? EUROPRIS_NO_DEFAULT_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'GroceryView/0.1 europris-no-connector' } });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) throw new Error(`Europris NO source blocked with HTTP ${response.status}.`);
    if (!response.ok) throw new Error(`Europris NO request failed for ${sourceUrl}: ${response.status}`);
    rows.push(...parseEuroprisNoProducts(await response.text(), sourceUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined));
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Europris NO connector found no parseable variety-discount rows.');
  return rows;
}
