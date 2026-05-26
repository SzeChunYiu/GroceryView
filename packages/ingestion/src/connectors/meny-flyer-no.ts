export const MENY_FLYER_NO_BASE_URL = 'https://meny.no';
export const MENY_FLYER_NO_OFFERS_PATH = '/varer/tilbud';
export const MENY_FLYER_NO_PARSER_VERSION = 'meny-flyer-no-offers-v1';

export type MenyFlyerNoPromotionType = 'weekly_flyer' | 'trumf_member';

export type MenyFlyerNoStructuredPromotion =
  | { kind: 'weekly_price'; memberOnly: false }
  | { kind: 'member_price'; memberProgram: 'Trumf'; memberOnly: true };

export type MenyFlyerNoPromotionRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'meny-no';
  code: string;
  name: string;
  category: string;
  promotionType: MenyFlyerNoPromotionType;
  price: number;
  priceText: string;
  comparePriceText: string;
  memberProgram: 'Trumf' | null;
  trumfMemberOnly: boolean;
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  structuredPromotion: MenyFlyerNoStructuredPromotion;
  provenance: { source: 'meny_no_offers'; parserVersion: string; evidenceText: string };
};

export type FetchMenyFlyerNoPromotionsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export function buildMenyFlyerNoOffersUrl(baseUrl = MENY_FLYER_NO_BASE_URL): string {
  return new URL(MENY_FLYER_NO_OFFERS_PATH, baseUrl).toString();
}

export async function fetchMenyFlyerNoPromotions(options: FetchMenyFlyerNoPromotionsOptions = {}): Promise<MenyFlyerNoPromotionRow[]> {
  const sourceUrl = options.sourceUrl ?? buildMenyFlyerNoOffersUrl();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 meny-flyer-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Meny NO flyer source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Meny NO flyer source failed with HTTP ${response.status}.`);
  const contentType = response.headers?.get?.('content-type') ?? '';
  const payload = contentType.includes('json') ? await response.json() : await response.text();
  return parseMenyFlyerNoPromotions(payload, sourceUrl, options.retrievedAt ?? new Date().toISOString(), options.maxRows);
}

export function parseMenyFlyerNoPromotions(payload: unknown, sourceUrl: string, retrievedAt: string, maxRows?: number): MenyFlyerNoPromotionRow[] {
  if (!/meny\.no/i.test(sourceUrl)) throw new Error('Meny NO flyer connector only accepts meny.no source URLs.');
  if (typeof payload === 'string' && /captcha|access denied|cloudflare|logg inn/i.test(payload)) {
    throw new Error('Meny NO flyer source returned a blocked/login page.');
  }

  const candidates = typeof payload === 'string'
    ? [...collectJsonCandidates(extractJsonPayloads(payload)), ...offerBlocks(payload)]
    : collectJsonCandidates([payload]);
  const rows: MenyFlyerNoPromotionRow[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    for (const row of normalizeMenyFlyerNoCandidate(candidate, sourceUrl, retrievedAt)) {
      const key = `${row.code}:${row.promotionType}:${row.price}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (maxRows && rows.length >= maxRows) return rows;
    }
  }
  if (rows.length === 0) throw new Error('Meny NO flyer source had no parseable promotion rows.');
  return rows;
}

