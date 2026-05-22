export type IcaProduct = {
  code: string;
  productId: string;
  retailerProductId: string;
  name: string;
  brand: string;
  categories: string[];
  imageUrl: string;
  productUrl: string;
  packageSize: string;
  countryOfOrigin: string;
  price: number | null;
  priceCurrency: string;
  unitPrice: number | null;
  unitPriceCurrency: string;
  unitPriceUnit: string;
  promoPrice: number | null;
  promoPriceCurrency: string;
  promoUnitPrice: number | null;
  promoUnitPriceCurrency: string;
  promoUnitPriceUnit: string;
  promotionDescription: string;
  storeAccountId: string;
  storeName: string;
  regionId: string;
  sourceUrl: string;
  retrievedAt: string;
};

export const ICA_STORE_BASE_URL = 'https://handlaprivatkund.ica.se';
export const DEFAULT_ICA_STORE_ACCOUNT_ID = '1004599';
export const DEFAULT_ICA_STORE_NAME = 'ICA Kvantum Kungsholmen';
export const DEFAULT_ICA_REGION_ID = '6ae1c52a-99a8-4b19-9464-dd01274df39d';
export const DEFAULT_ICA_MAX_PRODUCTS = 300;

export type IcaStoreConfig = {
  storeAccountId: string;
  storeName: string;
  regionId: string;
};

export const DEFAULT_ICA_STORE_CONFIGS: readonly IcaStoreConfig[] = [
  {
    storeAccountId: DEFAULT_ICA_STORE_ACCOUNT_ID,
    storeName: DEFAULT_ICA_STORE_NAME,
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004247',
    storeName: 'ICA Focus',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003714',
    storeName: 'ICA Karlaplan',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004228',
    storeName: 'ICA Supermarket Fältöversten',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004222',
    storeName: 'ICA Kvantum Södermalm',
    regionId: DEFAULT_ICA_REGION_ID
  }
];

export type FetchIcaProductsOptions = {
  fetchImpl?: typeof fetch;
  storeAccountId?: string;
  storeName?: string;
  regionId?: string;
  maxRows?: number;
  maxPageSize?: number;
  retrievedAt?: string;
};

export function buildIcaStorePromotionsUrl(
  storeAccountId = DEFAULT_ICA_STORE_ACCOUNT_ID,
  regionId = DEFAULT_ICA_REGION_ID,
  maxPageSize = DEFAULT_ICA_MAX_PRODUCTS
): string {
  const url = new URL(`/stores/${storeAccountId}/api/product-listing-pages/v1/pages/promotions`, ICA_STORE_BASE_URL);
  url.searchParams.set('regionId', regionId);
  url.searchParams.set('includeAdditionalPageInfo', 'true');
  url.searchParams.set('maxProductsToDecorate', String(maxPageSize));
  url.searchParams.set('maxPageSize', String(maxPageSize));
  return url.toString();
}

export function buildIcaStoreProductUrl(storeAccountId: string, retailerProductId: string): string {
  return new URL(`/stores/${storeAccountId}/products/${retailerProductId}/details`, ICA_STORE_BASE_URL).toString();
}

