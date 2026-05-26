export const BONUS_FLYER_IS_BASE_URL = 'https://bonus.is';
export const BONUS_FLYER_IS_OFFERS_PATH = '/tilbod';
export const BONUS_FLYER_IS_PARSER_VERSION = 'bonus-flyer-is-weekly-v1';

export type BonusFlyerIsPromotionRow = {
  country: 'IS';
  currency: 'ISK';
  chain: 'bonus-is';
  code: string;
  name: string;
  category: string;
  promotionType: 'weekly_flyer';
  price: number;
  priceText: string;
  regularPriceText: string;
  comparePriceText: string;
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: { source: 'bonus_is_tilbod'; parserVersion: string; evidenceText: string };
};

export type FetchBonusFlyerIsPromotionsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export function buildBonusFlyerIsOffersUrl(baseUrl = BONUS_FLYER_IS_BASE_URL): string {
  return new URL(BONUS_FLYER_IS_OFFERS_PATH, baseUrl).toString();
}

export async function fetchBonusFlyerIsPromotions(options: FetchBonusFlyerIsPromotionsOptions = {}): Promise<BonusFlyerIsPromotionRow[]> {
  const sourceUrl = options.sourceUrl ?? buildBonusFlyerIsOffersUrl();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 bonus-flyer-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Bónus IS flyer source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Bónus IS flyer source failed with HTTP ${response.status}.`);
  return parseBonusFlyerIsPromotions(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString(), options.maxRows);
}

export function parseBonusFlyerIsPromotions(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): BonusFlyerIsPromotionRow[] {
  if (!/bonus\.is/i.test(sourceUrl)) throw new Error('Bónus IS flyer connector only accepts bonus.is source URLs.');
  if (/captcha|access denied|cloudflare|innskr[aá]|logg/i.test(html)) throw new Error('Bónus IS flyer source returned a blocked/login page.');

  const rows: BonusFlyerIsPromotionRow[] = [];
  const seen = new Set<string>();
  for (const block of offerBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [
      /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
      /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /data-name=["']([^"']+)["']/i
    ]));
    const priceText = textFromHtml(firstMatch(block, [
      /class=["'][^"']*(?:price|verd|ver[ðd]|tilbo[ðd]sver[ðd])[^"']*["'][^>]*>([\s\S]*?)</i,
      /"price"\s*:\s*"?([0-9.,\s]+)"?/i,
      /data-price=["']([^"']+)["']/i
    ]));
    const price = parseIcelandicPrice(priceText);
    if (!name || price === null) continue;

    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i, /"id"\s*:\s*"([^"]+)"/i]) || `bonus-is-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);

    rows.push({
      country: 'IS',
      currency: 'ISK',
      chain: 'bonus-is',
      code,
      name,
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'weekly-flyer',
      promotionType: 'weekly_flyer',
      price,
      priceText: priceText || `${price.toLocaleString('is-IS')} kr.`,
      regularPriceText: textFromHtml(firstMatch(block, [/class=["'][^"']*(?:regular|before|fyrra|áður)[^"']*["'][^>]*>([\s\S]*?)</i, /"regularPrice"\s*:\s*"([^"]+)"/i])),
      comparePriceText: textFromHtml(firstMatch(block, [/class=["'][^"']*(?:compare|unit|einingarver[ðd])[^"']*["'][^>]*>([\s\S]*?)</i, /"comparePrice"\s*:\s*"([^"]+)"/i])),
      validFrom: firstMatch(block, [/data-valid-from=["']([^"']+)["']/i, /"validFrom"\s*:\s*"([^"]+)"/i]),
      validTo: firstMatch(block, [/data-valid-to=["']([^"']+)["']/i, /"validTo"\s*:\s*"([^"]+)"/i]),
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt,
      provenance: { source: 'bonus_is_tilbod', parserVersion: BONUS_FLYER_IS_PARSER_VERSION, evidenceText: textFromHtml(block).slice(0, 240) }
    });
    if (maxRows && rows.length >= maxRows) break;
  }
  if (rows.length === 0) throw new Error('Bónus IS flyer source had no parseable weekly promotion rows.');
  return rows;
}

function offerBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|vara|campaign|tilbo[ðd]|offer|deal)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
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
  const match = textFromHtml(value).replace(/\s/g, '').match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (!match) return null;
  const parsed = Number(match[1]!.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
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
    .replace(/&aacute;/g, 'á')
    .replace(/&eth;/g, 'ð')
    .replace(/&thorn;/g, 'þ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}
