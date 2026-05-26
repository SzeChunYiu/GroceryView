export type KassalappNoPriceAggregation = 'min' | 'max' | 'avg';

export type KassalappNoSourceAttribution = {
  sourceType: 'official_api';
  provider: 'Kassalapp';
  market: 'NO';
  baseUrl: string;
  sourceUrl: string;
  endpoint: string;
  retrievedAt: string;
  apiTermsUrl: string;
  termsAccepted: boolean;
  commercialUseAllowed: boolean;
  rateLimit: {
    plan: 'hobby' | 'commercial';
    requestsPerMinute: number | null;
    observedRemaining: number | null;
    observedResetAt: string | null;
  };
};

export type KassalappNoNutrition = {
  code: string;
  displayName: string;
  amount: number;
  unit: string;
};

export type KassalappNoAllergen = {
  code: string;
  displayName: string;
  contains: string;
};

export type KassalappNoPricePoint = {
  price: number;
  date: string;
  storeCode: string;
  storeName: string;
  source: KassalappNoSourceAttribution;
};

export type KassalappNoProduct = {
  country: 'NO';
  currency: 'NOK';
  sourceProductId: string;
  name: string;
  brand: string;
  vendor: string;
  ean: string;
  productUrl: string;
  imageUrl: string;
  description: string;
  ingredients: string;
  currentPrice: number | null;
  currentUnitPrice: number | null;
  weight: number | null;
  weightUnit: string;
  storeCode: string;
  storeName: string;
  priceHistory: KassalappNoPricePoint[];
  nutrition: KassalappNoNutrition[];
  allergens: KassalappNoAllergen[];
  createdAt: string;
  updatedAt: string;
  source: KassalappNoSourceAttribution;
};

export type KassalappNoCatalog = {
  products: KassalappNoProduct[];
  priceHistory: KassalappNoPricePoint[];
  source: {
    provider: 'Kassalapp';
    market: 'NO';
    attribution: string;
    retrievedAt: string;
    rateLimit: KassalappNoSourceAttribution['rateLimit'];
    termsAccepted: boolean;
    commercialUseAllowed: boolean;
  };
};

export type FetchKassalappNoCatalogOptions = {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  termsAccepted?: boolean;
  commercialUseAllowed?: boolean;
  queries: string[];
  maxRows?: number;
  pageSize?: number;
  maxPagesPerQuery?: number;
  includePriceHistory?: boolean;
  priceHistoryDays?: number;
  priceHistoryAggregation?: KassalappNoPriceAggregation;
  retrievedAt?: string;
  baseUrl?: string;
};

type FetchJsonResult = {
  payload: unknown;
  rateLimit: KassalappNoSourceAttribution['rateLimit'];
};

export const KASSALAPP_API_BASE_URL = 'https://kassal.app';
export const KASSALAPP_API_TERMS_URL = 'https://kassal.app/api';
export const KASSALAPP_PRODUCTS_PATH = '/api/v1/products';
export const KASSALAPP_PRICES_BULK_PATH = '/api/v1/products/prices-bulk';
export const KASSALAPP_HOBBY_RATE_LIMIT_PER_MINUTE = 60;
export const KASSALAPP_MAX_PAGE_SIZE = 100;
export const KASSALAPP_MAX_BULK_EANS = 100;

export function buildKassalappProductsUrl(
  params: { search?: string; page?: number; size?: number; unique?: boolean; excludeWithoutEan?: boolean },
  baseUrl = KASSALAPP_API_BASE_URL
): string {
  const url = new URL(KASSALAPP_PRODUCTS_PATH, baseUrl);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.size) url.searchParams.set('size', String(Math.min(params.size, KASSALAPP_MAX_PAGE_SIZE)));
  if (params.unique !== undefined) url.searchParams.set('unique', String(params.unique));
  if (params.excludeWithoutEan !== undefined) url.searchParams.set('exclude_without_ean', String(params.excludeWithoutEan));
  return url.toString();
}

export function buildKassalappPricesBulkUrl(baseUrl = KASSALAPP_API_BASE_URL): string {
  return new URL(KASSALAPP_PRICES_BULK_PATH, baseUrl).toString();
}