export function normalizeMenyFlyerNoCandidate(candidate: unknown, sourceUrl: string, retrievedAt: string): MenyFlyerNoPromotionRow[] {
  if (typeof candidate === 'string') return normalizeMenyFlyerNoMarkup(candidate, sourceUrl, retrievedAt);
  if (!isRecord(candidate)) return [];

  const name = firstText(candidate, ['name', 'title', 'displayName', 'productName', 'heading']);
  const code = firstText(candidate, ['ean', 'gtin', 'barcode', 'sku', 'code', 'productId', 'id']) || slugFor(name);
  if (!name || !code) return [];

  const context = {
    name,
    category: firstText(candidate, ['category', 'categoryName', 'campaignName', 'collection']) || 'weekly-flyer',
    comparePriceText: firstText(candidate, ['comparePriceText', 'unitPriceText', 'unitPrice', 'pricePerUnit']),
    validFrom: firstText(candidate, ['validFrom', 'startDate', 'from']),
    validTo: firstText(candidate, ['validTo', 'endDate', 'to']),
    productUrl: absoluteUrl(firstText(candidate, ['url', 'href', 'productUrl', 'canonicalUrl']), sourceUrl),
    imageUrl: absoluteUrl(firstImage(candidate), sourceUrl),
    sourceUrl,
    retrievedAt,
    evidenceText: JSON.stringify(candidate).slice(0, 240)
  };
  const weeklyPriceValue = firstDefined(candidate, ['offerPrice', 'campaignPrice', 'price', 'currentPrice', 'salesPrice']);
  const weeklyPrice = priceNumber(weeklyPriceValue);
  const memberPriceValue = firstDefined(candidate, ['trumfPrice', 'memberPrice', 'loyaltyPrice', 'bonusPrice']);
  const memberPrice = priceNumber(memberPriceValue);
  const rows: MenyFlyerNoPromotionRow[] = [];

  if (weeklyPrice !== null) {
    rows.push(rowFor({
      ...context,
      code,
      promotionType: isTrumfCandidate(candidate) && memberPrice === null ? 'trumf_member' : 'weekly_flyer',
      price: weeklyPrice,
      priceText: priceText(weeklyPriceValue) || `${weeklyPrice.toFixed(2)} kr`
    }));
  }
  if (memberPrice !== null) {
    rows.push(rowFor({
      ...context,
      code: `${code}:trumf`,
      promotionType: 'trumf_member',
      price: memberPrice,
      priceText: priceText(memberPriceValue) || `${memberPrice.toFixed(2)} kr`
    }));
  }
  return rows;
}

