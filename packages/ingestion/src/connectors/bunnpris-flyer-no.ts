export const BUNNPRIS_FLYER_NO_BASE_URL = 'https://www.bunnpris.no';
export const BUNNPRIS_FLYER_NO_OFFERS_PATH = '/erbjudanden';
export const BUNNPRIS_FLYER_NO_PARSER_VERSION = 'bunnpris-flyer-no-weekly-v1';

export type BunnprisFlyerNoPromotionRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'bunnpris-no';
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
  provenance: { source: 'bunnpris_no_erbjudanden'; parserVersion: string; evidenceText: string };
};

export type FetchBunnprisFlyerNoPromotionsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export function buildBunnprisFlyerNoOffersUrl(baseUrl = BUNNPRIS_FLYER_NO_BASE_URL): string {
  return new URL(BUNNPRIS_FLYER_NO_OFFERS_PATH, baseUrl).toString();
}

export async function fetchBunnprisFlyerNoPromotions(options: FetchBunnprisFlyerNoPromotionsOptions = {}): Promise<BunnprisFlyerNoPromotionRow[]> {
  const sourceUrl = options.sourceUrl ?? buildBunnprisFlyerNoOffersUrl();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 bunnpris-flyer-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Bunnpris NO flyer source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Bunnpris NO flyer source failed with HTTP ${response.status}.`);
  return parseBunnprisFlyerNoPromotions(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString(), options.maxRows);
}

export function parseBunnprisFlyerNoPromotions(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): BunnprisFlyerNoPromotionRow[] {
  if (!/bunnpris\.no/i.test(sourceUrl)) throw new Error('Bunnpris NO flyer connector only accepts bunnpris.no source URLs.');
  if (/captcha|access denied|cloudflare|logg inn/i.test(html)) throw new Error('Bunnpris NO flyer source returned a blocked/login page.');

  const rows: BunnprisFlyerNoPromotionRow[] = [];
  const seen = new Set<string>();
  for (const block of offerBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [
      /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
      /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /data-name=["']([^"']+)["']/i
    ]));
    const priceText = textFromHtml(firstMatch(block, [
      /class=["'][^"']*(?:price|pris|tilbudspris|kampanjepris)[^"']*["'][^>]*>([\s\S]*?)</i,
      /"price"\s*:\s*"?([0-9,.]+)"?/i,
      /data-price=["']([^"']+)["']/i
    ]));
    const price = parseNorwegianPrice(priceText);
    if (!name || price === null) continue;

    const href = firstMatch(block, [/href=["']([^"']+)["']/i, /"url"\s*:\s*"([^"]+)"/i]);
    const image = firstMatch(block, [/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i, /"image"\s*:\s*"([^"]+)"/i]);
    const code = firstMatch(block, [/data-sku=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i, /"id"\s*:\s*"([^"]+)"/i]) || `bunnpris-no-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);

    rows.push({
      country: 'NO',
      currency: 'NOK',
      chain: 'bunnpris-no',
      code,
      name,
      category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'weekly-flyer',
      promotionType: 'weekly_flyer',
      price,
      priceText: priceText || `${price.toLocaleString('nb-NO')} kr`,
      regularPriceText: textFromHtml(firstMatch(block, [/class=["'][^"']*(?:regular|before|forpris|førpris)[^"']*["'][^>]*>([\s\S]*?)</i, /"regularPrice"\s*:\s*"([^"]+)"/i])),
      comparePriceText: textFromHtml(firstMatch(block, [/class=["'][^"']*(?:compare|enhetspris|unit)[^"']*["'][^>]*>([\s\S]*?)</i, /"comparePrice"\s*:\s*"([^"]+)"/i])),
      validFrom: firstMatch(block, [/data-valid-from=["']([^"']+)["']/i, /"validFrom"\s*:\s*"([^"]+)"/i]),
      validTo: firstMatch(block, [/data-valid-to=["']([^"']+)["']/i, /"validTo"\s*:\s*"([^"]+)"/i]),
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt,
      provenance: { source: 'bunnpris_no_erbjudanden', parserVersion: BUNNPRIS_FLYER_NO_PARSER_VERSION, evidenceText: textFromHtml(block).slice(0, 240) }
    });
    if (maxRows && rows.length >= maxRows) break;
  }
  if (rows.length === 0) throw new Error('Bunnpris NO flyer source had no parseable weekly promotion rows.');
  return rows;
}

function offerBlocks(html: string): string[] {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|produkt|campaign|kampanje|tilbud|offer|kundeavis)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
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
  return value.toLocaleLowerCase('nb-NO').replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&aring;/g, 'å')
    .replace(/&aelig;/g, 'æ')
    .replace(/&oslash;/g, 'ø')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}
