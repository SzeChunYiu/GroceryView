import { createHash } from 'node:crypto';

export const ENIRO_DEALS_SE_BASE_URL = 'https://www.eniro.se';
export const ENIRO_DEALS_SE_SEARCH_PATH = '/erbjudanden';
export const ENIRO_DEALS_SE_PARSER_VERSION = 'eniro-deals-se-v1';

export type EniroDealsSeOffer = {
  id: string;
  country: 'SE';
  currency: 'SEK';
  source: 'eniro_deals_se';
  title: string;
  merchantName: string;
  region: string;
  category: string;
  priceText: string;
  regularPriceText: string;
  validFrom: string;
  validTo: string;
  offerUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: string;
    contentDigest: string;
  };
};

export type FetchEniroDealsSeOffersOptions = {
  fetchImpl?: typeof fetch;
  region?: string;
  sourceUrl?: string;
  maxRows?: number;
  retrievedAt?: string;
};

type JsonRecord = Record<string, unknown>;

export function buildEniroDealsSeUrl(input: { region?: string; baseUrl?: string } = {}) {
  const url = new URL(ENIRO_DEALS_SE_SEARCH_PATH, input.baseUrl ?? ENIRO_DEALS_SE_BASE_URL);
  if (input.region?.trim()) url.searchParams.set('geo', input.region.trim());
  return url.toString();
}

export async function fetchEniroDealsSeOffers(options: FetchEniroDealsSeOffersOptions = {}): Promise<EniroDealsSeOffer[]> {
  const sourceUrl = options.sourceUrl ?? buildEniroDealsSeUrl({ region: options.region });
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 eniro-deals-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Eniro deals source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Eniro deals source failed with HTTP ${response.status}.`);
  return parseEniroDealsSeOffers(await response.text(), {
    sourceUrl,
    region: options.region ?? '',
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    maxRows: options.maxRows
  });
}

export function parseEniroDealsSeOffers(html: string, context: {
  sourceUrl: string;
  region?: string;
  retrievedAt: string;
  maxRows?: number;
}): EniroDealsSeOffer[] {
  const digest = createHash('sha256').update(html).digest('hex');
  const rows: EniroDealsSeOffer[] = [];
  const seen = new Set<string>();
  for (const candidate of extractDealCandidates(html)) {
    const row = normalizeEniroDeal(candidate, {
      sourceUrl: context.sourceUrl,
      fallbackRegion: context.region ?? '',
      retrievedAt: context.retrievedAt,
      contentDigest: digest
    });
    if (!row || seen.has(row.id)) continue;
    seen.add(row.id);
    rows.push(row);
    if (context.maxRows && rows.length >= context.maxRows) break;
  }
  return rows;
}

export function normalizeEniroDeal(candidate: unknown, context: {
  sourceUrl: string;
  fallbackRegion: string;
  retrievedAt: string;
  contentDigest: string;
}): EniroDealsSeOffer | null {
  if (!isRecord(candidate)) return null;
  const title = firstText(candidate, ['title', 'name', 'headline', 'offerTitle']);
  const merchant = firstText(candidate, ['merchantName', 'merchant', 'companyName', 'businessName', 'storeName']);
  const offerUrl = absoluteUrl(firstText(candidate, ['url', 'offerUrl', 'href', 'link']), context.sourceUrl);
  if (!title || !merchant) return null;
  const id = slug(firstText(candidate, ['id', 'offerId', 'slug']) || `${merchant}-${title}-${offerUrl || context.sourceUrl}`);
  return {
    id,
    country: 'SE',
    currency: 'SEK',
    source: 'eniro_deals_se',
    title,
    merchantName: merchant,
    region: firstText(candidate, ['region', 'city', 'locality', 'municipality']) || context.fallbackRegion,
    category: firstText(candidate, ['category', 'categoryName', 'vertical']),
    priceText: firstText(candidate, ['priceText', 'price', 'offerPrice', 'dealPrice']),
    regularPriceText: firstText(candidate, ['regularPriceText', 'regularPrice', 'originalPrice']),
    validFrom: firstText(candidate, ['validFrom', 'startDate', 'startsAt']),
    validTo: firstText(candidate, ['validTo', 'endDate', 'expiresAt']),
    offerUrl,
    imageUrl: absoluteUrl(firstText(candidate, ['imageUrl', 'image', 'thumbnailUrl']), context.sourceUrl),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    provenance: {
      parserVersion: ENIRO_DEALS_SE_PARSER_VERSION,
      contentDigest: context.contentDigest
    }
  };
}

function extractDealCandidates(html: string): unknown[] {
  const candidates: unknown[] = [];
  for (const jsonText of extractJsonScriptBodies(html)) {
    try {
      candidates.push(...findDealLikeRecords(JSON.parse(jsonText)));
    } catch {
      // Ignore unrelated script payloads.
    }
  }
  return candidates;
}

function extractJsonScriptBodies(html: string): string[] {
  const bodies = [...html.matchAll(/<script[^>]+type=["']application\/(?:ld\+)?json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => decodeHtml(match[1] ?? '').trim())
    .filter(Boolean);
  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) bodies.push(decodeHtml(nextData).trim());
  return bodies;
}

function findDealLikeRecords(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(findDealLikeRecords);
  if (!isRecord(value)) return [];
  const directTitle = firstText(value, ['title', 'name', 'headline', 'offerTitle']);
  const directMerchant = firstText(value, ['merchantName', 'merchant', 'companyName', 'businessName', 'storeName']);
  const type = firstText(value, ['@type', 'type']).toLowerCase();
  const isDeal = Boolean(directTitle && (directMerchant || /offer|deal|coupon|localbusiness/i.test(type)));
  const nested = Object.values(value).flatMap(findDealLikeRecords);
  return isDeal ? [value, ...nested] : nested;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function firstText(record: JsonRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return decodeHtml(value).trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (isRecord(value)) {
      const nested = firstText(value, ['name', 'title', 'url']);
      if (nested) return nested;
    }
  }
  return '';
}

function absoluteUrl(value: string, baseUrl: string) {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slug(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140);
}