function normalizeMenyFlyerNoMarkup(block: string, sourceUrl: string, retrievedAt: string): MenyFlyerNoPromotionRow[] {
  const name = textFromHtml(firstMatch(block, [/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i, /itemprop=["']name["'][^>]*>([\s\S]*?)</i, /data-name=["']([^"']+)["']/i]));
  const priceTextValue = textFromHtml(firstMatch(block, [/data-price=["']([^"']+)["']/i, /class=["'][^"']*(?:price|pris|tilbudspris)[^"']*["'][^>]*>([\s\S]*?)</i]));
  const price = priceNumber(priceTextValue);
  if (!name || price === null) return [];
  const promotionType: MenyFlyerNoPromotionType = /\b(?:trumf|medlem|bonus)\b/i.test(textFromHtml(block)) ? 'trumf_member' : 'weekly_flyer';
  return [rowFor({
    code: firstMatch(block, [/data-sku=["']([^"']+)["']/i, /data-product-id=["']([^"']+)["']/i]) || slugFor(name),
    name,
    category: textFromHtml(firstMatch(block, [/data-category=["']([^"']+)["']/i, /class=["'][^"']*category[^"']*["'][^>]*>([\s\S]*?)</i])) || 'weekly-flyer',
    promotionType,
    price,
    priceText: priceTextValue || `${price.toFixed(2)} kr`,
    comparePriceText: textFromHtml(firstMatch(block, [/class=["'][^"']*(?:compare|enhetspris|unit)[^"']*["'][^>]*>([\s\S]*?)</i])),
    validFrom: firstMatch(block, [/data-valid-from=["']([^"']+)["']/i]),
    validTo: firstMatch(block, [/data-valid-to=["']([^"']+)["']/i]),
    productUrl: absoluteUrl(firstMatch(block, [/href=["']([^"']+)["']/i]), sourceUrl),
    imageUrl: absoluteUrl(firstMatch(block, [/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i]), sourceUrl),
    sourceUrl,
    retrievedAt,
    evidenceText: textFromHtml(block).slice(0, 240)
  })];
}

function rowFor(input: Omit<MenyFlyerNoPromotionRow, 'country' | 'currency' | 'chain' | 'memberProgram' | 'trumfMemberOnly' | 'structuredPromotion' | 'provenance'> & { evidenceText: string }): MenyFlyerNoPromotionRow {
  const isMember = input.promotionType === 'trumf_member';
  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'meny-no',
    code: input.code,
    name: input.name,
    category: input.category,
    promotionType: input.promotionType,
    price: input.price,
    priceText: input.priceText,
    comparePriceText: input.comparePriceText,
    memberProgram: isMember ? 'Trumf' : null,
    trumfMemberOnly: isMember,
    validFrom: input.validFrom,
    validTo: input.validTo,
    productUrl: input.productUrl,
    imageUrl: input.imageUrl,
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt,
    structuredPromotion: isMember ? { kind: 'member_price', memberProgram: 'Trumf', memberOnly: true } : { kind: 'weekly_price', memberOnly: false },
    provenance: { source: 'meny_no_offers', parserVersion: MENY_FLYER_NO_PARSER_VERSION, evidenceText: input.evidenceText }
  };
}

function extractJsonPayloads(html: string): unknown[] {
  const payloads: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]+(?:id=["']__NEXT_DATA__["']|type=["']application\/json["'])[^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = parseJson(match[1] ?? '');
    if (parsed !== null) payloads.push(parsed);
  }
  const whole = parseJson(html);
  if (whole !== null) payloads.push(whole);
  return payloads;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(decodeHtml(value.trim()));
  } catch {
    return null;
  }
}

function collectJsonCandidates(payloads: unknown[]): unknown[] {
  const rows: unknown[] = [];
  const seenObjects = new Set<object>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value) || seenObjects.has(value)) return;
    seenObjects.add(value);
    if (looksLikeOffer(value)) rows.push(value);
    for (const child of Object.values(value)) visit(child);
  };
  payloads.forEach(visit);
  return rows;
}

function offerBlocks(html: string): string[] {
  return [...html.matchAll(/<(?:article|li|div)\b[^>]*(?:product|produkt|campaign|kampanje|tilbud|offer)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi)].map((match) => match[0]);
}

function looksLikeOffer(value: Record<string, unknown>): boolean {
  return Boolean(firstText(value, ['name', 'title', 'displayName', 'productName', 'heading']))
    && firstDefined(value, ['offerPrice', 'campaignPrice', 'price', 'currentPrice', 'salesPrice', 'trumfPrice', 'memberPrice', 'loyaltyPrice']) !== undefined;
}

function isTrumfCandidate(value: Record<string, unknown>): boolean {
  return /\b(?:trumf|medlem|member|bonus)\b/i.test(JSON.stringify(value));
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null) return record[key];
  return undefined;
}

function firstText(record: unknown, keys: string[]): string {
  if (!isRecord(record)) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstImage(record: Record<string, unknown>): string {
  const direct = firstText(record, ['image', 'imageUrl', 'image_url', 'thumbnail', 'thumbnailUrl']);
  if (direct) return direct;
  if (Array.isArray(record.images)) {
    for (const candidate of record.images) {
      const imageUrl = firstText(candidate, ['url', 'src', 'href']);
      if (imageUrl) return imageUrl;
    }
  }
  return isRecord(record.image) ? firstText(record.image, ['url', 'src', 'href']) : '';
}

function firstMatch(value: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return '';
}

function priceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round((value + Number.EPSILON) * 100) / 100;
  if (isRecord(value)) return priceNumber(firstDefined(value, ['amount', 'value', 'price', 'formatted', 'display']));
  if (typeof value !== 'string') return null;
  const normalized = textFromHtml(value).replace(/\s/g, '').replace(/kr|nok/gi, '').replace(',', '.').match(/\d+(?:\.\d+)?/u)?.[0];
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function priceText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(2)} kr`;
  if (isRecord(value)) return firstText(value, ['formatted', 'display', 'text', 'label']) || priceText(firstDefined(value, ['amount', 'value', 'price']));
  return '';
}

function textFromHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string): string {
  return value.toLowerCase().replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
