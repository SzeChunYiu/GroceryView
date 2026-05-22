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

export type CoopStoreProduct = CoopProduct & {
  storeId: string;
  storeName: string;
  city: string;
};

export type CoopWeeklyDiscount = {
  code: string;
  ean: string;
  name: string;
  brand: string;
  packageText: string;
  ordinaryPrice: number;
  ordinaryPriceText: string;
  offerPrice: number;
  offerPriceText: string;
  offerUnitPrice: number | null;
  offerUnitPriceText: string;
  offerMechanicText: string;
  promotionId: string;
  medMeraRequired: boolean;
  storeId: string;
  storeName: string;
  region: string;
  validFrom: string;
  validTo: string;
  flyerUrl: string;
  productSearchUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type CoopStore = {
  storeId: string;
  siteId: string;
  ledgerAccountNumber: string;
  name: string;
  conceptName: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  weeklyOffersLink: string;
  url: string;
  sourceUrl: string;
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
  id?: unknown;
  message?: unknown;
  priceData?: CoopPriceData;
  comparativePrice?: CoopPriceData;
  startDate?: unknown;
  endDate?: unknown;
  medMeraRequired?: unknown;
};

type CoopStoreResponse = {
  id?: unknown;
  storeId?: unknown;
  siteId?: unknown;
  ledgerAccountNumber?: unknown;
  name?: unknown;
  concept?: { name?: unknown };
  conceptName?: unknown;
  address?: unknown;
  city?: unknown;
  postalCode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  weeklyOffersLink?: unknown;
  url?: unknown;
  flyers?: CoopStoreFlyer[];
};

type CoopStoresResponse = {
  stores?: CoopStoreResponse[];
};

type CoopStoreFlyer = {
  startDate?: unknown;
  stopDate?: unknown;
  current?: unknown;
  pdfExists?: unknown;
  pdfUrl?: unknown;
  isHemmaBilaga?: unknown;
};

export const COOP_HANDLA_URL = 'https://www.coop.se/handla/';
export const COOP_PERSONALIZATION_API_URL = 'https://external.api.coop.se/personalization';
export const COOP_PERSONALIZATION_SEARCH_PATH = 'search/products';
export const COOP_STORE_API_URL = 'https://proxy.api.coop.se/external/store/';
export const DEFAULT_COOP_STORE_ID = '251300';
export const DEFAULT_COOP_DEVICE = 'desktop';
export const DEFAULT_COOP_API_VERSION = 'v1';
export const DEFAULT_COOP_STORE_API_VERSION = 'v5';
export const DEFAULT_COOP_SEARCH_QUERY = 'kaffe';
export const DEFAULT_COOP_WEEKLY_DISCOUNT_STORE_IDS = [
  DEFAULT_COOP_STORE_ID,
  '252700',
  '256600',
  '255700',
  '015700',
  '015810',
  '015350',
  '026000',
  '015220',
  '016141',
  '255400',
  '250800',
  '015400',
  '015470',
  '250400',
  '163400',
  '231400',
  '231500',
  '231800',
  '093200',
  '133100',
  '231900',
  '030500',
  '075800',
  '022500',
  '201700',
  '242200',
  '255500',
  '253200',
  '252600',
  '252500',
  '231300',
  '241200',
  '176110',
  '112000',
  '254800',
  '255900',
  '162000',
  '241800',
  '205180',
  '072000',
  '241100',
  '056230',
  '026500',
  '175010',
  '254700',
  '036968',
  '257400',
  '253000',
  '252200',
  '205140',
  '163300',
  '165400',
  '163800',
  '185510',
  '232000',
  '254900',
  '054000',
  '105610',
  '195020',
  '163000',
  '196000',
  '026810',
  '056010',
  '195030',
  '015430',
  '133800',
  '201510',
  '165270',
  '165290',
  '015320',
  '245200',
  '163900',
  '163500',
  '136251',
  '135220',
  '205150',
  '066452',
  '075220',
  '086811',
  '165500',
  '196311',
  '235160',
  '235180',
  '235200'
] as const;
export const DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES = [
  'Färsk laxfilé Harbour',
  'Mini vattenmelon',
  'Svenskt smör Arla 500 g',
  'Hushållsost Arla',
  'Toalettpapper 24-pack Coop',
  'Bacon Scan 3-pack',
  'Grekisk yoghurt Arla Köket 1000 g',
  'Olivolja Monini 750',
  'Kalkonbröstfilé Ingelsta',
  'Danish Crown fläskfilé',
  'Coop stekfläsk',
  'Kycklingbröstfilé Guldfågeln mango chili',
  'Lövbiff fransyska Coop',
  'Torskryggfilé Royal Greenland 3-pack',
  'Fläskkarré Dalsjöfors eld rök',
  'Pepsi Max 20-pack',
  'Grillkorv Scan tunt skinn',
  'Lök Gul Eko Änglamark',
  'Rabarber',
  'Fazer Lantbröd Havssalt',
  'Pågen Lingongrova Special',
  'Engelmanns Salami Milano',
  'Marabou Chokladpraliner Hjärta',
  'Vanish White Gold',
  'NIVEA Q10 Energy',
  'Bravo Juice Tropisk'
];

export type CoopPublicServiceAccess = {
  personalizationApiUrl: string;
  personalizationApiSubscriptionKey: string;
  personalizationApiVersion: string;
};

type CoopWeeklyServiceAccess = CoopPublicServiceAccess & {
  storeApiUrl: string;
  storeApiSubscriptionKey: string;
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

export type FetchCoopProductsForAllStoresOptions = Omit<FetchCoopProductsOptions, 'storeId' | 'query' | 'maxRows'> & {
  queries?: readonly string[];
  maxStores?: number;
  maxRowsPerStore?: number;
  includeStoreDetails?: boolean;
  storeApiVersion?: string;
  storeApiUrl?: string;
  storeApiSubscriptionKey?: string;
};

export type FetchCoopWeeklyDiscountsOptions = {
  fetchImpl?: typeof fetch;
  storeId?: string;
  storeIds?: readonly string[];
  storeApiVersion?: string;
  storeApiUrl?: string;
  storeApiSubscriptionKey?: string;
  productQueries?: readonly string[];
  maxRows?: number;
  device?: string;
  apiVersion?: string;
  subscriptionKey?: string;
  personalizationApiUrl?: string;
  retrievedAt?: string;
};

export type FetchCoopAllStoreWeeklyDiscountsOptions = Omit<FetchCoopWeeklyDiscountsOptions, 'storeId' | 'storeIds'> & {
  maxStores?: number;
  includeStoreDetails?: boolean;
};

export type FetchCoopStoresOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  storeApiVersion?: string;
  storeApiUrl?: string;
  storeApiSubscriptionKey?: string;
  includeDetails?: boolean;
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

export function buildCoopStoreInfoUrl(
  storeId = DEFAULT_COOP_STORE_ID,
  storeApiVersion = DEFAULT_COOP_STORE_API_VERSION,
  storeApiUrl = COOP_STORE_API_URL
): string {
  const baseUrl = storeApiUrl.endsWith('/') ? storeApiUrl : `${storeApiUrl}/`;
  const url = new URL(`stores/${encodeURIComponent(storeId)}`, baseUrl);
  url.searchParams.set('api-version', storeApiVersion);
  url.searchParams.set('includeFlyers', 'true');
  url.searchParams.set('onlyVisibleOpeningHours', 'true');
  return url.toString();
}

export function buildCoopStoresUrl(
  storeApiVersion = DEFAULT_COOP_STORE_API_VERSION,
  storeApiUrl = COOP_STORE_API_URL
): string {
  const baseUrl = storeApiUrl.endsWith('/') ? storeApiUrl : `${storeApiUrl}/`;
  const url = new URL('stores', baseUrl);
  url.searchParams.set('api-version', storeApiVersion);
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

export async function fetchCoopPublicWeeklyServiceAccess(
  fetchImpl: typeof fetch = fetch
): Promise<CoopWeeklyServiceAccess> {
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
  const storeApiUrl = stringSetting(html, 'storeApiUrl');
  const storeApiSubscriptionKey = stringSetting(html, 'storeApiSubscriptionKey');
  if (
    !personalizationApiUrl ||
    !personalizationApiSubscriptionKey ||
    !personalizationApiVersion ||
    !storeApiUrl ||
    !storeApiSubscriptionKey
  ) {
    throw new Error('Coop handla page did not expose weekly discount API settings');
  }

  return {
    personalizationApiUrl,
    personalizationApiSubscriptionKey,
    personalizationApiVersion,
    storeApiUrl,
    storeApiSubscriptionKey
  };
}

export async function fetchCoopStores(options: FetchCoopStoresOptions = {}): Promise<CoopStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const serviceAccess = options.storeApiSubscriptionKey
    ? {
        storeApiUrl: options.storeApiUrl ?? COOP_STORE_API_URL,
        storeApiSubscriptionKey: options.storeApiSubscriptionKey
      }
    : await fetchCoopPublicWeeklyServiceAccess(fetchImpl);
  const sourceUrl = buildCoopStoresUrl(
    options.storeApiVersion ?? DEFAULT_COOP_STORE_API_VERSION,
    serviceAccess.storeApiUrl
  );
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'ocp-apim-subscription-key': serviceAccess.storeApiSubscriptionKey,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Coop store catalog request failed: ${response.status}`);
  const payload = await response.json() as CoopStoresResponse;
  const summaries = payload.stores ?? [];
  const rows: CoopStore[] = [];
  const seenStoreIds = new Set<string>();
  for (const summary of summaries) {
    const summaryStoreId = text(summary.ledgerAccountNumber) || text(summary.storeId) || text(summary.id);
    const detail = options.includeDetails === false || !summaryStoreId
      ? summary
      : await fetchCoopStoreDetail({
          fetchImpl,
          storeId: summaryStoreId,
          storeApiVersion: options.storeApiVersion ?? DEFAULT_COOP_STORE_API_VERSION,
          storeApiUrl: serviceAccess.storeApiUrl,
          storeApiSubscriptionKey: serviceAccess.storeApiSubscriptionKey
        });
    const row = normalizeCoopStore({ ...summary, ...detail }, sourceUrl, retrievedAt);
    if (!row || seenStoreIds.has(row.storeId)) continue;
    seenStoreIds.add(row.storeId);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Coop store catalog had no usable stores.');
  return rows;
}

async function fetchCoopStoreDetail(input: {
  fetchImpl: typeof fetch;
  storeId: string;
  storeApiVersion: string;
  storeApiUrl: string;
  storeApiSubscriptionKey: string;
}): Promise<CoopStoreResponse> {
  const sourceUrl = buildCoopStoreInfoUrl(input.storeId, input.storeApiVersion, input.storeApiUrl);
  const response = await input.fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'ocp-apim-subscription-key': input.storeApiSubscriptionKey,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Coop store detail request failed for ${input.storeId}: ${response.status}`);
  return await response.json() as CoopStoreResponse;
}

export async function fetchCoopProducts(options: FetchCoopProductsOptions = {}): Promise<CoopProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? DEFAULT_COOP_SEARCH_QUERY;
  const maxRows = options.maxRows ?? 1000;
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

export async function fetchCoopProductsForAllStores(
  options: FetchCoopProductsForAllStoresOptions = {}
): Promise<CoopStoreProduct[]> {
  const stores = await fetchCoopStores({
    fetchImpl: options.fetchImpl,
    maxRows: options.maxStores,
    storeApiVersion: options.storeApiVersion,
    storeApiUrl: options.storeApiUrl,
    storeApiSubscriptionKey: options.storeApiSubscriptionKey,
    includeDetails: options.includeStoreDetails,
    retrievedAt: options.retrievedAt
  });
  const rows: CoopStoreProduct[] = [];
  const queries = options.queries ?? [DEFAULT_COOP_SEARCH_QUERY];
  for (const store of stores) {
    for (const query of queries) {
      const products = await fetchCoopProducts({
        fetchImpl: options.fetchImpl,
        query,
        maxRows: options.maxRowsPerStore ?? options.maxRowsPerStore ?? 24,
        storeId: store.storeId,
        device: options.device,
        apiVersion: options.apiVersion,
        subscriptionKey: options.subscriptionKey,
        personalizationApiUrl: options.personalizationApiUrl,
        retrievedAt: options.retrievedAt
      });
      rows.push(...products.map((product) => ({
        ...product,
        storeId: store.storeId,
        storeName: store.name,
        city: store.city
      })));
    }
  }
  return rows;
}

export async function fetchCoopWeeklyDiscounts(
  options: FetchCoopWeeklyDiscountsOptions = {}
): Promise<CoopWeeklyDiscount[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const storeIds = options.storeIds ?? (options.storeId ? [options.storeId] : DEFAULT_COOP_WEEKLY_DISCOUNT_STORE_IDS);
  const maxRows = options.maxRows ?? storeIds.length * (options.productQueries?.length ?? DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES.length);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const serviceAccess = options.subscriptionKey && options.storeApiSubscriptionKey
    ? {
        personalizationApiUrl: options.personalizationApiUrl ?? COOP_PERSONALIZATION_API_URL,
        personalizationApiSubscriptionKey: options.subscriptionKey,
        personalizationApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION,
        storeApiUrl: options.storeApiUrl ?? COOP_STORE_API_URL,
        storeApiSubscriptionKey: options.storeApiSubscriptionKey
      }
    : await fetchCoopPublicWeeklyServiceAccess(fetchImpl);
  const rows: CoopWeeklyDiscount[] = [];
  const seenStoreCodes = new Set<string>();

  for (const storeId of storeIds) {
    const sourceUrl = buildCoopStoreInfoUrl(
      storeId,
      options.storeApiVersion ?? DEFAULT_COOP_STORE_API_VERSION,
      serviceAccess.storeApiUrl
    );
    const storeResponse = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'ocp-apim-subscription-key': serviceAccess.storeApiSubscriptionKey,
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!storeResponse.ok) {
      throw new Error(`Coop store info request failed for ${storeId}: ${storeResponse.status}`);
    }

    const store = await storeResponse.json() as CoopStoreResponse;
    const currentFlyer = store.flyers?.find((flyer) => flyer.current === true && flyer.pdfExists === true && flyer.isHemmaBilaga !== true);
    if (!currentFlyer) {
      continue;
    }

    const productSearchUrl = buildCoopSearchUrl(
      storeId,
      options.device ?? DEFAULT_COOP_DEVICE,
      serviceAccess.personalizationApiVersion,
      serviceAccess.personalizationApiUrl
    );

    for (const query of options.productQueries ?? DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES) {
      const response = await fetchImpl(productSearchUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'ocp-apim-subscription-key': serviceAccess.personalizationApiSubscriptionKey,
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        },
        body: JSON.stringify({
          query,
          resultsOptions: { skip: 0, take: 8, sortBy: [], facets: [] },
          relatedResultsOptions: { skip: 0, take: 0 }
        })
      });

      if (!response.ok) {
        throw new Error(`Coop personalization discount search request failed for ${storeId}: ${response.status}`);
      }

      const payload = await response.json() as CoopSearchResponse;
      for (const product of payload.results?.items ?? []) {
        const row = normalizeCoopWeeklyDiscount(product, {
          sourceUrl,
          flyerUrl: text(currentFlyer.pdfUrl),
          productSearchUrl,
          retrievedAt,
          storeId: text(store.ledgerAccountNumber) || storeId,
          storeName: text(store.name),
          region: text(store.city),
          validFrom: text(currentFlyer.startDate),
          validTo: text(currentFlyer.stopDate)
        });
        const seenKey = row ? `${row.storeId}:${row.code}` : '';
        if (!row || seenStoreCodes.has(seenKey)) {
          continue;
        }
        seenStoreCodes.add(seenKey);
        rows.push(row);
        break;
      }
      if (rows.length >= maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export async function fetchCoopWeeklyDiscountsForAllStores(
  options: FetchCoopAllStoreWeeklyDiscountsOptions = {}
): Promise<CoopWeeklyDiscount[]> {
  const stores = await fetchCoopStores({
    fetchImpl: options.fetchImpl,
    maxRows: options.maxStores,
    storeApiVersion: options.storeApiVersion,
    storeApiUrl: options.storeApiUrl,
    storeApiSubscriptionKey: options.storeApiSubscriptionKey,
    includeDetails: options.includeStoreDetails,
    retrievedAt: options.retrievedAt
  });
  return await fetchCoopWeeklyDiscounts({
    fetchImpl: options.fetchImpl,
    storeIds: stores.map((store) => store.storeId),
    storeApiVersion: options.storeApiVersion,
    storeApiUrl: options.storeApiUrl,
    storeApiSubscriptionKey: options.storeApiSubscriptionKey,
    productQueries: options.productQueries,
    maxRows: options.maxRows ?? stores.length * (options.productQueries?.length ?? DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES.length),
    device: options.device,
    apiVersion: options.apiVersion,
    subscriptionKey: options.subscriptionKey,
    personalizationApiUrl: options.personalizationApiUrl,
    retrievedAt: options.retrievedAt
  });
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

export function normalizeCoopStore(
  store: CoopStoreResponse,
  sourceUrl: string,
  retrievedAt: string
): CoopStore | null {
  const ledgerAccountNumber = text(store.ledgerAccountNumber) || text(store.storeId) || text(store.id);
  const name = text(store.name);
  const address = text(store.address);
  const city = text(store.city);
  if (!ledgerAccountNumber || !name || !address || !city) return null;
  return {
    storeId: ledgerAccountNumber,
    siteId: text(store.siteId),
    ledgerAccountNumber,
    name,
    conceptName: text(store.concept?.name) || text(store.conceptName),
    address,
    city,
    postalCode: text(store.postalCode),
    latitude: numberOrNull(store.latitude),
    longitude: numberOrNull(store.longitude),
    weeklyOffersLink: text(store.weeklyOffersLink),
    url: text(store.url),
    sourceUrl,
    retrievedAt
  };
}

export function normalizeCoopWeeklyDiscount(
  product: CoopSearchProduct,
  context: {
    sourceUrl: string;
    flyerUrl: string;
    productSearchUrl: string;
    retrievedAt: string;
    storeId: string;
    storeName: string;
    region: string;
    validFrom: string;
    validTo: string;
  }
): CoopWeeklyDiscount | null {
  const code = text(product.id) || text(product.ean);
  const ean = text(product.ean) || code;
  const name = text(product.name);
  const ordinaryPrice = numberOrNull(product.salesPriceData?.b2cPrice);
  const promotion = product.onlinePromotions?.find((candidate) => numberOrNull(candidate.priceData?.b2cPrice) !== null);
  const offerPrice = numberOrNull(promotion?.priceData?.b2cPrice);
  if (!code || !name || ordinaryPrice === null || offerPrice === null || ordinaryPrice <= offerPrice) {
    return null;
  }

  const offerUnitPrice = numberOrNull(promotion?.comparativePrice?.b2cPrice);
  return {
    code,
    ean,
    name,
    brand: text(product.manufacturerName),
    packageText: text(product.packageSizeInformation),
    ordinaryPrice,
    ordinaryPriceText: `${ordinaryPrice.toFixed(2)} SEK`,
    offerPrice,
    offerPriceText: `${offerPrice.toFixed(2)} SEK`,
    offerUnitPrice,
    offerUnitPriceText: priceWithUnit(offerUnitPrice, product.comparativePriceText),
    offerMechanicText: text(promotion?.message),
    promotionId: text(promotion?.id),
    medMeraRequired: promotion?.medMeraRequired === true,
    storeId: context.storeId,
    storeName: context.storeName,
    region: context.region,
    validFrom: context.validFrom || text(promotion?.startDate),
    validTo: context.validTo || text(promotion?.endDate),
    flyerUrl: context.flyerUrl,
    productSearchUrl: context.productSearchUrl,
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt
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
