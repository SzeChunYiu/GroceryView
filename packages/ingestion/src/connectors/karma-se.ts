export const KARMA_SE_SURPLUS_INFO_URL = 'https://webflow.karma.life/sv/products/surplus';
export const KARMA_SE_APP_STORE_URL = 'https://play.google.com/store/apps/details?id=com.karma.life';
export const KARMA_SE_PARSER_VERSION = 'karma-se-surplus-v1';

export type KarmaSeSurplusDeal = {
  country: 'SE';
  currency: 'SEK';
  chain: 'karma-se';
  retailerType: 'surplus_marketplace';
  is_surplus: true;
  code: string;
  name: string;
  merchantName: string;
  category: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  quantityAvailable: number | null;
  pickupStartsAt: string | null;
  pickupEndsAt: string | null;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: typeof KARMA_SE_PARSER_VERSION;
    publicEvidenceUrl: typeof KARMA_SE_SURPLUS_INFO_URL;
    appStoreEvidenceUrl: typeof KARMA_SE_APP_STORE_URL;
  };
};

type KarmaDealRecord = Record<string, unknown>;

export type FetchKarmaSeSurplusDealsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrl?: string;
};

export async function fetchKarmaSeSurplusDeals(options: FetchKarmaSeSurplusDealsOptions = {}): Promise<KarmaSeSurplusDeal[]> {
  const sourceUrl = options.sourceUrl ?? KARMA_SE_SURPLUS_INFO_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json,text/html;q=0.8',
      'user-agent': 'GroceryView/0.1 karma-se-surplus-connector (fixture-friendly)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Karma SE surplus source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Karma SE surplus source failed with HTTP ${response.status}.`);

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('json') ? await response.json() : await response.text();
  return parseKarmaSeSurplusDeals(payload, sourceUrl, options.retrievedAt ?? new Date().toISOString()).slice(0, options.maxRows);
}

export function parseKarmaSeSurplusDeals(payload: unknown, sourceUrl: string, retrievedAt: string): KarmaSeSurplusDeal[] {
  const records = dealRecords(payload);
  return records.flatMap((record) => normalizeKarmaSeSurplusDeal(record, sourceUrl, retrievedAt));
}

export function normalizeKarmaSeSurplusDeal(record: KarmaDealRecord, sourceUrl: string, retrievedAt: string): KarmaSeSurplusDeal[] {
  const code = text(record.id) || text(record.uuid) || text(record.offer_id);
  const name = text(record.name) || text(record.title) || text(nested(record.item, 'name'));
  const merchantName = text(record.merchant_name) || text(record.store_name) || text(nested(record.merchant, 'name')) || text(nested(record.store, 'name'));
  const price = money(record.price ?? record.discount_price ?? nested(record.price, 'amount'));
  if (!code || !name || !merchantName || price === null) return [];

  const originalPrice = money(record.original_price ?? record.regular_price ?? record.compare_at_price);
  const discountPercent = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : percent(record.discount_percent);
  const productPath = text(record.url) || text(record.deep_link) || text(record.share_url);

  return [{
    country: 'SE',
    currency: 'SEK',
    chain: 'karma-se',
    retailerType: 'surplus_marketplace',
    is_surplus: true,
    code,
    name,
    merchantName,
    category: text(record.category) || text(nested(record.item, 'category')) || 'surplus-food',
    price,
    originalPrice,
    discountPercent,
    quantityAvailable: integer(record.quantity_available ?? record.available_quantity ?? record.quantity),
    pickupStartsAt: isoOrNull(record.pickup_starts_at ?? record.pickupStart ?? record.valid_from),
    pickupEndsAt: isoOrNull(record.pickup_ends_at ?? record.pickupEnd ?? record.valid_until),
    productUrl: productPath || KARMA_SE_APP_STORE_URL,
    sourceUrl,
    retrievedAt,
    provenance: {
      parserVersion: KARMA_SE_PARSER_VERSION,
      publicEvidenceUrl: KARMA_SE_SURPLUS_INFO_URL,
      appStoreEvidenceUrl: KARMA_SE_APP_STORE_URL
    }
  }];
}

function dealRecords(payload: unknown): KarmaDealRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  for (const key of ['deals', 'items', 'offers', 'results', 'data']) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [];
}

function nested(value: unknown, key: string) {
  return isRecord(value) ? value[key] : undefined;
}

function money(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round((value + Number.EPSILON) * 100) / 100;
  const normalized = text(value).replace(/\s/g, '').replace(/kr|sek/gi, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function percent(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(text(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

function integer(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseInt(text(value), 10);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : null;
}

function isoOrNull(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function isRecord(value: unknown): value is KarmaDealRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