export function kassalappNoConfigFromEnv(env: Record<string, string | undefined> = process.env): Pick<
  FetchKassalappNoCatalogOptions,
  'apiKey' | 'termsAccepted' | 'commercialUseAllowed'
> {
  return {
    apiKey: env.KASSALAPP_API_KEY,
    termsAccepted: env.KASSALAPP_TERMS_ACCEPTED === 'true',
    commercialUseAllowed: env.KASSALAPP_COMMERCIAL_USE_ALLOWED === 'true'
  };
}

export async function fetchKassalappNoCatalog(options: FetchKassalappNoCatalogOptions): Promise<KassalappNoCatalog> {
  assertKassalappAccessAllowed(options);

  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? KASSALAPP_API_BASE_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const pageSize = Math.min(options.pageSize ?? KASSALAPP_MAX_PAGE_SIZE, KASSALAPP_MAX_PAGE_SIZE);
  const maxPagesPerQuery = options.maxPagesPerQuery ?? 1;
  const products: KassalappNoProduct[] = [];
  const seen = new Set<string>();
  let latestRateLimit = rateLimitMetadata(null, options.commercialUseAllowed === true);

  for (const query of options.queries) {
    for (let page = 1; page <= maxPagesPerQuery; page += 1) {
      const sourceUrl = buildKassalappProductsUrl({ search: query, page, size: pageSize, excludeWithoutEan: false }, baseUrl);
      const result = await fetchKassalappJson(fetchImpl, sourceUrl, {
        apiKey: options.apiKey ?? '',
        method: 'GET',
        commercialUseAllowed: options.commercialUseAllowed === true
      });
      latestRateLimit = result.rateLimit;

      const source = sourceAttribution({
        baseUrl,
        sourceUrl,
        endpoint: KASSALAPP_PRODUCTS_PATH,
        retrievedAt,
        rateLimit: latestRateLimit,
        termsAccepted: options.termsAccepted === true,
        commercialUseAllowed: options.commercialUseAllowed === true
      });

      for (const product of parseKassalappNoProducts(result.payload, source)) {
        const key = `${product.ean || product.sourceProductId}:${product.storeCode}`;
        if (seen.has(key)) continue;
        seen.add(key);
        products.push(product);
        if (options.maxRows && products.length >= options.maxRows) break;
      }
      if (options.maxRows && products.length >= options.maxRows) break;
    }
    if (options.maxRows && products.length >= options.maxRows) break;
  }

  const eans = [...new Set(products.map((product) => product.ean).filter(Boolean))].slice(0, KASSALAPP_MAX_BULK_EANS);
  const bulkPriceHistory = options.includePriceHistory === false || eans.length === 0
    ? { priceHistory: [], rateLimit: null }
    : await fetchKassalappNoPriceHistory({
      fetchImpl,
      apiKey: options.apiKey ?? '',
      eans,
      days: options.priceHistoryDays ?? 30,
      aggregation: options.priceHistoryAggregation ?? 'min',
      retrievedAt,
      baseUrl,
      termsAccepted: options.termsAccepted === true,
      commercialUseAllowed: options.commercialUseAllowed === true
    });

  if (bulkPriceHistory.rateLimit) latestRateLimit = bulkPriceHistory.rateLimit;
  const priceHistory = bulkPriceHistory.priceHistory.length > 0
    ? bulkPriceHistory.priceHistory
    : products.flatMap((product) => product.priceHistory);

  return {
    products,
    priceHistory,
    source: {
      provider: 'Kassalapp',
      market: 'NO',
      attribution: 'Kassalapp official API',
      retrievedAt,
      rateLimit: latestRateLimit,
      termsAccepted: options.termsAccepted === true,
      commercialUseAllowed: options.commercialUseAllowed === true
    }
  };
}

export function parseKassalappNoProducts(payload: unknown, source: KassalappNoSourceAttribution): KassalappNoProduct[] {
  return dataArray(payload)
    .map((candidate) => normalizeKassalappNoProduct(candidate, source))
    .filter((product): product is KassalappNoProduct => product !== null);
}

