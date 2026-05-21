export type CoopProduct = {
  code: string;
  ean: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  price: number;
  priceText: string;
  unitPrice: number | null;
  unitPriceText: string;
  unitPriceUnit: string;
  promotionText: string;
  promotionPrice: number | null;
  medMeraRequired: boolean;
  availableOnline: boolean;
  sourceUrl: string;
  productUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type CoopSearchResponse = {
  results?: {
    count?: unknown;
    items?: CoopSearchProduct[];
  };
};

type CoopSearchProduct = {
  id?: unknown;
  ean?: unknown;
  name?: unknown;
  manufacturerName?: unknown;
  packageSizeInformation?: unknown;
  imageUrl?: unknown;
  availableOnline?: unknown;
  salesPriceData?: CoopPriceData;
  comparativePriceData?: CoopPriceData;
  comparativePriceText?: unknown;
  navCategories?: CoopCategory[];
  onlinePromotions?: CoopPromotion[];
};

type CoopPriceData = {
  b2cPrice?: unknown;
};

type CoopCategory = {
  name?: unknown;
  superCategories?: CoopCategory[];
};

type CoopPromotion = {
  message?: unknown;
  priceData?: CoopPriceData;
  medMeraRequired?: unknown;
};

export const COOP_HANDLA_URL = 'https://www.coop.se/handla/';
export const COOP_PERSONALIZATION_API_URL = 'https://external.api.coop.se/personalization';
export const COOP_PERSONALIZATION_SEARCH_PATH = 'search/products';
export const DEFAULT_COOP_STORE_ID = '251300';
export const DEFAULT_COOP_DEVICE = 'desktop';
export const DEFAULT_COOP_API_VERSION = 'v1';
export const DEFAULT_COOP_SEARCH_QUERY = 'kaffe';

export type CoopPublicServiceAccess = {
  personalizationApiUrl: string;
  personalizationApiSubscriptionKey: string;
  personalizationApiVersion: string;
};

export type FetchCoopProductsOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  maxRows?: number;
  storeId?: string;
  device?: string;
  apiVersion?: string;
  subscriptionKey?: string;
  personalizationApiUrl?: string;
  retrievedAt?: string;
};

export function buildCoopSearchUrl(
  storeId = DEFAULT_COOP_STORE_ID,
  device = DEFAULT_COOP_DEVICE,
  apiVersion = DEFAULT_COOP_API_VERSION,
  personalizationApiUrl = COOP_PERSONALIZATION_API_URL
): string {
  const baseUrl = personalizationApiUrl.endsWith('/') ? personalizationApiUrl : `${personalizationApiUrl}/`;
  const url = new URL(COOP_PERSONALIZATION_SEARCH_PATH, baseUrl);
  url.searchParams.set('store', storeId);
  url.searchParams.set('device', device);
  url.searchParams.set('direct', 'true');
  url.searchParams.set('api-version', apiVersion);
  return url.toString();
}

