export const REMA_1000_FLYER_NO_BASE_URL = 'https://www.rema.no';
export const REMA_1000_FLYER_NO_OFFERS_PATH = '/kampanjevarer/';
export const REMA_1000_FLYER_NO_PARSER_VERSION = 'rema-1000-flyer-no-weekly-v1';

export type Rema1000FlyerNoPromotionRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'rema-1000-no';
  code: string;
  name: string;
  category: string;
  promotionType: 'weekly_flyer' | 'app_discount';
  price: number | null;
  priceText: string;
  discountText: string;
  discountPercent: number | null;
  is_member_price: boolean;
  requiresApp: boolean;
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: { source: 'rema_no_kampanjevarer'; parserVersion: string; evidenceText: string };
};

export type FetchRema1000FlyerNoPromotionsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export function buildRema1000FlyerNoOffersUrl(baseUrl = REMA_1000_FLYER_NO_BASE_URL): string {
  return new URL(REMA_1000_FLYER_NO_OFFERS_PATH, baseUrl).toString();
}

export async function fetchRema1000FlyerNoPromotions(options: FetchRema1000FlyerNoPromotionsOptions = {}): Promise<Rema1000FlyerNoPromotionRow[]> {
  const sourceUrl = options.sourceUrl ?? buildRema1000FlyerNoOffersUrl();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 rema-1000-flyer-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`REMA 1000 NO flyer source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`REMA 1000 NO flyer source failed with HTTP ${response.status}.`);
  return parseRema1000FlyerNoPromotions(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString(), options.maxRows);
}

export function parseRema1000FlyerNoPromotions(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): Rema1000FlyerNoPromotionRow[] {
  if (!/rema\.no/i.test(sourceUrl)) throw new Error('REMA 1000 NO flyer connector only accepts rema.no source URLs.');
  if (/captcha|access denied|cloudflare|logg inn/i.test(html)) throw new Error('REMA 1000 NO flyer source returned a blocked/login page.');

  const rows: Rema1000FlyerNoPromotionRow[] = [];
  const seen = new Set<string>();
  for (const block of offerBlocks(html)) {
    const evidenceText = textFromHtml(block);
    const name = textFromHtml(firstMatch(block, [
      /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
      /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /data-name=["']([^"']+)["']/i
    ]));
    if (!name) continue;

    const priceText = textFromHtml(firstMatch(block, [
      /class=["'][^"']*(?:price|pris|tilbudspris|medlemspris)[^"']*["'][^>]*>([\s\S]*?)</i,
      /"price"\s*:\s*"?([0-9,.]+)"?/i,
      /data-price=["']([^"']+)["']/i
    ]));
    const price = parseNorwegianPrice(priceText);
    const discountText = discountFromText(evidenceText);
    const discountPercent = parseDiscountPercent(discountText || evidenceText);
    const requiresApp = /REMA-appen|Rema-appen|appen|Aktiver|strekkoden din|betalingsm[aå]tene/i.test(evidenceText);
    const isMemberPrice = requiresApp || /medlem|personlige priskutt|bonus|priskutt rett i kassa/i.test(evidenceText);
    if (price === null && !discountText && !isMemberPrice) continue;

    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i, /"id"\s*:\s*"([^"]+)"/i]) || `rema-1000-no-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);

    rows.push({
      country: 'NO',
      currency: 'NOK',
      chain: 'rema-1000-no',
      code,
      name,
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'weekly-flyer',
      promotionType: isMemberPrice ? 'app_discount' : 'weekly_flyer',
      price,
      priceText: priceText || '',
      discountText,
      discountPercent,
      is_member_price: isMemberPrice,
      requiresApp,
      validFrom: firstMatch(block, [/data-valid-from=["']([^"']+)["']/i, /"validFrom"\s*:\s*"([^"]+)"/i]),
      validTo: firstMatch(block, [/data-valid-to=["']([^"']+)["']/i, /"validTo"\s*:\s*"([^"]+)"/i]),
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt,
      provenance: { source: 'rema_no_kampanjevarer', parserVersion: REMA_1000_FLYER_NO_PARSER_VERSION, evidenceText: evidenceText.slice(0, 240) }
    });
    if (maxRows && rows.length >= maxRows) break;
  }
  if (rows.length === 0) throw new Error('REMA 1000 NO flyer source had no parseable weekly promotion rows.');
  return rows;
}

function offerBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|produkt|campaign|kampanje|tilbud|offer|priskutt|bonus)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
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

function discountFromText(value: string): string {
  return value.match(/(?:Spar|F[aå]|Tjen|Bonus|Priskutt)[^.]*?(?:\d+\s*%|rett i kassa|Bonus)/i)?.[0] ?? '';
}

function parseDiscountPercent(value: string): number | null {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*%/);
  if (!match) return null;
  const parsed = Number(match[1]!.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(value: string, sourceUrl: string): string {
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string): string {
  return value.toLowerCase().replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}