export function normalizeKassalappNoProduct(candidate: unknown, source: KassalappNoSourceAttribution): KassalappNoProduct | null {
  if (!isRecord(candidate)) return null;
  const id = text(candidate.id);
  const name = text(candidate.name);
  if (!id || !name) return null;

  const store = isRecord(candidate.store) ? candidate.store : {};
  return {
    country: 'NO',
    currency: 'NOK',
    sourceProductId: id,
    name,
    brand: text(candidate.brand),
    vendor: text(candidate.vendor),
    ean: text(candidate.ean),
    productUrl: text(candidate.url),
    imageUrl: text(candidate.image),
    description: text(candidate.description),
    ingredients: text(candidate.ingredients),
    currentPrice: priceValue(candidate.current_price),
    currentUnitPrice: priceValue(candidate.current_unit_price),
    weight: priceValue(candidate.weight),
    weightUnit: text(candidate.weight_unit),
    storeCode: text(store.code),
    storeName: text(store.name),
    priceHistory: parseKassalappNoInlinePriceHistory(candidate.price_history, source, text(store.code), text(store.name)),
    nutrition: parseKassalappNoNutrition(candidate.nutrition),
    allergens: parseKassalappNoAllergens(candidate.allergens),
    createdAt: text(candidate.created_at),
    updatedAt: text(candidate.updated_at),
    source
  };
}

export function parseKassalappNoPriceHistory(payload: unknown, source: KassalappNoSourceAttribution): KassalappNoPricePoint[] {
  return dataArray(payload).flatMap((product) => {
    if (!isRecord(product)) return [];
    const stores = Array.isArray(product.stores) ? product.stores : [];
    const storeNames = new Map<string, string>();
    for (const store of stores) {
      if (!isRecord(store)) continue;
      const code = text(store.store);
      if (code) storeNames.set(code, text(store.name));
    }
    return parseKassalappNoInlinePriceHistory(product.price_history, source, '', '', storeNames);
  });
}

function parseKassalappNoInlinePriceHistory(
  value: unknown,
  source: KassalappNoSourceAttribution,
  fallbackStoreCode: string,
  fallbackStoreName: string,
  storeNames = new Map<string, string>()
): KassalappNoPricePoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!isRecord(row)) return null;
      const price = priceValue(row.price);
      const date = text(row.date);
      if (price === null || !date) return null;
      const storeCode = text(row.store) || fallbackStoreCode;
      return {
        price,
        date,
        storeCode,
        storeName: storeNames.get(storeCode) ?? fallbackStoreName,
        source
      };
    })
    .filter((row): row is KassalappNoPricePoint => row !== null);
}

function parseKassalappNoNutrition(value: unknown): KassalappNoNutrition[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!isRecord(row)) return null;
      const amount = priceValue(row.amount);
      if (amount === null) return null;
      return {
        code: text(row.code),
        displayName: text(row.display_name),
        amount,
        unit: text(row.unit)
      };
    })
    .filter((row): row is KassalappNoNutrition => row !== null);
}

function parseKassalappNoAllergens(value: unknown): KassalappNoAllergen[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!isRecord(row)) return null;
      const code = text(row.code);
      if (!code) return null;
      return {
        code,
        displayName: text(row.display_name),
        contains: text(row.contains)
      };
    })
    .filter((row): row is KassalappNoAllergen => row !== null);
}

async function fetchKassalappNoPriceHistory(options: {
  fetchImpl: typeof fetch;
  apiKey: string;
  eans: string[];
  days: number;
  aggregation: KassalappNoPriceAggregation;
  retrievedAt: string;
  baseUrl: string;
  termsAccepted: boolean;
  commercialUseAllowed: boolean;
}): Promise<{ priceHistory: KassalappNoPricePoint[]; rateLimit: KassalappNoSourceAttribution['rateLimit'] | null }> {
  const sourceUrl = buildKassalappPricesBulkUrl(options.baseUrl);
  const result = await fetchKassalappJson(options.fetchImpl, sourceUrl, {
    apiKey: options.apiKey,
    method: 'POST',
    commercialUseAllowed: options.commercialUseAllowed,
    body: {
      eans: options.eans.slice(0, KASSALAPP_MAX_BULK_EANS),
      days: options.days,
      aggregation: options.aggregation
    }
  });
  const source = sourceAttribution({
    baseUrl: options.baseUrl,
    sourceUrl,
    endpoint: KASSALAPP_PRICES_BULK_PATH,
    retrievedAt: options.retrievedAt,
    rateLimit: result.rateLimit,
    termsAccepted: options.termsAccepted,
    commercialUseAllowed: options.commercialUseAllowed
  });
  return {
    priceHistory: parseKassalappNoPriceHistory(result.payload, source),
    rateLimit: result.rateLimit
  };
}

