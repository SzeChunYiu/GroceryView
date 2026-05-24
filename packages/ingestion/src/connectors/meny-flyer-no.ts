export type MenyFlyerNoTier = 'weekly' | 'trumf';

export type MenyFlyerNoPromotion = {
  code: string;
  name: string;
  brand: string;
  price: number;
  regularPrice: number | null;
  priceText: string;
  promotionText: string;
  memberOnly: boolean;
  tier: MenyFlyerNoTier;
  country: 'NO';
  currency: 'NOK';
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type JsonRecord = Record<string, unknown>;

export type FetchMenyFlyerNoPromotionsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  maxRows?: number;
  retrievedAt?: string;
};

export const MENY_FLYER_NO_URL = 'https://meny.no/erbjudanden';

export async function fetchMenyFlyerNoPromotions(options: FetchMenyFlyerNoPromotionsOptions = {}): Promise<MenyFlyerNoPromotion[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? MENY_FLYER_NO_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Meny NO flyer request failed: ${response.status}`);
  }

  return parseMenyFlyerNoPromotions(await response.text(), {
    maxRows: options.maxRows,
    retrievedAt,
    sourceUrl
  });
}

export function parseMenyFlyerNoPromotions(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): MenyFlyerNoPromotion[] {
  const rows: MenyFlyerNoPromotion[] = [];
  const seen = new Set<string>();

  for (const payload of extractJsonRecords(html)) {
    const row = normalizeMenyFlyerNoPromotion(payload, context);
    if (!row) continue;
    const key = `${row.code}:${row.tier}:${row.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 500)) return rows;
  }

  return rows;
}

export function normalizeMenyFlyerNoPromotion(
  payload: JsonRecord,
  context: { sourceUrl: string; retrievedAt: string }
): MenyFlyerNoPromotion | null {
  const name = firstText(payload, ['name', 'title', 'productName']);
  const offer = record(payload.offers) ?? record(payload.offer) ?? payload;
  const price = firstNumber(offer, ['price', 'currentPrice', 'offerPrice', 'salePrice']);
  if (!name || price === null) return null;

  const combinedText = `${JSON.stringify(payload)} ${name}`.toLocaleLowerCase('nb-NO');
  const memberOnly = /\btrumf\b|medlem|lojalitet/.test(combinedText);
  const tier: MenyFlyerNoTier = memberOnly ? 'trumf' : 'weekly';
  const productUrl = absoluteUrl(firstText(payload, ['url', 'productUrl', 'canonicalUrl']), context.sourceUrl);

  return {
    code: firstText(payload, ['sku', 'id', 'code', 'gtin', 'ean']) || slugify(name),
    name,
    brand: firstText(payload, ['brand', 'brandName', 'manufacturer']),
    price,
    regularPrice: firstNumber(offer, ['regularPrice', 'oldPrice', 'beforePrice', 'compareAtPrice']),
    priceText: firstText(offer, ['priceText', 'currentPriceText']) || `${price.toLocaleString('nb-NO')} NOK`,
    promotionText: firstText(payload, ['promotionText', 'description', 'subtitle', 'label']),
    memberOnly,
    tier,
    country: 'NO',
    currency: 'NOK',
    validFrom: firstText(payload, ['validFrom', 'startDate', 'fromDate']),
    validTo: firstText(payload, ['validTo', 'endDate', 'toDate']),
    productUrl,
    imageUrl: absoluteUrl(firstText(payload, ['image', 'imageUrl', 'image_uri']), context.sourceUrl),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt
  };
}

export function extractJsonRecords(html: string): JsonRecord[] {
  const records: JsonRecord[] = [];
  for (const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
    const content = decodeHtml(script[1]?.trim() ?? '');
    if (!content || (!content.startsWith('{') && !content.startsWith('['))) continue;
    try {
      collectRecords(JSON.parse(content) as unknown, records);
    } catch {
      // Ignore non-JSON scripts; Meny can ship hydration snippets beside structured data.
    }
  }
  return records;
}

function collectRecords(value: unknown, records: JsonRecord[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, records);
    return;
  }
  const item = record(value);
  if (!item) return;
  if (firstText(item, ['name', 'title', 'productName']) && (record(item.offers) || firstNumber(item, ['price', 'currentPrice', 'offerPrice', 'salePrice']) !== null)) {
    records.push(item);
  }
  for (const nested of Object.values(item)) collectRecords(nested, records);
}

function firstText(recordValue: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = recordValue[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    const nested = record(value);
    if (nested) {
      const nestedName = firstText(nested, ['name', 'text', 'url']);
      if (nestedName) return nestedName;
    }
  }
  return '';
}

function firstNumber(recordValue: JsonRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = recordValue[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(/[^0-9,.-]/g, '').replace(',', '.'));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function record(value: unknown): JsonRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as JsonRecord : null;
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function slugify(value: string): string {
  return value.toLocaleLowerCase('nb-NO').normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meny-offer';
}

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x2F;/g, '/');
}
