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
  },
  {
    storeAccountId: '1003754',
    storeName: 'ICA Supermarket Sjöstaden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003380',
    storeName: 'Maxi ICA Stormarknad Solna',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1015001',
    storeName: 'Maxi ICA Stormarknad Bromma',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004309',
    storeName: 'ICA Nära Annedal',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003898',
    storeName: 'ICA Kvantum Tyresö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003408',
    storeName: 'Maxi ICA Stormarknad Barkarbystaden',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004407',
    storeName: 'Maxi ICA Stormarknad Botkyrka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003777',
    storeName: 'Maxi ICA Stormarknad Haninge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004414',
    storeName: 'ICA Banér',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003855',
    storeName: 'ICA Supermarket Vanadis',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004315',
    storeName: 'ICA Nära Kallhäll',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1051011',
    storeName: 'Maxi ICA Stormarknad Österåker',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003735',
    storeName: 'Maxi ICA Stormarknad Moraberg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003729',
    storeName: 'ICA Nära Brottbyhallen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004109',
    storeName: 'Maxi ICA Stormarknad Vasa Handelsplats',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003510',
    storeName: 'ICA Nära Enhörna, Södertälje',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003975',
    storeName: 'ICA Nära Lunda Livs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003429',
    storeName: 'Maxi ICA Stormarknad Bålsta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003421',
    storeName: 'Maxi ICA Stormarknad Nynäshamn',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003416',
    storeName: 'ICA Kvantum Knivsta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003820',
    storeName: 'ICA Supermarket Torghallen, Mariefred',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003471',
    storeName: 'ICA Kvantum Rimbo',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003458',
    storeName: 'ICA Kvantum Ale',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003647',
    storeName: 'Maxi ICA Stormarknad Alingsås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003644',
    storeName: 'ICA Nära Alexius Livs',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004242',
    storeName: 'ICA Supermarket Alfta',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003645',
    storeName: 'ICA Supermarket Algots Mönsterås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004333',
    storeName: 'ICA Nära Alléns',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003650',
    storeName: 'ICA Nära Almunge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003654',
    storeName: 'ICA Supermarket Alunda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004219',
    storeName: 'Maxi ICA Stormarknad Göteborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004589',
    storeName: 'ICA Kvantum Mölndal',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003954',
    storeName: 'Maxi ICA Stormarknad Högsbo, Göteborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003825',
    storeName: 'Maxi ICA Stormarknad Torslanda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003932',
    storeName: 'ICA Kvantum Hovås',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004392',
    storeName: 'Maxi ICA Stormarknad Kungälv',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004185',
    storeName: 'Maxi ICA Stormarknad Kungsbacka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003398',
    storeName: 'ICA Kvantum Stenungsund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003778',
    storeName: 'ICA Kvantum Frölunda',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004365',
    storeName: 'Maxi ICA Stormarknad Partille',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003383',
    storeName: 'ICA Kvantum Lerum',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003849',
    storeName: 'ICA Supermarket Hönö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003917',
    storeName: 'ICA Kvantum Kungsbacka',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004291',
    storeName: 'ICA Supermarket Nordeviks',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004520',
    storeName: 'ICA Supermarket Noltorp',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004490',
    storeName: 'ICA Kvantum Malmborgs Caroli',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003569',
    storeName: 'Maxi ICA Stormarknad Västra Hamnen',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004037',
    storeName: 'ICA Kvantum Malmborgs Mobilia',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004492',
    storeName: 'Maxi ICA Stormarknad Malmö',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003428',
    storeName: 'Maxi ICA Stormarknad Burlöv',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1088004',
    storeName: 'Maxi ICA Stormarknad Gunnesbo, Lund',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004060',
    storeName: 'Maxi ICA Stormarknad Löddeköpinge',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003612',
    storeName: 'ICA Kvantum Karlssons',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003452',
    storeName: 'ICA Kvantum Södra Sandby',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003620',
    storeName: 'Maxi ICA Stormarknad Trelleborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1004360',
    storeName: 'ICA Kvantum Sjöbo',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003916',
    storeName: 'Maxi ICA Stormarknad Råå Helsingborg',
    regionId: DEFAULT_ICA_REGION_ID
  },
  {
    storeAccountId: '1003793',
    storeName: 'ICA Kvantum Hörby',
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