async function fetchKassalappJson(
  fetchImpl: typeof fetch,
  url: string,
  options: {
    apiKey: string;
    method: 'GET' | 'POST';
    commercialUseAllowed: boolean;
    body?: unknown;
  }
): Promise<FetchJsonResult> {
  const response = await fetchImpl(url, {
    method: options.method,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${options.apiKey}`,
      'x-api-key': options.apiKey,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  if (!response.ok) throw new Error(`Kassalapp API request failed for ${url}: ${response.status}`);
  return {
    payload: await response.json(),
    rateLimit: rateLimitMetadata(response.headers, options.commercialUseAllowed)
  };
}

function assertKassalappAccessAllowed(options: Pick<FetchKassalappNoCatalogOptions, 'apiKey' | 'termsAccepted'>): void {
  if (!options.apiKey) {
    throw new Error('Kassalapp API adapter is disabled until KASSALAPP_API_KEY is configured.');
  }
  if (options.termsAccepted !== true) {
    throw new Error('Kassalapp API adapter is disabled until Kassalapp API terms are explicitly accepted.');
  }
}

function sourceAttribution(input: {
  baseUrl: string;
  sourceUrl: string;
  endpoint: string;
  retrievedAt: string;
  rateLimit: KassalappNoSourceAttribution['rateLimit'];
  termsAccepted: boolean;
  commercialUseAllowed: boolean;
}): KassalappNoSourceAttribution {
  return {
    sourceType: 'official_api',
    provider: 'Kassalapp',
    market: 'NO',
    baseUrl: input.baseUrl,
    sourceUrl: input.sourceUrl,
    endpoint: input.endpoint,
    retrievedAt: input.retrievedAt,
    apiTermsUrl: KASSALAPP_API_TERMS_URL,
    termsAccepted: input.termsAccepted,
    commercialUseAllowed: input.commercialUseAllowed,
    rateLimit: input.rateLimit
  };
}

function rateLimitMetadata(headers: Headers | null, commercialUseAllowed: boolean): KassalappNoSourceAttribution['rateLimit'] {
  const limit = headerNumber(headers, ['x-ratelimit-limit', 'ratelimit-limit']);
  const remaining = headerNumber(headers, ['x-ratelimit-remaining', 'ratelimit-remaining']);
  const reset = headerText(headers, ['x-ratelimit-reset', 'ratelimit-reset']);
  return {
    plan: commercialUseAllowed ? 'commercial' : 'hobby',
    requestsPerMinute: commercialUseAllowed ? null : limit ?? KASSALAPP_HOBBY_RATE_LIMIT_PER_MINUTE,
    observedRemaining: remaining,
    observedResetAt: reset ? resetToIso(reset) : null
  };
}

function headerNumber(headers: Headers | null, names: string[]): number | null {
  const value = headerText(headers, names);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function headerText(headers: Headers | null, names: string[]): string {
  if (!headers) return '';
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return '';
}

function resetToIso(value: string): string | null {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return new Date(numeric > 9999999999 ? numeric : numeric * 1000).toISOString();
  return Number.isNaN(Date.parse(value)) ? null : new Date(value).toISOString();
}

function dataArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.data)) return payload.data;
  return [];
}

function priceValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (isRecord(value)) return priceValue(value.price ?? value.unit_price ?? value.amount ?? value.value);
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s/g, '').replace(/kr|nok/gi, '').replace(',', '.').match(/\d+(?:\.\d+)?/u)?.[0];
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
