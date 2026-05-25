import { createHash } from 'node:crypto';

export const TOOGOODTOGO_SE_BASE_URL = 'https://www.toogoodtogo.com';
export const TOOGOODTOGO_SE_PARSER_VERSION = 'toogoodtogo-se-public-city-listing-v1';
export const DEFAULT_TOOGOODTOGO_SE_CITIES = ['stockholm', 'goteborg', 'malmo'] as const;

export type TooGoodToGoSeSurplusObservation = {
  id: string;
  domain: 'surplus_food';
  country: 'SE';
  chainId: string;
  storeName: string;
  city: string;
  productName: string;
  description: string;
  discountedPrice: number;
  originalPrice: number | null;
  currency: 'SEK';
  discountPercent: number | null;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  availableCount: number | null;
  isSurplus: true;
  observedAt: string;
  sourceUrl: string;
  provenance: {
    source: 'toogoodtogo_se_public_city_listing';
    parserVersion: string;
    contentDigest: string;
    rawListingId: string;
  };
};

type JsonRecord = Record<string, unknown>;

export function buildTooGoodToGoSeCityUrl(citySlug: string, baseUrl = TOOGOODTOGO_SE_BASE_URL): string {
  return new URL(`/sv-se/city/${encodeURIComponent(citySlug)}`, baseUrl).toString();
}

