export const HEMMAVID_SE_BASE_URL = 'https://hemmavid.se';
export const HEMMAVID_SE_DEFAULT_SOURCE_URLS = [
  `${HEMMAVID_SE_BASE_URL}/collections/livsmedel`,
  `${HEMMAVID_SE_BASE_URL}/collections/halsa`
] as const;
export const HEMMAVID_SE_PARSER_VERSION = 'hemmavid-se-health-food-v1';

export type HemmavidSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'hemmavid';
  retailer_type: 'health_food';
  code: string;
  name: string;
  category: 'health_food' | 'pantry' | 'supplements';
  price: number;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  footprint: {
    qualifiesForNationalConnector: false;
    note: string;
  };
  provenance: {
    parserVersion: string;
    evidenceText: string;
  };
};

export type FetchHemmavidSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

const HEMMAVID_FOOTPRINT_NOTE = 'Hemmavid is treated as a limited-footprint Swedish health-food webshop, not a multi-store grocery chain.';

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
  return value.toLocaleLowerCase('sv-SE').replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

function inferCategory(value: string): HemmavidSeProduct['category'] {
  const haystack = textFromHtml(value).toLocaleLowerCase('sv-SE');
  if (/vitamin|mineral|kosttillskott|supplement/.test(haystack)) return 'supplements';
  if (/te|kaffe|honung|olja|mjöl|frö|granola|livsmedel|skafferi/.test(haystack)) return 'pantry';
  return 'health_food';
}

function productBlocks(html: string) {
  const blocks = [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|grid__item|card|collection)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
  if (blocks.length > 0) return blocks;
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? '');
}

export function parseHemmavidSeProducts(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): HemmavidSeProduct[] {
  if (!sourceUrl.includes('hemmavid.se')) throw new Error('Hemmavid SE connector only accepts hemmavid.se source URLs.');
  if (/captcha|access denied|cloudflare|logga in/i.test(html)) throw new Error('Hemmavid SE source returned a blocked/login page.');

  const rows: HemmavidSeProduct[] = [];
  const seen = new Set<string>();
  for (const block of productBlocks(html)) {
    const name = textFromHtml(firstMatch(block, [
      /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i,
      /itemprop=["']name["'][^>]*>([\s\S]*?)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /data-product-title=["']([^"']+)["']/i
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
    const code = firstMatch(block, [/data-(?:sku|product-id)=["']([^"']+)["']/i, /"sku"\s*:\s*"([^"]+)"/i]) || `hemmavid-${slugFor(name)}`;
    if (seen.has(code)) continue;
    seen.add(code);
    rows.push({
      country: 'SE',
      currency: 'SEK',
      chain: 'hemmavid',
      retailer_type: 'health_food',
      code,
      name,
      category: inferCategory(block),
      price,
      priceText: priceText || `${price.toLocaleString('sv-SE')} kr`,
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt,
      footprint: {
        qualifiesForNationalConnector: false,
        note: HEMMAVID_FOOTPRINT_NOTE
      },
      provenance: {
        parserVersion: HEMMAVID_SE_PARSER_VERSION,
        evidenceText: textFromHtml(block).slice(0, 240)
      }
    });
    if (maxRows && rows.length >= maxRows) break;
  }
  return rows;
}

export async function fetchHemmavidSeProducts(options: FetchHemmavidSeProductsOptions = {}): Promise<HemmavidSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? HEMMAVID_SE_DEFAULT_SOURCE_URLS;
  const rows: HemmavidSeProduct[] = [];
  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 hemmavid-se-connector (fixture-friendly)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Hemmavid SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Hemmavid SE request failed for ${sourceUrl}: ${response.status}`);
    rows.push(...parseHemmavidSeProducts(await response.text(), sourceUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined));
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Hemmavid SE connector found no parseable health-food product rows.');
  return rows;
}