export async function fetchIcaProducts(options: FetchIcaProductsOptions = {}): Promise<IcaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const storeAccountId = options.storeAccountId ?? DEFAULT_ICA_STORE_ACCOUNT_ID;
  const storeName = options.storeName ?? DEFAULT_ICA_STORE_NAME;
  const regionId = options.regionId ?? DEFAULT_ICA_REGION_ID;
  const maxRows = options.maxRows ?? DEFAULT_ICA_MAX_PRODUCTS;
  const maxPageSize = options.maxPageSize ?? maxRows;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = buildIcaStorePromotionsUrl(storeAccountId, regionId, maxPageSize);

  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json, text/plain, */*',
      referer: new URL(`/stores/${storeAccountId}`, ICA_STORE_BASE_URL).toString(),
      'client-route-id': 'PROMOTIONS',
      'ecom-request-source': 'web',
      'user-agent': 'GroceryView/0.1'
    }
  });

  if (!response.ok) {
    throw new Error(`ICA store promotions request failed for ${storeAccountId}: ${response.status}`);
  }

  return parseIcaStorePromotions(await response.json(), {
    sourceUrl,
    retrievedAt,
    storeAccountId,
    storeName,
    regionId,
    maxRows
  });
}

export type FetchIcaDefaultStoreProductsOptions = Omit<
  FetchIcaProductsOptions,
  'storeAccountId' | 'storeName' | 'regionId'
> & {
  stores?: readonly IcaStoreConfig[];
};

export async function fetchIcaDefaultStoreProducts(
  options: FetchIcaDefaultStoreProductsOptions = {}
): Promise<IcaProduct[]> {
  const stores = options.stores ?? DEFAULT_ICA_STORE_CONFIGS;
  const batches = await Promise.all(stores.map((store) => fetchIcaProducts({
    ...options,
    storeAccountId: store.storeAccountId,
    storeName: store.storeName,
    regionId: store.regionId
  })));

  return batches.flat();
}

export type ParseIcaStorePromotionsOptions = {
  sourceUrl: string;
  retrievedAt: string;
  storeAccountId: string;
  storeName: string;
  regionId: string;
  maxRows?: number;
};

export function parseIcaStorePromotions(payload: unknown, options: ParseIcaStorePromotionsOptions): IcaProduct[] {
  if (!isRecord(payload)) {
    return [];
  }
  const rows: IcaProduct[] = [];
  const seen = new Set<string>();
  const productGroups = arrayOfRecords(payload.productGroups);

  for (const group of productGroups) {
    const groupType = text(group.type);
    const category = groupType || text(group.name) || 'store_promotions';
    for (const product of arrayOfRecords(group.decoratedProducts)) {
      const productId = text(product.productId);
      const retailerProductId = text(product.retailerProductId);
      const name = text(product.name);
      if (!productId || !retailerProductId || !name || seen.has(retailerProductId)) {
        continue;
      }
      seen.add(retailerProductId);
      const price = money(product.price);
      const unitPrice = nestedMoney(product.unitPrice);
      const promoPrice = money(product.promoPrice);
      const promoUnitPrice = nestedMoney(product.promoUnitPrice);
      const promotion = arrayOfRecords(product.promotions)[0];

      rows.push({
        code: retailerProductId,
        productId,
        retailerProductId,
        name,
        brand: text(product.brand),
        categories: [category],
        imageUrl: imageUrl(product.image),
        productUrl: buildIcaStoreProductUrl(options.storeAccountId, retailerProductId),
        packageSize: text(product.packSizeDescription),
        countryOfOrigin: text(product.countryOfOrigin),
        price: price.amount,
        priceCurrency: price.currency,
        unitPrice: unitPrice.amount,
        unitPriceCurrency: unitPrice.currency,
        unitPriceUnit: unitPrice.unit,
        promoPrice: promoPrice.amount,
        promoPriceCurrency: promoPrice.currency,
        promoUnitPrice: promoUnitPrice.amount,
        promoUnitPriceCurrency: promoUnitPrice.currency,
        promoUnitPriceUnit: promoUnitPrice.unit,
        promotionDescription: text(promotion?.description),
        storeAccountId: options.storeAccountId,
        storeName: options.storeName,
        regionId: options.regionId,
        sourceUrl: options.sourceUrl,
        retrievedAt: options.retrievedAt
      });

      if (options.maxRows && rows.length >= options.maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function arrayOfRecords(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function money(value: unknown): { amount: number | null; currency: string } {
  if (!isRecord(value)) {
    return { amount: null, currency: '' };
  }
  return {
    amount: typeof value.amount === 'number' ? value.amount : null,
    currency: text(value.currency)
  };
}

function nestedMoney(value: unknown): { amount: number | null; currency: string; unit: string } {
  if (!isRecord(value)) {
    return { amount: null, currency: '', unit: '' };
  }
  const price = money(value.price);
  return {
    amount: price.amount,
    currency: price.currency,
    unit: text(value.unit)
  };
}

function imageUrl(value: unknown): string {
  if (!isRecord(value)) {
    return '';
  }
  return text(value.src);
}
