export const ICELAND_FLYER_IS_BASE_URL = 'https://www.samkaup.is';
export const ICELAND_FLYER_IS_OFFERS_PATH = '/velduverslun/';
export const ICELAND_FLYER_IS_PARSER_VERSION = 'iceland-flyer-is-samkaup-v1';

export type IcelandFlyerIsChain = 'iceland-is' | 'netto-is' | 'kjorbudin-is' | 'krambudin-is' | 'samkaup-is';

export type IcelandFlyerIsPromotionRow = {
  country: 'IS';
  currency: 'ISK';
  chain: IcelandFlyerIsChain;
  code: string;
  name: string;
  category: string;
  promotionType: 'weekly_flyer';
  price: number;
  priceText: string;
  comparePriceText: string;
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: { source: 'samkaup_family_flyer'; parserVersion: string; evidenceText: string };
};

export type FetchIcelandFlyerIsPromotionsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export function buildIcelandFlyerIsOffersUrl(baseUrl = ICELAND_FLYER_IS_BASE_URL): string {
  return new URL(ICELAND_FLYER_IS_OFFERS_PATH, baseUrl).toString();
}

export async function fetchIcelandFlyerIsPromotions(options: FetchIcelandFlyerIsPromotionsOptions = {}): Promise<IcelandFlyerIsPromotionRow[]> {
  const sourceUrl = options.sourceUrl ?? buildIcelandFlyerIsOffersUrl();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 iceland-flyer-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Iceland/Samkaup flyer source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Iceland/Samkaup flyer source failed with HTTP ${response.status}.`);
  return parseIcelandFlyerIsPromotions(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString(), options.maxRows);
}

export function parseIcelandFlyerIsPromotions(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): IcelandFlyerIsPromotionRow[] {
  if (!isAllowedSource(sourceUrl)) throw new Error('Iceland/Samkaup flyer connector only accepts Samkaup-family source URLs.');
  if (/captcha|access denied|cloudflare|innskr[aá]ning|login/i.test(html)) throw new Error('Iceland/Samkaup flyer source returned a blocked/login page.');

  const rows: IcelandFlyerIsPromotionRow[] = [];
  const seen = new Set<string>();
  for (const block of offerBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i, /itemprop=["']name["'][^>]*>([\s\S]*?)</i, /"name"\s*:\s*"([^"]+)"/i, /data-name=["']([^"']+)["']/i]));
    const priceText = textFromHtml(firstMatch(block, [/class=["'][^"']*(?:price|verd|verð|amount)[^"']*["'][^>]*>([\s\S]*?)</i, /"price"\s*:\s*"?([0-9.,\s]+)"?/i, /data-price=["']([^"']+)["']/i]));
    const price = parseIcelandicPrice(priceText);
    if (!name || price === null) continue;

    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const chain = chainFromBlock(block, sourceUrl);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /data-product-id=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i, /"id"\s*:\s*"([^"]+)"/i]) || `${chain}-${slugFor(name)}`;
    const dedupeKey = `${chain}:${code}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    rows.push({
      country: 'IS',
      currency: 'ISK',
      chain,
      code,
      name,
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'weekly-flyer',
      promotionType: 'weekly_flyer',
      price,
      priceText: priceText || `${price.toLocaleString('is-IS')} kr.`,
      comparePriceText: textFromHtml(firstMatch(block, [/class=["'][^"']*(?:compare|unit|einingarverd|einingarverð)[^"']*["'][^>]*>([\s\S]*?)</i, /"comparePrice"\s*:\s*"([^"]+)"/i])),
      validFrom: firstMatch(block, [/data-valid-from=["']([^"']+)["']/i, /"validFrom"\s*:\s*"([^"]+)"/i]),
      validTo: firstMatch(block, [/data-valid-to=["']([^"']+)["']/i, /"validTo"\s*:\s*"([^"]+)"/i]),
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt,
      provenance: { source: 'samkaup_family_flyer', parserVersion: ICELAND_FLYER_IS_PARSER_VERSION, evidenceText: textFromHtml(block).slice(0, 240) }
    });
    if (maxRows && rows.length >= maxRows) break;
  }
  if (rows.length === 0) throw new Error('Iceland/Samkaup flyer source had no parseable weekly promotion rows.');
  return rows;
}

function offerBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|vara|campaign|tilbod|tilboð|offer|kort|card)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
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

function parseIcelandicPrice(value: string): number | null {
  const text = textFromHtml(value).replace(/\s/g, '');
  const match = text.match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/);
  if (!match?.[1]) return null;
  const normalized = match[1].replace(/\./g, '') + (match[2] ? `.${match[2]}` : '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function chainFromBlock(block: string, sourceUrl: string): IcelandFlyerIsChain {
  const haystack = `${sourceUrl} ${stripAccents(textFromHtml(block))}`.toLowerCase();
  if (/kjorbudin|kjorbuðin|kjörbudin|kjörbuðin/.test(haystack)) return 'kjorbudin-is';
  if (/krambudin|krambuðin|krambúdin|krambúðin/.test(haystack)) return 'krambudin-is';
  if (/netto|nettó/.test(haystack)) return 'netto-is';
  if (/iceland/.test(haystack)) return 'iceland-is';
  return 'samkaup-is';
}

function isAllowedSource(sourceUrl: string): boolean {
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, '').toLowerCase();
    return ['samkaup.is', 'netto.is', 'kjorbudin.is', 'krambudin.is', 'icelandbudir.is'].includes(host);
  } catch {
    return false;
  }
}

function absoluteUrl(value: string, sourceUrl: string): string {
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string): string {
  return stripAccents(value).toLowerCase().replace(/ð/g, 'd').replace(/þ/g, 'th').replace(/æ/g, 'ae').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripAccents(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}