export async function fetchCoopPublicServiceAccess(
  fetchImpl: typeof fetch = fetch
): Promise<CoopPublicServiceAccess> {
  const response = await fetchImpl(COOP_HANDLA_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Coop handla settings request failed: ${response.status}`);
  }

  const html = await response.text();
  const personalizationApiUrl = stringSetting(html, 'personalizationApiUrl');
  const personalizationApiSubscriptionKey = stringSetting(html, 'personalizationApiSubscriptionKey');
  const personalizationApiVersion = stringSetting(html, 'personalizationApiVersion');
  if (!personalizationApiUrl || !personalizationApiSubscriptionKey || !personalizationApiVersion) {
    throw new Error('Coop handla page did not expose personalization API settings');
  }

  return {
    personalizationApiUrl,
    personalizationApiSubscriptionKey,
    personalizationApiVersion
  };
}

export async function fetchCoopProducts(options: FetchCoopProductsOptions = {}): Promise<CoopProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? DEFAULT_COOP_SEARCH_QUERY;
  const maxRows = options.maxRows ?? 75;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const serviceAccess = options.subscriptionKey
    ? {
        personalizationApiUrl: options.personalizationApiUrl ?? COOP_PERSONALIZATION_API_URL,
        personalizationApiSubscriptionKey: options.subscriptionKey,
        personalizationApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION
      }
    : await fetchCoopPublicServiceAccess(fetchImpl);
  const sourceUrl = buildCoopSearchUrl(
    options.storeId ?? DEFAULT_COOP_STORE_ID,
    options.device ?? DEFAULT_COOP_DEVICE,
    serviceAccess.personalizationApiVersion,
    serviceAccess.personalizationApiUrl
  );

  const response = await fetchImpl(sourceUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'ocp-apim-subscription-key': serviceAccess.personalizationApiSubscriptionKey,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    },
    body: JSON.stringify({
      query,
      resultsOptions: { skip: 0, take: maxRows, sortBy: [], facets: [] },
      relatedResultsOptions: { skip: 0, take: 16 }
    })
  });

  if (!response.ok) {
    throw new Error(`Coop personalization search request failed: ${response.status}`);
  }

  const payload = await response.json() as CoopSearchResponse;
  const rows: CoopProduct[] = [];
  const seenCodes = new Set<string>();

  for (const product of payload.results?.items ?? []) {
    const row = normalizeCoopProduct(product, sourceUrl, retrievedAt);
    if (!row || seenCodes.has(row.code)) {
      continue;
    }
    seenCodes.add(row.code);
    rows.push(row);
    if (rows.length >= maxRows) {
      return rows;
    }
  }

  return rows;
}

export function normalizeCoopProduct(
  product: CoopSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): CoopProduct | null {
  const code = text(product.id) || text(product.ean);
  const ean = text(product.ean) || code;
  const name = text(product.name);
  const price = numberOrNull(product.salesPriceData?.b2cPrice);
  if (!code || !name || price === null) {
    return null;
  }

  const promotion = product.onlinePromotions?.[0];
  const categoryPath = categoryNames(product.navCategories?.[0]);
  return {
    code,
    ean,
    name,
    brand: text(product.manufacturerName),
    packageText: text(product.packageSizeInformation),
    category: categoryPath[categoryPath.length - 1] ?? '',
    price,
    priceText: `${price.toFixed(2)} SEK`,
    unitPrice: numberOrNull(product.comparativePriceData?.b2cPrice),
    unitPriceText: priceWithUnit(product.comparativePriceData?.b2cPrice, product.comparativePriceText),
    unitPriceUnit: text(product.comparativePriceText),
    promotionText: text(promotion?.message),
    promotionPrice: numberOrNull(promotion?.priceData?.b2cPrice),
    medMeraRequired: promotion?.medMeraRequired === true,
    availableOnline: product.availableOnline === true,
    sourceUrl,
    productUrl: buildCoopProductUrl(categoryPath, name, code),
    imageUrl: text(product.imageUrl),
    retrievedAt
  };
}

function buildCoopProductUrl(categoryPath: string[], name: string, code: string): string {
  const parts = categoryPath.map(slugify).filter(Boolean);
  parts.push(`${slugify(name)}-${encodeURIComponent(code)}`);
  return new URL(`/handla/varor/${parts.join('/')}/`, 'https://www.coop.se').toString();
}

function categoryNames(category: CoopCategory | undefined): string[] {
  if (!category) {
    return [];
  }
  return [...categoryNames(category.superCategories?.[0]), text(category.name)].filter(Boolean);
}

function priceWithUnit(price: unknown, unit: unknown): string {
  const numeric = numberOrNull(price);
  return numeric === null ? '' : `${numeric.toFixed(2)} ${text(unit)}`.trim();
}

function stringSetting(html: string, key: string): string {
  const match = html.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));
  return match?.[1] ?? '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberOrNull(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(text(value));
  return Number.isFinite(numeric) ? numeric : null;
}
