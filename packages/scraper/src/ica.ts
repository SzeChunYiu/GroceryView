export type IcaStoreFormat = 'maxi' | 'kvantum' | 'supermarket' | 'nara' | 'unknown';

export type IcaStoreScrapeTarget = {
  icaFormat?: IcaStoreFormat;
  regionId: string;
  storeAccountId: string;
  storeName: string;
};

export type IcaStorePrice = {
  chain: 'ica';
  code: string;
  currency: string;
  icaFormat: IcaStoreFormat;
  name: string;
  price: number | null;
  productUrl: string;
  promoPrice: number | null;
  sourceUrl: string;
  storeAccountId: string;
  storeName: string;
  unitPrice: number | null;
};

export type IcaStorePriceScrapeOptions = {
  fetchImpl?: typeof fetch;
  maxProductsToDecorate?: number;
};

const ICA_BASE_URL = 'https://handlaprivatkund.ica.se';
const DEFAULT_MAX_PRODUCTS = 300;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numeric = numberOrNull(value);
    if (numeric !== null) return numeric;
  }
  return null;
}

function nested(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;
  for (const segment of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function productCandidates(payload: unknown): Record<string, unknown>[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? (nested(payload as Record<string, unknown>, ['data', 'products'])
        ?? nested(payload as Record<string, unknown>, ['data', 'items'])
        ?? (payload as Record<string, unknown>).products
        ?? (payload as Record<string, unknown>).items)
      : [];

  return Array.isArray(rows)
    ? rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object' && !Array.isArray(row))
    : [];
}

export function buildIcaStorePromotionsUrl(target: IcaStoreScrapeTarget, options: IcaStorePriceScrapeOptions = {}) {
  const url = new URL(`/stores/${target.storeAccountId}/api/product-listing-pages/v1/pages/promotions`, ICA_BASE_URL);
  url.searchParams.set('regionId', target.regionId);
  url.searchParams.set('includeAdditionalPageInfo', 'true');
  url.searchParams.set('maxProductsToDecorate', String(options.maxProductsToDecorate ?? DEFAULT_MAX_PRODUCTS));
  url.searchParams.set('maxPageSize', String(options.maxProductsToDecorate ?? DEFAULT_MAX_PRODUCTS));
  return url.toString();
}

export function parseIcaStorePrices(payload: unknown, target: IcaStoreScrapeTarget, sourceUrl: string): IcaStorePrice[] {
  return productCandidates(payload).map((product) => {
    const productId = text(product.productId) || text(product.id) || text(product.code);
    const retailerProductId = text(product.retailerProductId) || text(product.retailerProductID) || productId;
    const price = firstNumber(product.price, nested(product, ['price', 'amount']));
    const promoPrice = firstNumber(product.promoPrice, product.campaignPrice, nested(product, ['promoPrice', 'amount']));
    const unitPrice = firstNumber(product.unitPrice, nested(product, ['unitPrice', 'amount']));
    const productPath = text(product.productUrl) || (retailerProductId ? `/stores/${target.storeAccountId}/products/${retailerProductId}/details` : '');

    return {
      chain: 'ica',
      code: retailerProductId || productId,
      currency: text(product.priceCurrency) || 'SEK',
      icaFormat: target.icaFormat ?? 'unknown',
      name: text(product.name) || text(nested(product, ['details', 'name'])),
      price,
      productUrl: productPath.startsWith('http') ? productPath : new URL(productPath || '/', ICA_BASE_URL).toString(),
      promoPrice,
      sourceUrl,
      storeAccountId: target.storeAccountId,
      storeName: target.storeName,
      unitPrice
    };
  }).filter((row) => row.code && row.name && (row.price !== null || row.promoPrice !== null));
}

export async function fetchIcaStorePrices(target: IcaStoreScrapeTarget, options: IcaStorePriceScrapeOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildIcaStorePromotionsUrl(target, options);
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`ICA store price scrape failed for ${target.storeAccountId}: ${response.status}`);
  return parseIcaStorePrices(await response.json(), target, sourceUrl);
}
