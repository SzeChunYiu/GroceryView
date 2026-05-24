export type CoopExtraNoDiscount = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  price: number;
  priceText: string;
  regularPrice: number | null;
  regularPriceText: string;
  unitPriceText: string;
  promotionText: string;
  memberOnly: boolean;
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type UnknownRecord = Record<string, unknown>;

export const COOP_EXTRA_NO_BASE_URL = 'https://www.coop.no';
export const COOP_EXTRA_NO_OFFERS_PATH = '/extra/tilbud/';

export type FetchCoopExtraNoDiscountsOptions = {
  fetchImpl?: typeof fetch;
  offerUrl?: string;
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export function buildCoopExtraNoDiscountsUrl(baseUrl = COOP_EXTRA_NO_BASE_URL): string {
  return new URL(COOP_EXTRA_NO_OFFERS_PATH, baseUrl).toString();
}

export async function fetchCoopExtraNoDiscounts(
  options: FetchCoopExtraNoDiscountsOptions = {}
): Promise<CoopExtraNoDiscount[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.offerUrl ?? buildCoopExtraNoDiscountsUrl(options.baseUrl);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Coop Extra NO discounts request failed: ${response.status}`);
  return parseCoopExtraNoDiscounts(await response.text(), { sourceUrl, retrievedAt, maxRows: options.maxRows });
}

export function parseCoopExtraNoDiscounts(
  html: string,
  options: { sourceUrl?: string; retrievedAt?: string; maxRows?: number } = {}
): CoopExtraNoDiscount[] {
  const sourceUrl = options.sourceUrl ?? buildCoopExtraNoDiscountsUrl();
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: CoopExtraNoDiscount[] = [];
  const seen = new Set<string>();
  for (const payload of extractJsonObjects(html)) {
    collectOfferLikeObjects(payload, (candidate) => {
      const row = normalizeCoopExtraNoDiscount(candidate, sourceUrl, retrievedAt);
      if (!row) return;
      const key = `${row.code}:${row.priceText}:${row.validFrom}:${row.validTo}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    });
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

function extractJsonObjects(html: string): unknown[] {
  const payloads: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    pushParsedJson(payloads, decodeHtmlEntities(match[1] ?? ''));
  }
  for (const match of html.matchAll(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    pushParsedJson(payloads, decodeHtmlEntities(match[1] ?? ''));
  }
  for (const match of html.matchAll(/self\.__next_f\.push\(\s*(\[[\s\S]*?\])\s*\)/g)) {
    pushParsedJson(payloads, decodeHtmlEntities(match[1] ?? ''));
  }
  return payloads;
}

function pushParsedJson(payloads: unknown[], raw: string): void {
  try { payloads.push(JSON.parse(raw)); } catch { /* ignore non-data scripts */ }
}

function collectOfferLikeObjects(value: unknown, visit: (record: UnknownRecord) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) collectOfferLikeObjects(item, visit);
    return;
  }
  if (!isRecord(value)) return;
  if (hasOfferSignals(value)) visit(value);
  for (const item of Object.values(value)) collectOfferLikeObjects(item, visit);
}

function hasOfferSignals(record: UnknownRecord): boolean {
  const name = firstString(record, ['name', 'title', 'heading', 'productName']);
  const price = firstNumber(record, ['price', 'salesPrice', 'currentPrice', 'offerPrice'])
    ?? parseNorwegianPrice(firstString(record, ['priceText', 'priceFormatted', 'currentPriceText', 'offerPriceText']));
  return Boolean(name && price !== null && (record.image || record.imageUrl || record.url || record.link || record.href || record.validTo));
}

function normalizeCoopExtraNoDiscount(record: UnknownRecord, sourceUrl: string, retrievedAt: string): CoopExtraNoDiscount | null {
  const name = firstString(record, ['name', 'title', 'heading', 'productName']);
  const price = firstNumber(record, ['price', 'salesPrice', 'currentPrice', 'offerPrice'])
    ?? parseNorwegianPrice(firstString(record, ['priceText', 'priceFormatted', 'currentPriceText', 'offerPriceText']));
  if (!name || price === null) return null;
  const priceText = firstString(record, ['priceText', 'priceFormatted', 'currentPriceText', 'offerPriceText']) ?? formatNorwegianPrice(price);
  const productUrl = absolutize(firstString(record, ['url', 'link', 'href', 'productUrl']) ?? '', sourceUrl);
  return {
    code: firstString(record, ['id', 'code', 'sku', 'productId', 'ean']) ?? stableCode(name, priceText),
    name,
    brand: firstString(record, ['brand', 'brandName', 'supplier']) ?? '',
    packageText: firstString(record, ['packageText', 'packageSize', 'unit', 'subtitle']) ?? '',
    price,
    priceText,
    regularPrice: firstNumber(record, ['regularPrice', 'ordinaryPrice', 'beforePrice'])
      ?? parseNorwegianPrice(firstString(record, ['regularPriceText', 'ordinaryPriceText', 'beforePriceText'])),
    regularPriceText: firstString(record, ['regularPriceText', 'ordinaryPriceText', 'beforePriceText']) ?? '',
    unitPriceText: firstString(record, ['unitPriceText', 'comparisonPriceText', 'pricePerUnit']) ?? '',
    promotionText: firstString(record, ['promotionText', 'description', 'campaignText', 'label']) ?? '',
    memberOnly: Boolean(record.memberOnly ?? record.membersOnly ?? record.coopMemberOnly ?? false),
    validFrom: firstString(record, ['validFrom', 'fromDate', 'startDate']) ?? '',
    validTo: firstString(record, ['validTo', 'toDate', 'endDate']) ?? '',
    productUrl,
    imageUrl: absolutize(firstString(record, ['imageUrl', 'image', 'thumbnail']) ?? '', sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function firstString(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (isRecord(value)) {
      const nested = firstString(value, ['url', 'src', 'href', 'text', 'value', 'name']);
      if (nested) return nested;
    }
  }
  return null;
}

function firstNumber(record: UnknownRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseNorwegianPrice(value);
      if (parsed !== null) return parsed;
    }
    if (isRecord(value)) {
      const nested = firstNumber(value, ['amount', 'value', 'price']);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function parseNorwegianPrice(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/\s/g, '').match(/\d+(?:[,.]\d{1,2})?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNorwegianPrice(price: number): string {
  return `${price.toFixed(2).replace('.', ',')} kr`;
}

function absolutize(value: string, sourceUrl: string): string {
  if (!value) return '';
  try { return new URL(value, sourceUrl).toString(); } catch { return value; }
}

function stableCode(name: string, priceText: string): string {
  return `${name}:${priceText}`.toLowerCase().replace(/[^a-z0-9æøå]+/gi, '-').replace(/^-|-$/g, '');
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}