export function parseTooGoodToGoSeListings(input: {
  html: string;
  city: string;
  observedAt: string;
  sourceUrl?: string;
  parserVersion?: string;
}): TooGoodToGoSeSurplusObservation[] {
  const sourceUrl = input.sourceUrl ?? buildTooGoodToGoSeCityUrl(input.city);
  const digest = createHash('sha256').update(input.html).digest('hex');
  const payloads = extractJsonPayloads(input.html);
  const rows: TooGoodToGoSeSurplusObservation[] = [];
  const seen = new Set<string>();

  for (const payload of payloads) {
    for (const candidate of collectListingCandidates(payload)) {
      const row = normalizeTooGoodToGoSeListing(candidate, { city: input.city, observedAt: input.observedAt, sourceUrl, contentDigest: digest, parserVersion: input.parserVersion });
      if (!row || seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }

  if (rows.length === 0) throw new Error('Too Good To Go SE public listing page had no parseable surplus-food rows.');
  return rows;
}

export async function fetchTooGoodToGoSeListings(options: {
  fetchImpl?: typeof fetch;
  cities?: readonly string[];
  observedAt?: string;
  baseUrl?: string;
} = {}): Promise<TooGoodToGoSeSurplusObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const rows: TooGoodToGoSeSurplusObservation[] = [];
  for (const city of options.cities ?? DEFAULT_TOOGOODTOGO_SE_CITIES) {
    const sourceUrl = buildTooGoodToGoSeCityUrl(city, options.baseUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 toogoodtogo-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Too Good To Go SE listing source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Too Good To Go SE listing source failed with HTTP ${response.status}.`);
    rows.push(...parseTooGoodToGoSeListings({ html: await response.text(), city, observedAt, sourceUrl }));
  }
  return rows;
}

function normalizeTooGoodToGoSeListing(candidate: JsonRecord, input: {
  city: string;
  observedAt: string;
  sourceUrl: string;
  contentDigest: string;
  parserVersion?: string;
}): TooGoodToGoSeSurplusObservation | null {
  const item = recordAt(candidate, ['item', 'product', 'listing']) ?? candidate;
  const store = recordAt(candidate, ['store', 'merchant', 'vendor']) ?? candidate;
  const price = numberPrice(recordAt(candidate, ['price', 'item_price', 'discounted_price']) ?? candidate);
  if (price === null) return null;
  const currency = currencyCode(recordAt(candidate, ['price', 'item_price', 'discounted_price']) ?? candidate);
  if (currency && currency !== 'SEK') return null;

  const rawListingId = firstText(candidate, ['item_id', 'id', 'listing_id']) || firstText(item, ['item_id', 'id', 'sku']) || `${input.city}-${firstText(store, ['store_id', 'id', 'name', 'store_name'])}-${firstText(item, ['name', 'title'])}`;
  const productName = firstText(item, ['name', 'title', 'item_name']) || 'Too Good To Go Magic Bag';
  const storeName = firstText(store, ['store_name', 'name', 'display_name']) || 'Too Good To Go merchant';
  const chainId = slug(firstText(store, ['chain', 'brand', 'store_name', 'name']) || storeName);
  const originalPrice = numberPrice(recordAt(candidate, ['value', 'original_price', 'originalPrice']));
  const pickupWindow = recordAt(candidate, ['pickup_interval', 'pickupWindow', 'pickup_window']);
  const availableCount = firstNumber(candidate, ['items_available', 'available', 'available_count', 'quantity']);

  return {
    id: `toogoodtogo-se-${input.city}-${slug(rawListingId)}`,
    domain: 'surplus_food',
    country: 'SE',
    chainId,
    storeName,
    city: input.city,
    productName,
    description: firstText(item, ['description', 'subtitle']) || 'Surplus-food magic bag listing',
    discountedPrice: price,
    originalPrice,
    currency: 'SEK',
    discountPercent: originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 1000) / 10 : null,
    pickupWindowStart: firstText(pickupWindow, ['start', 'from']) || null,
    pickupWindowEnd: firstText(pickupWindow, ['end', 'to']) || null,
    availableCount,
    isSurplus: true,
    observedAt: input.observedAt,
    sourceUrl: input.sourceUrl,
    provenance: {
      source: 'toogoodtogo_se_public_city_listing',
      parserVersion: input.parserVersion ?? TOOGOODTOGO_SE_PARSER_VERSION,
      contentDigest: input.contentDigest,
      rawListingId
    }
  };
}

function extractJsonPayloads(html: string): unknown[] {
  const payloads: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]*(?:type=["']application\/json["'][^>]*)?[^>]*>([\s\S]*?)<\/script>/gi)) {
    const text = decodeHtml((match[1] ?? '').trim());
    if (!text || !/[{[]/.test(text)) continue;
    const jsonStart = Math.min(...['{', '['].map((char) => text.indexOf(char)).filter((index) => index >= 0));
    try {
      payloads.push(JSON.parse(text.slice(jsonStart)));
    } catch {
      // Ignore non-JSON analytics scripts.
    }
  }
  return payloads;
}

function collectListingCandidates(value: unknown): JsonRecord[] {
  const rows: JsonRecord[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isRecord(node)) return;
    if ((recordAt(node, ['item', 'product', 'listing']) || firstText(node, ['item_id', 'listing_id'])) && (recordAt(node, ['store', 'merchant', 'vendor']) || firstText(node, ['store_name'])) && (recordAt(node, ['price', 'item_price', 'discounted_price']) || firstNumber(node, ['price']))) {
      rows.push(node);
    }
    Object.values(node).forEach(visit);
  };
  visit(value);
  return rows;
}

function recordAt(record: unknown, keys: string[]): JsonRecord | null {
  if (!isRecord(record)) return null;
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function firstText(record: unknown, keys: string[]): string {
  if (!isRecord(record)) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstNumber(record: unknown, keys: string[]): number | null {
  if (!isRecord(record)) return null;
  for (const key of keys) {
    const value = record[key];
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : Number.NaN;
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function numberPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return roundSek(value);
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9,.-]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? roundSek(parsed) : null;
  }
  if (!isRecord(value)) return null;
  const minor = firstNumber(value, ['minor_units', 'minorUnits', 'amount_in_minor_units']);
  if (minor !== null) return roundSek(minor / 100);
  const amount = firstNumber(value, ['amount', 'value', 'price']);
  return amount === null ? null : roundSek(amount);
}

function currencyCode(value: unknown): string {
  return firstText(value, ['code', 'currency', 'currency_code']).toUpperCase();
}

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function roundSek(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function slug(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'listing';
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
