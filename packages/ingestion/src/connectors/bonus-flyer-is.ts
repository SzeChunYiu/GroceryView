export type BonusFlyerIsDeal = {
  chain: 'Bónus';
  country: 'IS';
  currency: 'ISK';
  cadence: 'weekly';
  productName: string;
  price: number;
  priceText: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchBonusFlyerIsDealsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const BONUS_FLYER_IS_BASE_URL = 'https://bonus.is';
export const BONUS_FLYER_IS_FLYER_URL = 'https://bonus.is/tilbod/';
export const BONUS_FLYER_IS_COUNTRY = 'IS';
export const BONUS_FLYER_IS_CURRENCY = 'ISK';
export const BONUS_FLYER_IS_CADENCE = 'weekly';

export async function fetchBonusFlyerIsDeals(options: FetchBonusFlyerIsDealsOptions = {}): Promise<BonusFlyerIsDeal[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? BONUS_FLYER_IS_FLYER_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Bónus flyer request failed: ${response.status}`);
  return parseBonusFlyerIsDeals(await response.text(), sourceUrl, retrievedAt).slice(0, options.maxRows ?? Number.POSITIVE_INFINITY);
}

export function parseBonusFlyerIsDeals(html: string, sourceUrl = BONUS_FLYER_IS_FLYER_URL, retrievedAt = new Date().toISOString()): BonusFlyerIsDeal[] {
  const rows: BonusFlyerIsDeal[] = [];
  const seen = new Set<string>();
  for (const row of [...parseJsonLdDeals(html, sourceUrl, retrievedAt), ...parseHtmlCardDeals(html, sourceUrl, retrievedAt)]) {
    const key = `${row.productName.toLowerCase()}:${row.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
  return rows;
}

function parseJsonLdDeals(html: string, sourceUrl: string, retrievedAt: string): BonusFlyerIsDeal[] {
  const rows: BonusFlyerIsDeal[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const payload = decodeHtml(stripHtml(match[1] ?? '')).trim();
    if (!payload) continue;
    try {
      const parsed = JSON.parse(payload);
      for (const product of flattenJsonLd(parsed)) {
        const item = recordOrNull(product.item);
        const name = text(product.name ?? item?.name);
        const offer = Array.isArray(product.offers) ? recordOrNull(product.offers[0]) : recordOrNull(product.offers);
        const price = numberOrNull(offer?.price ?? product.price);
        if (!name || price === null) continue;
        rows.push(makeDeal({ productName: name, price, imageUrl: text(product.image), sourceUrl, retrievedAt }));
      }
    } catch {
      // Ignore unrelated analytics JSON blocks.
    }
  }
  return rows;
}

function flattenJsonLd(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== 'object') return [];
  const object = value as Record<string, unknown>;
  const type = Array.isArray(object['@type']) ? object['@type'].join(' ') : object['@type'];
  const rows: Array<Record<string, unknown>> = /Product|Offer/.test(String(type ?? '')) ? [object] : [];
  for (const key of ['itemListElement', 'offers', 'items']) rows.push(...flattenJsonLd(object[key]));
  if (object.item) rows.push(...flattenJsonLd(object.item));
  return rows;
}

function parseHtmlCardDeals(html: string, sourceUrl: string, retrievedAt: string): BonusFlyerIsDeal[] {
  const rows: BonusFlyerIsDeal[] = [];
  const blocks = html.split(/<(?=article|li|section|div\b)/gi);
  for (const block of blocks) {
    if (!/\b(tilbo[ðd]|offer|product|vara|price|verd|ver[ðd])\b/i.test(block)) continue;
    const price = extractPrice(block);
    if (price === null) continue;
    const productName = extractProductName(block);
    if (!productName) continue;
    rows.push(makeDeal({ productName, price, imageUrl: extractImageUrl(block, sourceUrl), sourceUrl, retrievedAt }));
  }
  return rows;
}

function makeDeal(input: { productName: string; price: number; imageUrl?: string; sourceUrl: string; retrievedAt: string }): BonusFlyerIsDeal {
  return {
    chain: 'Bónus',
    country: BONUS_FLYER_IS_COUNTRY,
    currency: BONUS_FLYER_IS_CURRENCY,
    cadence: BONUS_FLYER_IS_CADENCE,
    productName: input.productName,
    price: input.price,
    priceText: `${Math.round(input.price).toLocaleString('is-IS')} kr`,
    imageUrl: input.imageUrl ? new URL(input.imageUrl, input.sourceUrl).toString() : '',
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt
  };
}

function extractPrice(block: string): number | null {
  const match = block.match(/(?:ISK|kr\.?|krónur)?\s*([0-9][0-9 .]*)\s*(?:ISK|kr\.?|krónur)/i);
  return numberOrNull(match?.[1]?.replace(/[ .]/g, ''));
}

function extractProductName(block: string): string {
  const heading = block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1];
  const aria = block.match(/aria-label=["']([^"']+)["']/i)?.[1];
  const alt = block.match(/alt=["']([^"']+)["']/i)?.[1];
  const title = block.match(/title=["']([^"']+)["']/i)?.[1];
  return cleanName(heading ?? aria ?? alt ?? title ?? '');
}

function extractImageUrl(block: string, sourceUrl: string): string {
  const image = block.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i)?.[1] ?? '';
  return image ? new URL(decodeHtml(image), sourceUrl).toString() : '';
}

function cleanName(value: string): string {
  return decodeHtml(stripHtml(value)).replace(/\s+/g, ' ').replace(/\b(?:ISK|kr\.?|tilbo[ðd])\b.*$/i, '').trim();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function recordOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value.replace(',', '.')) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
