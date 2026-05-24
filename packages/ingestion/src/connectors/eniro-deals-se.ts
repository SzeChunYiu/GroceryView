export type EniroDealsSeOffer = {
  code: string;
  title: string;
  merchantName: string;
  category: string;
  region: string;
  priceText: string;
  description: string;
  validFrom: string;
  validTo: string;
  sourceUrl: string;
  dealUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

export const ENIRO_DEALS_SE_BASE_URL = 'https://www.eniro.se';
export const DEFAULT_ENIRO_DEALS_SE_REGIONS = ['stockholm', 'goteborg', 'malmo'] as const;

export type FetchEniroDealsSeOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  regions?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildEniroDealsSeRegionUrl(region: string): string {
  return new URL(`/erbjudanden/${encodeURIComponent(region)}`, ENIRO_DEALS_SE_BASE_URL).toString();
}

export async function fetchEniroDealsSeOffers(options: FetchEniroDealsSeOffersOptions = {}): Promise<EniroDealsSeOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? (options.regions ?? DEFAULT_ENIRO_DEALS_SE_REGIONS).map(buildEniroDealsSeRegionUrl);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 1000;
  const rows: EniroDealsSeOffer[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) {
      throw new Error(`Eniro deals request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const row of parseEniroDealsSeOffers(await response.text(), { sourceUrl, retrievedAt, maxRows: maxRows - rows.length })) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseEniroDealsSeOffers(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): EniroDealsSeOffer[] {
  const region = regionFromUrl(context.sourceUrl);
  const rows: EniroDealsSeOffer[] = [];
  const seen = new Set<string>();

  for (const candidate of extractDealCandidates(html)) {
    const row = normalizeEniroDealsSeOffer(candidate, { ...context, region });
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 500)) return rows;
  }

  return rows;
}

export function normalizeEniroDealsSeOffer(
  input: Record<string, unknown>,
  context: { sourceUrl: string; retrievedAt: string; region: string }
): EniroDealsSeOffer | null {
  const title = firstText(input.title, input.name, input.headline, input.offerTitle);
  const merchantName = firstText(input.merchantName, input.companyName, input.storeName, propertyText(input.seller, 'name'), propertyText(input.provider, 'name'));
  const dealUrl = absoluteUrl(firstText(input.url, input.dealUrl, input.link, propertyText(input.action, 'url')), context.sourceUrl);
  const priceText = firstText(input.priceText, input.price, input.offerPrice, input.mechanicInfo);
  const description = firstText(input.description, input.shortDescription, input.text);
  if (!title || (!merchantName && !description) || !dealUrl) return null;

  const code = firstText(input.id, input.uuid, input.offerId) || stableCode(`${context.region}:${merchantName}:${title}:${dealUrl}`);
  return {
    code,
    title,
    merchantName,
    category: firstText(input.category, input.categoryName, input.type),
    region: context.region,
    priceText,
    description,
    validFrom: firstText(input.validFrom, input.startDate, input.validThroughFrom),
    validTo: firstText(input.validTo, input.endDate, input.validThrough, input.expires),
    sourceUrl: context.sourceUrl,
    dealUrl,
    imageUrl: absoluteUrl(firstText(input.imageUrl, input.image, propertyText(input.image, 'url')), context.sourceUrl),
    retrievedAt: context.retrievedAt
  };
}

function extractDealCandidates(html: string): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = [];
  for (const value of extractJsonScriptValues(html)) {
    collectDealRecords(value, candidates);
  }
  return candidates;
}

function extractJsonScriptValues(html: string): unknown[] {
  const values: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    parseJsonLoose(match[1], values);
  }
  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextData) parseJsonLoose(nextData[1], values);
  for (const match of html.matchAll(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;<\/script>/gi)) {
    parseJsonLoose(match[1], values);
  }
  return values;
}

function parseJsonLoose(raw: string | undefined, values: unknown[]) {
  if (!raw) return;
  try {
    values.push(JSON.parse(raw.trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&')));
  } catch {
    // Ignore unrelated script payloads; tests cover supported JSON-LD and Next data shapes.
  }
}

function collectDealRecords(value: unknown, output: Record<string, unknown>[]) {
  if (Array.isArray(value)) {
    for (const item of value) collectDealRecords(item, output);
    return;
  }
  if (!isRecord(value)) return;
  if (looksLikeDeal(value)) output.push(value);
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested) || isRecord(nested)) collectDealRecords(nested, output);
  }
}

function looksLikeDeal(value: Record<string, unknown>): boolean {
  const type = firstText(value['@type'], value.type).toLocaleLowerCase('sv-SE');
  const hasTitle = Boolean(firstText(value.title, value.name, value.headline, value.offerTitle));
  const hasUrl = Boolean(firstText(value.url, value.dealUrl, value.link, propertyText(value.action, 'url')));
  const dealType = /offer|deal|coupon|erbjudande/.test(type);
  const dealKeys = ['priceText', 'offerPrice', 'validTo', 'validThrough', 'merchantName', 'companyName'].some((key) => key in value);
  return hasTitle && hasUrl && (dealType || dealKeys);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const current = text(value);
    if (current) return current;
  }
  return '';
}

function propertyText(value: unknown, property: string): string {
  return isRecord(value) ? text(value[property]) : '';
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function regionFromUrl(sourceUrl: string): string {
  try {
    const parts = new URL(sourceUrl).pathname.split('/').filter(Boolean);
    return decodeURIComponent(parts[1] ?? parts[0] ?? '').toLocaleLowerCase('sv-SE');
  } catch {
    return '';
  }
}

function stableCode(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `eniro-${Math.abs(hash).toString(36)}`;
}
