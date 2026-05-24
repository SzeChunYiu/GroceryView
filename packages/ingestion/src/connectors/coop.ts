import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

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

export type CoopFlyerOfferHint = {
  query: string;
  code?: string;
  storeIds?: readonly string[];
  offerPrice: number;
  offerUnitPrice?: number;
  offerUnitPriceText?: string;
  offerMechanicText: string;
  medMeraRequired?: boolean;
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
  supportsOnlineProductPrices: boolean;
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
  services?: unknown;
  flyers?: CoopStoreFlyer[];
};

type CoopStoresResponse = {
  stores?: CoopStoreResponse[];
};

type CoopCategoryTreeResponse = {
  nodes?: CoopCategoryTreeNode[];
};

type CoopCategoryTreeNode = {
  code?: unknown;
  name?: unknown;
  children?: CoopCategoryTreeNode[];
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
export const COOP_PERSONALIZATION_BY_ATTRIBUTE_PATH = 'search/entities/by-attribute';
export const COOP_ECOMMERCE_API_URL = 'https://external.api.coop.se/ecommerce';
export const COOP_ECOMMERCE_BASE_STORE = 'coop';
export const COOP_ECOMMERCE_ANONYMOUS_USER = 'anonymous';
export const COOP_STORE_API_URL = 'https://proxy.api.coop.se/external/store/';
export const DEFAULT_COOP_STORE_ID = '251300';
export const DEFAULT_COOP_DEVICE = 'desktop';
export const DEFAULT_COOP_API_VERSION = 'v1';
export const DEFAULT_COOP_STORE_API_VERSION = 'v5';
export const DEFAULT_COOP_SEARCH_QUERY = 'kaffe';
export const DEFAULT_COOP_PRODUCT_QUERIES = [
  DEFAULT_COOP_SEARCH_QUERY,
  'mjölk',
  'pasta',
  'kyckling',
  'smör',
  'yoghurt',
  'banan',
  'ris',
  'fisk'
] as const;

const COOP_REQUEST_TIMEOUT_MS = 20_000;

function withCoopRequestTimeout(fetchImpl: typeof fetch): typeof fetch {
  return async (input, init = {}) => {
    const timeoutSignal = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(COOP_REQUEST_TIMEOUT_MS)
      : undefined;
    return fetchImpl(input, timeoutSignal ? { ...init, signal: init.signal ?? timeoutSignal } : init);
  };
}
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
  '235200',
  '235300',
  '235380',
  '235420',
  '235430',
  '235480',
  '235920',
  '235960',
  '235980',
  '236030',
  '235600',
  '235900',
  '235410',
  '235510',
  '135030',
  '074400',
  '245040',
  '086804',
  '083700',
  '105860',
  '105760',
  '105740',
  '105710',
  '105830',
  '105630',
  '105810',
  '163120',
  '055500',
  '075600',
  '135040',
  '235610',
  '165250',
  '196170',
  '195520',
  '195070',
  '195040',
  '185261',
  '184400',
  '035440',
  '035400',
  '156000',
  '155550',
  '155000',
  '154900',
  '154000',
  '126406',
  '126350',
  '123000',
  '030760',
  '185010',
  '106433',
  '035000',
  '133700',
  '056313',
  '196231',
  '245080',
  '245050',
  '116385',
  '116418',
  '135120',
  '086802',
  '245060',
  '235190',
  '235220',
  '235400',
  '235460',
  '235540',
  '236075',
  '236077',
  '236402',
  '236404',
  '236405',
  '236708',
  '236742',
  '236788',
  '235580',
  '126500',
  '176211',
  '106436',
  '135060',
  '086815',
  '192500',
  '056095',
  '235620',
  '245020',
  '183500',
  '065050',
  '072700',
  '236085',
  '106114',
  '122000',
  '056030',
  '056215',
  '056212',
  '016041',
  '026828',
  '126400',
  '123300',
  '235970',
  '016170',
  '055030',
  '015480',
  '232400',
  '245270',
  '235990',
  '236401',
  '225360',
  '225340',
  '235490',
  '184900',
  '123200',
  '136000',
  '236464',
  '133900',
  '016195',
  '246549',
  '246550',
  '245030',
  '085130',
  '085320',
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
  'Bravo Juice Tropisk',
  'falukorv',
  'avokado',
  'spare ribs',
  'finish',
  'ost',
  'fiskpinnar coop'
];
const COOP_LUND_STADION_FLYER_STORE_IDS = ['105860', '105760', '105740', '105710', '105830', '105630', '105810'] as const;
const COOP_AVENYN_MATCHED_FLYER_STORE_IDS = ['163120', '135120'] as const;
const COOP_SMALL_STORE_MATCHED_FLYER_STORE_IDS = [
  '056313',
  '196231',
  '245080',
  '245050',
  '116385',
  '116418',
  '086802',
  '245060',
  '235190',
  '235220',
  '235400'
] as const;
export const DEFAULT_COOP_WEEKLY_FLYER_OFFER_HINTS: readonly CoopFlyerOfferHint[] = [
  {
    query: 'Färsk laxfilé Harbour',
    code: '2383471000006',
    storeIds: COOP_LUND_STADION_FLYER_STORE_IDS,
    offerPrice: 149,
    offerUnitPrice: 149,
    offerUnitPriceText: '149.00 kr/kg',
    offerMechanicText: 'Medlemspris-Färsk laxfilé-149:- /kg',
    medMeraRequired: true
  },
  {
    query: 'Mini vattenmelon',
    code: '2317342100007',
    storeIds: COOP_LUND_STADION_FLYER_STORE_IDS,
    offerPrice: 20,
    offerUnitPrice: 20,
    offerUnitPriceText: '20.00 kr/kg',
    offerMechanicText: 'Medlemspris-Mini vattenmelon-20:- /kg',
    medMeraRequired: true
  },
  {
    query: 'Hushållsost Arla',
    code: '2340375400004',
    storeIds: COOP_LUND_STADION_FLYER_STORE_IDS,
    offerPrice: 74.9,
    offerUnitPrice: 74.9,
    offerUnitPriceText: '74.90 kr/kg',
    offerMechanicText: 'Medlemspris-Hushållsost-74:90 /kg',
    medMeraRequired: true
  },
  {
    query: 'Svenskt smör Arla 500 g',
    code: '7310865005168',
    storeIds: COOP_LUND_STADION_FLYER_STORE_IDS,
    offerPrice: 45,
    offerUnitPrice: 90,
    offerUnitPriceText: '90.00 kr/kg',
    offerMechanicText: 'Medlemspris-Svenskt smör-45:- /st',
    medMeraRequired: true
  },
  {
    query: 'Bacon Scan 3-pack',
    code: '7300206718000',
    storeIds: COOP_LUND_STADION_FLYER_STORE_IDS,
    offerPrice: 37.9,
    offerUnitPrice: 90.24,
    offerUnitPriceText: '90.24 kr/kg',
    offerMechanicText: 'Bacon 3-pack-37:90 /st'
  },
  {
    query: 'Torskryggfilé Royal Greenland 3-pack',
    code: '5740301203124',
    storeIds: COOP_LUND_STADION_FLYER_STORE_IDS,
    offerPrice: 119,
    offerUnitPrice: 317.33,
    offerUnitPriceText: '317.33 kr/kg',
    offerMechanicText: 'Torskryggfilé 3-pack-119:- /förp'
  },
  ...coopFlyerOfferHints(COOP_AVENYN_MATCHED_FLYER_STORE_IDS, [
    ['Färsk laxfilé Harbour', '2383471000006', 149, 149, '149.00 kr/kilo', '149 kr/kg', true],
    ['Mini vattenmelon', '2317342100007', 20, 20, '20.00 kr/kilo', 'Medlemspris-Vattenmelon Mini-20:- /kg', true],
    ['Svenskt smör Arla 500 g', '7310865005168', 45, 90, '90.00 kr/kilo', 'Medlemspris-Smör 45 kr/st-1 för 45:-', true],
    ['Hushållsost Arla', '2340375400004', 74.9, 74.9, '74.90 kr/kilo', 'Medlemspris-Hushållsost-74:90 /kg', true],
    ['Toalettpapper 24-pack Coop', '7340191179691', 99, 42.45, '42.45 kr/kilo', 'Toalettpapper Nice & Soft 24-pack-99:- /st', false],
    ['Bacon Scan 3-pack', '7300206718000', 37.9, 90.24, '90.24 kr/kilo', 'Bacon 3-pack-37:90 /st', false],
    ['Grekisk yoghurt Arla Köket 1000 g', '7310865095466', 29.9, 29.9, '29.90 kr/kilo', 'Grekisk yoghurt 10%-29:90 /st', false],
    ['Olivolja Monini 750', '80508816', 89, 118.67, '118.67 kr/liter', 'Olivolja Classico-89:- /st', false],
    ['Kalkonbröstfilé Ingelsta', '7331044072573', 76.9, 192.25, '192.25 kr/kilo', 'Kalkonbröstfilé-76:90 /st', false],
    ['Danish Crown fläskfilé', '2385912200006', 99, 99, '99.00 kr/kilo', '99 kg/kg', false],
    ['Coop stekfläsk', '2317264300004', 89, 89, '89.00 kr/kilo', 'Stekfläsk Skivor-89:- /kg', false],
    ['Kycklingbröstfilé Guldfågeln mango chili', '2307125100003', 149, 149, '149.00 kr/kilo', 'Kycklingbröstfilé Tvådelad Marinerad Mango Chili Glaze-149:- /kg', false],
    ['Lövbiff fransyska Coop', '2317075000001', 179, 179, '179.00 kr/kilo', 'Lövbiff av fransyska-179:- /kg', false],
    ['Torskryggfilé Royal Greenland 3-pack', '5740301203124', 119, 317.33, '317.33 kr/kilo', 'Torskryggfilé 3-pack-119:- /st', false],
    ['Fläskkarré Dalsjöfors eld rök', '2330120500004', 79.9, 79.9, '79.90 kr/kilo', 'Karré Eld & rök-79:90 /kg', false],
    ['Pepsi Max 20-pack', '7310074009230', 84, 12.73, '12.73 kr/liter', 'Pepsi Max 20-pack-84:- /st', false],
    ['Grillkorv Scan tunt skinn', '7300207071005', 39, 60.94, '60.94 kr/kilo', 'Medlemspris-Grillkorv med tunt skinn-39:- /st', true],
    ['Lök Gul Eko Änglamark', '7300156596727', 13, 26, '26.00 kr/kilo', 'Lök Gul Eko-13:- /st', false],
    ['Rabarber', '2097474500004', 38, 38, '38.00 kr/kilo', 'Rabarber-38:- /kg', false],
    ['Fazer Lantbröd Havssalt', '7314873525014', 25, 41.67, '41.67 kr/kilo', 'Lantbröd Havssalt-25:- /st', false],
    ['Pågen Lingongrova Special', '7311070330243', 20, 40, '40.00 kr/kilo', 'Lingongrova Special-20:- /st', false],
    ['Engelmanns Salami Milano', '7350051211164', 39.9, 498.75, '498.75 kr/kilo', 'Salami Milano-39:90 /st', false],
    ['Marabou Chokladpraliner Hjärta', '7622210929525', 45, 272.73, '272.73 kr/kilo', 'Chokladpraliner Hjärta-45:- /st', false],
    ['Vanish White Gold', '5701092111067', 54.9, 116.81, '116.81 kr/kilo', 'Fläckborttagning White Gold-54:90 /st', false],
    ['NIVEA Q10 Energy', '4006000089874', 89, 1780, '1780.00 kr/liter', 'Dagkräm Q10 Energy spf 15-89:- /st', false],
    ['Bravo Juice Tropisk', '7310867561020', 34, 17, '17.00 kr/liter', 'Medlemspris-Juice Tropisk-34:- /st', true]
  ]),
  ...coopFlyerOfferHints(COOP_SMALL_STORE_MATCHED_FLYER_STORE_IDS, [
    ['falukorv', '7300206787006', 35, 43.75, '43.75 kr/kg', 'Medlemspris-Falukorv-35:- /st', true],
    ['avokado', '7300156589538', 27, 67.5, '67.50 kr/kg', 'Medlemspris-Ätmogen avokado 3-pack-27:- /förp', true],
    ['spare ribs', '7300156498861', 55, 110, '110.00 kr/kg', 'Spare ribs-55:- /st', false],
    ['finish', '5714970007970', 49.5, 1.18, '1.18 kr/tvätt/disk', 'Maskindisktabletter-2 för 99:-', false],
    ['ost', '2340380300009', 75, 75, '75.00 kr/kg', 'Medlemspris-Ost familjefavoriter-75:- /kg', true],
    ['fiskpinnar coop', '7340191175846', 30, 66.67, '66.67 kr/kg', 'Fiskpinnar-30:- /st', false]
  ])
];

function coopFlyerOfferHints(
  storeIds: readonly string[],
  rows: readonly (readonly [string, string, number, number, string, string, boolean])[]
): CoopFlyerOfferHint[] {
  return rows.map(([query, code, offerPrice, offerUnitPrice, offerUnitPriceText, offerMechanicText, medMeraRequired]) => ({
    query,
    code,
    storeIds,
    offerPrice,
    offerUnitPrice,
    offerUnitPriceText,
    offerMechanicText,
    medMeraRequired
  }));
}

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

export type FetchCoopProductCatalogOptions = Omit<FetchCoopProductsOptions, 'query' | 'maxRows'> & {
  queries?: readonly string[];
  categoryIds?: readonly string[];
  maxRows?: number;
  maxRowsPerQuery?: number;
  maxRowsPerCategory?: number;
  ecommerceApiUrl?: string;
  ecommerceApiSubscriptionKey?: string;
};

export type FetchCoopProductsForAllStoresOptions = Omit<FetchCoopProductsOptions, 'storeId' | 'query' | 'maxRows'> & AllStoreTaskRunnerControls & {
  queries?: readonly string[];
  categoryIds?: readonly string[];
  maxStores?: number;
  maxRowsPerStore?: number;
  includeStoreDetails?: boolean;
  storeApiVersion?: string;
  storeApiUrl?: string;
  storeApiSubscriptionKey?: string;
  ecommerceApiUrl?: string;
  ecommerceApiSubscriptionKey?: string;
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
  flyerOfferHints?: readonly CoopFlyerOfferHint[];
  pdfTextExtractor?: (input: ArrayBuffer) => Promise<string>;
};

export type FetchCoopAllStoreWeeklyDiscountsOptions = Omit<FetchCoopWeeklyDiscountsOptions, 'storeId' | 'storeIds'> & AllStoreTaskRunnerControls & {
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
  onlineProductPricesOnly?: boolean;
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


export function buildCoopCategoryTreeUrl(
  storeId = DEFAULT_COOP_STORE_ID,
  apiVersion = DEFAULT_COOP_API_VERSION,
  ecommerceApiUrl = COOP_ECOMMERCE_API_URL
): string {
  const baseUrl = ecommerceApiUrl.endsWith('/') ? ecommerceApiUrl : `${ecommerceApiUrl}/`;
  const url = new URL(`${COOP_ECOMMERCE_BASE_STORE}/users/${encodeURIComponent(COOP_ECOMMERCE_ANONYMOUS_USER)}/categories/tree/${encodeURIComponent(storeId)}`, baseUrl);
  url.searchParams.set('api-version', apiVersion);
  return url.toString();
}

export function buildCoopCategoryProductsUrl(
  storeId = DEFAULT_COOP_STORE_ID,
  device = DEFAULT_COOP_DEVICE,
  apiVersion = DEFAULT_COOP_API_VERSION,
  personalizationApiUrl = COOP_PERSONALIZATION_API_URL
): string {
  const baseUrl = personalizationApiUrl.endsWith('/') ? personalizationApiUrl : `${personalizationApiUrl}/`;
  const url = new URL(COOP_PERSONALIZATION_BY_ATTRIBUTE_PATH, baseUrl);
  url.searchParams.set('store', storeId);
  url.searchParams.set('device', device);
  url.searchParams.set('direct', 'false');
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
  fetchImpl = withCoopRequestTimeout(fetchImpl);
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
  fetchImpl = withCoopRequestTimeout(fetchImpl);
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
  const fetchImpl = withCoopRequestTimeout(options.fetchImpl ?? fetch);
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
  const maxSummaries = options.maxRows && !options.onlineProductPricesOnly ? summaries.slice(0, options.maxRows) : summaries;
  const concurrency = 8;
  for (let index = 0; index < maxSummaries.length; index += concurrency) {
    const batch = maxSummaries.slice(index, index + concurrency);
    const settled = await Promise.allSettled(batch.map(async (summary) => {
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
      return normalizeCoopStore({ ...summary, ...detail }, sourceUrl, retrievedAt);
    }));
    for (let offset = 0; offset < settled.length; offset += 1) {
      const result = settled[offset]!;
      const summary = batch[offset]!;
      const fallbackRow = result.status === 'rejected'
        ? normalizeCoopStore(summary, sourceUrl, retrievedAt)
        : result.value;
      if (!fallbackRow || seenStoreIds.has(fallbackRow.storeId)) continue;
      if (options.onlineProductPricesOnly && !fallbackRow.supportsOnlineProductPrices) continue;
      seenStoreIds.add(fallbackRow.storeId);
      rows.push(fallbackRow);
      if (options.maxRows && rows.length >= options.maxRows) break;
    }
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


export async function fetchCoopCategoryIds(options: FetchCoopProductCatalogOptions = {}): Promise<string[]> {
  const fetchImpl = withCoopRequestTimeout(options.fetchImpl ?? fetch);
  const serviceAccess = options.subscriptionKey || options.ecommerceApiSubscriptionKey
    ? {
        ecommerceApiUrl: options.ecommerceApiUrl ?? COOP_ECOMMERCE_API_URL,
        ecommerceApiSubscriptionKey: options.ecommerceApiSubscriptionKey ?? options.subscriptionKey!,
        ecommerceApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION
      }
    : {
        ecommerceApiUrl: COOP_ECOMMERCE_API_URL,
        ecommerceApiSubscriptionKey: (await fetchCoopPublicServiceAccess(fetchImpl)).personalizationApiSubscriptionKey,
        ecommerceApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION
      };
  const sourceUrl = buildCoopCategoryTreeUrl(
    options.storeId ?? DEFAULT_COOP_STORE_ID,
    serviceAccess.ecommerceApiVersion,
    serviceAccess.ecommerceApiUrl
  );
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'ocp-apim-subscription-key': serviceAccess.ecommerceApiSubscriptionKey,
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Coop category tree request failed: ${response.status}`);
  const payload = await response.json() as CoopCategoryTreeResponse;
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const node of payload.nodes ?? []) {
    const id = text(node.code);
    if (!id || !text(node.name) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (ids.length === 0) throw new Error('Coop category tree had no usable category ids.');
  return ids;
}

export async function fetchCoopProductsByCategory(input: FetchCoopProductCatalogOptions & { categoryId: string }): Promise<CoopProduct[]> {
  const fetchImpl = withCoopRequestTimeout(input.fetchImpl ?? fetch);
  const maxRows = input.maxRows ?? input.maxRowsPerCategory ?? Number.POSITIVE_INFINITY;
  const pageSize = input.maxRowsPerCategory ?? 1000;
  const retrievedAt = input.retrievedAt ?? new Date().toISOString();
  const serviceAccess = input.subscriptionKey
    ? {
        personalizationApiUrl: input.personalizationApiUrl ?? COOP_PERSONALIZATION_API_URL,
        personalizationApiSubscriptionKey: input.subscriptionKey,
        personalizationApiVersion: input.apiVersion ?? DEFAULT_COOP_API_VERSION
      }
    : await fetchCoopPublicServiceAccess(fetchImpl);
  const sourceUrl = buildCoopCategoryProductsUrl(
    input.storeId ?? DEFAULT_COOP_STORE_ID,
    input.device ?? DEFAULT_COOP_DEVICE,
    serviceAccess.personalizationApiVersion,
    serviceAccess.personalizationApiUrl
  );
  const rows: CoopProduct[] = [];
  const seenCodes = new Set<string>();
  for (let skip = 0; rows.length < maxRows; skip += pageSize) {
    const take = Math.min(pageSize, Math.max(0, maxRows - rows.length));
    if (take <= 0) break;
    const response = await fetchImpl(sourceUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'ocp-apim-subscription-key': serviceAccess.personalizationApiSubscriptionKey,
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      },
      body: JSON.stringify({
        attribute: { name: 'categoryIds', value: input.categoryId },
        resultsOptions: { skip, take, sortBy: [], facets: [] },
        customData: { getEntitiesByAttributeABTest: false }
      })
    });
    if (!response.ok) throw new Error(`Coop category product request failed for ${input.categoryId}: ${response.status}`);
    const textPayload = await response.text();
    if (!textPayload) break;
    const payload = JSON.parse(textPayload) as CoopSearchResponse;
    const products = payload.results?.items ?? [];
    for (const product of products) {
      const row = normalizeCoopProduct(product, sourceUrl, retrievedAt);
      if (!row || seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
    const total = numberOrNull(payload.results?.count);
    if (products.length < take || (total !== null && skip + products.length >= total)) break;
  }
  return rows;
}

export async function fetchCoopProducts(options: FetchCoopProductsOptions = {}): Promise<CoopProduct[]> {
  const fetchImpl = withCoopRequestTimeout(options.fetchImpl ?? fetch);
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

export async function fetchCoopProductCatalog(
  options: FetchCoopProductCatalogOptions = {}
): Promise<CoopProduct[]> {
  const fetchImpl = withCoopRequestTimeout(options.fetchImpl ?? fetch);
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const serviceAccess = options.subscriptionKey
    ? {
        personalizationApiUrl: options.personalizationApiUrl ?? COOP_PERSONALIZATION_API_URL,
        personalizationApiSubscriptionKey: options.subscriptionKey,
        personalizationApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION
      }
    : await fetchCoopPublicServiceAccess(fetchImpl);

  const rows: CoopProduct[] = [];
  const seenCodes = new Set<string>();
  if (options.queries) {
    const maxRowsPerQuery = options.maxRowsPerQuery ?? 1000;
    for (const query of options.queries) {
      const products = await fetchCoopProducts({
        fetchImpl,
        query,
        maxRows: maxRowsPerQuery,
        storeId: options.storeId,
        device: options.device,
        apiVersion: serviceAccess.personalizationApiVersion,
        subscriptionKey: serviceAccess.personalizationApiSubscriptionKey,
        personalizationApiUrl: serviceAccess.personalizationApiUrl,
        retrievedAt
      });
      for (const product of products) {
        if (seenCodes.has(product.code)) continue;
        seenCodes.add(product.code);
        rows.push(product);
        if (rows.length >= maxRows) return rows;
      }
    }
    return rows;
  }

  const categoryIds = options.categoryIds ?? await fetchCoopCategoryIds({
    ...options,
    fetchImpl,
    apiVersion: serviceAccess.personalizationApiVersion,
    subscriptionKey: serviceAccess.personalizationApiSubscriptionKey
  });
  for (const categoryId of categoryIds) {
    const products = await fetchCoopProductsByCategory({
      ...options,
      fetchImpl,
      categoryId,
      maxRows: Number.isFinite(maxRows) ? Math.max(0, maxRows - rows.length) : undefined,
      apiVersion: serviceAccess.personalizationApiVersion,
      subscriptionKey: serviceAccess.personalizationApiSubscriptionKey,
      personalizationApiUrl: serviceAccess.personalizationApiUrl,
      retrievedAt
    });
    for (const product of products) {
      if (seenCodes.has(product.code)) continue;
      seenCodes.add(product.code);
      rows.push(product);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export async function fetchCoopProductsForAllStores(
  options: FetchCoopProductsForAllStoresOptions = {}
): Promise<CoopStoreProduct[]> {
  const fetchImpl = withCoopRequestTimeout(options.fetchImpl ?? fetch);
  const serviceAccess = options.subscriptionKey && options.storeApiSubscriptionKey
    ? {
        personalizationApiUrl: options.personalizationApiUrl ?? COOP_PERSONALIZATION_API_URL,
        personalizationApiSubscriptionKey: options.subscriptionKey,
        personalizationApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION,
        storeApiUrl: options.storeApiUrl ?? COOP_STORE_API_URL,
        storeApiSubscriptionKey: options.storeApiSubscriptionKey
      }
    : await fetchCoopPublicWeeklyServiceAccess(fetchImpl);
  const stores = await fetchCoopStores({
    fetchImpl,
    maxRows: options.maxStores,
    storeApiVersion: options.storeApiVersion,
    storeApiUrl: serviceAccess.storeApiUrl,
    storeApiSubscriptionKey: serviceAccess.storeApiSubscriptionKey,
    includeDetails: options.includeStoreDetails,
    onlineProductPricesOnly: true,
    retrievedAt: options.retrievedAt
  });
  const { rows, failures } = await runAllStoreTasks({
    stores,
    storeId: (store) => store.storeId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (store) => {
      const products = await fetchCoopProductCatalog({
        fetchImpl,
        queries: options.queries,
        categoryIds: options.categoryIds,
        maxRows: options.maxRowsPerStore,
        maxRowsPerQuery: options.maxRowsPerStore,
        maxRowsPerCategory: options.maxRowsPerStore,
        storeId: store.storeId,
        device: options.device,
        apiVersion: serviceAccess.personalizationApiVersion,
        subscriptionKey: serviceAccess.personalizationApiSubscriptionKey,
        personalizationApiUrl: serviceAccess.personalizationApiUrl,
        ecommerceApiUrl: options.ecommerceApiUrl,
        ecommerceApiSubscriptionKey: options.ecommerceApiSubscriptionKey ?? serviceAccess.personalizationApiSubscriptionKey,
        retrievedAt: options.retrievedAt
      });
      return products.map((product) => ({
        ...product,
        storeId: store.storeId,
        storeName: store.name,
        city: store.city
      }));
    }
  });
  if (rows.length === 0 && failures.length > 0) throw new Error(`Coop all-store product requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
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
    const flyers = (store.flyers ?? [])
      .filter((flyer) => flyer.pdfExists === true && flyer.isHemmaBilaga !== true && text(flyer.pdfUrl))
      .sort((left, right) => Number(right.current === true) - Number(left.current === true));
    const currentFlyer = flyers[0];
    if (!currentFlyer) {
      continue;
    }
    const storeRowCountBeforeProductSearch = rows.length;

    const productSearchUrl = buildCoopSearchUrl(
      storeId,
      options.device ?? DEFAULT_COOP_DEVICE,
      serviceAccess.personalizationApiVersion,
      serviceAccess.personalizationApiUrl
    );

    for (const query of options.productQueries ?? DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES) {
      const flyerOfferHint = findFlyerOfferHint(
        options.flyerOfferHints ?? DEFAULT_COOP_WEEKLY_FLYER_OFFER_HINTS,
        storeId,
        query
      );
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
      const products = prioritizeHintedProduct(payload.results?.items ?? [], flyerOfferHint);
      for (const product of products) {
        const row = normalizeCoopWeeklyDiscount(product, {
          sourceUrl,
          flyerUrl: text(currentFlyer.pdfUrl),
          productSearchUrl,
          retrievedAt,
          storeId: text(store.ledgerAccountNumber) || storeId,
          storeName: text(store.name),
          region: text(store.city),
          validFrom: text(currentFlyer.startDate),
          validTo: text(currentFlyer.stopDate),
          flyerOfferHint
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

    if (rows.length === storeRowCountBeforeProductSearch) {
      for (const flyer of flyers) {
        const pdfRows = await fetchCoopDrPdfWeeklyDiscounts({
          fetchImpl,
          flyerUrl: text(flyer.pdfUrl),
          pdfTextExtractor: options.pdfTextExtractor,
          retrievedAt,
          storeId: text(store.ledgerAccountNumber) || storeId,
          storeName: text(store.name),
          region: text(store.city),
          validFrom: text(flyer.startDate),
          validTo: text(flyer.stopDate),
          sourceUrl,
          maxRows: Math.max(0, maxRows - rows.length)
        });
        for (const row of pdfRows) {
          const seenKey = `${row.storeId}:${row.code}`;
          if (seenStoreCodes.has(seenKey)) continue;
          seenStoreCodes.add(seenKey);
          rows.push(row);
          if (rows.length >= maxRows) return rows;
        }
        if (rows.length > storeRowCountBeforeProductSearch) break;
      }
    }
  }

  return rows;
}

type FetchCoopDrPdfWeeklyDiscountsInput = {
  fetchImpl: typeof fetch;
  flyerUrl: string;
  pdfTextExtractor?: (input: ArrayBuffer) => Promise<string>;
  retrievedAt: string;
  storeId: string;
  storeName: string;
  region: string;
  validFrom: string;
  validTo: string;
  sourceUrl: string;
  maxRows: number;
};

async function fetchCoopDrPdfWeeklyDiscounts(input: FetchCoopDrPdfWeeklyDiscountsInput): Promise<CoopWeeklyDiscount[]> {
  if (!input.flyerUrl || input.maxRows <= 0) return [];
  const response = await input.fetchImpl(input.flyerUrl, {
    headers: {
      accept: 'application/pdf,*/*',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) {
    return [];
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType && !contentType.toLowerCase().includes('pdf')) {
    return [];
  }
  try {
    const text = await (input.pdfTextExtractor ?? extractCoopDrPdfText)(await response.arrayBuffer());
    return parseCoopDrPdfTextOffers(text, {
      flyerUrl: input.flyerUrl,
      sourceUrl: input.sourceUrl,
      productSearchUrl: input.flyerUrl,
      retrievedAt: input.retrievedAt,
      storeId: input.storeId,
      storeName: input.storeName,
      region: input.region,
      validFrom: input.validFrom,
      validTo: input.validTo,
      maxRows: input.maxRows
    });
  } catch {
    return [];
  }
}

export async function extractCoopDrPdfText(input: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data: new Uint8Array(input) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = content.items
      .map((item: { str?: unknown }) => typeof item.str === 'string' ? text(item.str) : '')
      .filter(Boolean);
    pages.push(lines.join('\n'));
  }
  return pages.join('\n');
}

export type ParseCoopDrPdfTextOffersOptions = {
  flyerUrl: string;
  sourceUrl: string;
  productSearchUrl: string;
  retrievedAt: string;
  storeId: string;
  storeName: string;
  region: string;
  validFrom: string;
  validTo: string;
  maxRows?: number;
};

export function parseCoopDrPdfTextOffers(textContent: string, options: ParseCoopDrPdfTextOffersOptions): CoopWeeklyDiscount[] {
  const lines = textContent
    .split(/\r?\n|\s+\|\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows: CoopWeeklyDiscount[] = [];
  const seen = new Set<string>();
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;

  for (const chunk of splitCoopDrPdfPages(lines)) {
    if (rows.length >= maxRows) break;
    const remainingRows = Math.max(0, maxRows - rows.length);
    const linearRows = parseCoopDrLinearPdfTextOffers(chunk, options, remainingRows);
    const sequentialRows = parseCoopDrSequentialPdfTextOffers(chunk, options, remainingRows);
    const chosenRows = hasCoopDrColumnarOfferPage(chunk) || sequentialRows.length > linearRows.length
      ? sequentialRows
      : linearRows;
    for (const row of chosenRows) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) break;
    }
  }

  return rows;
}

function parseCoopDrLinearPdfTextOffers(
  lines: readonly string[],
  options: ParseCoopDrPdfTextOffersOptions,
  maxRows: number
): CoopWeeklyDiscount[] {
  const rows: CoopWeeklyDiscount[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length && rows.length < maxRows; index += 1) {
    const priceMatch = coopDrOfferPriceAt(lines, index);
    if (!priceMatch) continue;
    const nameIndex = findCoopDrOfferNameIndex(lines, index - 1);
    if (nameIndex === null) continue;
    const name = lines[nameIndex]!;
    const ordinaryPrice = ordinaryPriceFromCoopDrLines(lines, nameIndex + 1, index);
    if (ordinaryPrice === null || ordinaryPrice <= priceMatch.price) continue;
    const packageText = lines
      .slice(nameIndex + 1, index)
      .filter((line) => !isCoopDrNonProductLine(line))
      .join(' ');
    const code = `dr:${options.storeId}:${stableCoopDrKey(`${name}:${priceMatch.price}:${options.validFrom}`)}`;
    if (seen.has(code)) continue;
    seen.add(code);
    rows.push({
      code,
      ean: '',
      name,
      brand: '',
      packageText,
      ordinaryPrice,
      ordinaryPriceText: '',
      offerPrice: priceMatch.price,
      offerPriceText: `${priceMatch.price.toFixed(2)} SEK`,
      offerUnitPrice: priceMatch.unitPrice,
      offerUnitPriceText: priceMatch.unitText,
      offerMechanicText: `${name} ${priceMatch.displayText}`.trim(),
      promotionId: `dr:${options.storeId}:${stableCoopDrKey(`${name}:${priceMatch.displayText}:${options.validFrom}`)}`,
      medMeraRequired: hasNearbyCoopDrMemberPrice(lines, nameIndex, priceMatch.nextIndex),
      storeId: options.storeId,
      storeName: options.storeName,
      region: options.region,
      validFrom: options.validFrom,
      validTo: options.validTo,
      flyerUrl: options.flyerUrl,
      productSearchUrl: options.productSearchUrl,
      sourceUrl: options.sourceUrl,
      retrievedAt: options.retrievedAt
    });
    index = Math.max(index, priceMatch.nextIndex - 1);
  }

  return rows;
}

function hasCoopDrColumnarOfferPage(lines: readonly string[]): boolean {
  return splitCoopDrPdfPages(lines).some((chunk) => {
    const firstPriceIndex = chunk.findIndex((_, index) => coopDrOfferPriceAt(chunk, index) !== null);
    if (firstPriceIndex < 12) return false;
    const nameCount = chunk.slice(0, firstPriceIndex).filter(isCoopDrOfferNameCandidate).length;
    let priceCount = 0;
    for (let index = firstPriceIndex; index < chunk.length; index += 1) {
      const price = coopDrOfferPriceAt(chunk, index);
      if (!price) continue;
      priceCount += 1;
      index = Math.max(index, price.nextIndex - 1);
    }
    return nameCount >= 3 && priceCount >= 3;
  });
}


type CoopDrOfferPriceMatch = {
  price: number;
  ordinaryPrice: number;
  unitPrice: number | null;
  unitText: string;
  displayText: string;
  nextIndex: number;
};

function coopDrOfferPriceAt(lines: readonly string[], index: number): CoopDrOfferPriceMatch | null {
  const current = lines[index] ?? '';
  const next = lines[index + 1] ?? '';
  const nextNext = lines[index + 2] ?? '';
  const standalone = current.match(/^(\d{1,4})(?::|:-)$/);
  const coopGlyphStandalone = current.match(/^(\d{1,4})k$/i);
  if (standalone || coopGlyphStandalone) {
    const price = Number((standalone ?? coopGlyphStandalone)![1]);
    if (!Number.isFinite(price)) return null;
    const unitText = unitTextFromCoopDrLine(next);
    return {
      price,
      ordinaryPrice: price,
      unitPrice: unitText === '/kg' ? price : null,
      unitText,
      displayText: `${current}${unitText ? ` ${unitText}` : ''}`,
      nextIndex: unitText ? index + 2 : index + 1
    };
  }

  if (/^\d{1,4}$/.test(current) && /^\d{2}$/.test(next) && unitTextFromCoopDrLine(nextNext)) {
    const price = Number(`${current}.${next}`);
    if (!Number.isFinite(price)) return null;
    const unitText = unitTextFromCoopDrLine(nextNext);
    return {
      price,
      ordinaryPrice: price,
      unitPrice: unitText === '/kg' ? price : null,
      unitText,
      displayText: `${current}:${next} ${unitText}`,
      nextIndex: index + 3
    };
  }

  if (/^\d{1,4}$/.test(current) && unitTextFromCoopDrLine(next)) {
    const price = Number(current);
    if (!Number.isFinite(price)) return null;
    const unitText = unitTextFromCoopDrLine(next);
    return {
      price,
      ordinaryPrice: price,
      unitPrice: unitText === '/kg' ? price : null,
      unitText,
      displayText: `${current} ${unitText}`,
      nextIndex: index + 2
    };
  }

  return null;
}

function findCoopDrOfferNameIndex(lines: readonly string[], startIndex: number): number | null {
  for (let index = startIndex; index >= Math.max(0, startIndex - 8); index -= 1) {
    const line = lines[index] ?? '';
    if (!isCoopDrOfferNameCandidate(line)) continue;
    if (/^[\p{Lu}ÅÄÖ][\p{L}ÅÄÖåäö'’ -]{1,24}\.$/u.test(line)) {
      const previousLine = lines[index - 1] ?? '';
      if (isCoopDrOfferNameCandidate(previousLine) && !previousLine.endsWith('.')) return index - 1;
    }
    return index;
  }
  return null;
}

function isCoopDrOfferNameCandidate(line: string): boolean {
  const normalized = line.trim();
  if (!normalized || isCoopDrNonProductLine(normalized) || /^\d/.test(normalized)) return false;
  if (normalized === normalized.toUpperCase() && /[A-ZÅÄÖ]{3}/.test(normalized)) return false;
  if (/^\p{Ll}/u.test(normalized)) return false;
  if (normalized.length > 48) return false;
  if (normalized.includes('/')) return false;
  if (/[.].*[.]/.test(normalized)) return false;
  if (/\b(ca\s*)?\d+(?:[,.]\d+)?(?:-\d+(?:[,.]\d+)?)?\s*(g|kg|ml|liter|l|st|pack|förp|disk)\b/i.test(normalized)) return false;
  if (/\b(klass|välj|gäller|fetthalt|fryst|kyld|jfr-pris|ord\. pris|till låga priser)\b/i.test(normalized)) return false;
  return true;
}

function parseCoopDrSequentialPdfTextOffers(
  lines: readonly string[],
  options: ParseCoopDrPdfTextOffersOptions,
  maxRows: number
): CoopWeeklyDiscount[] {
  void lines;
  void options;
  void maxRows;
  return [];
}

function splitCoopDrPdfPages(lines: readonly string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/^c[anx]_\d+_/i.test(line) && current.length > 0) {
      chunks.push(current);
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function unitTextFromCoopDrLine(line: string): string {
  const normalized = line.trim().toLowerCase();
  if (/^\/(st|kg|ask|förp|liter|l|hg|påse|frp)$/.test(normalized)) return normalized;
  return '';
}

function ordinaryPriceFromCoopDrLines(lines: readonly string[], startIndex: number, endIndex: number): number | null {
  const context = lines.slice(Math.max(0, startIndex), Math.max(startIndex, endIndex)).join(' ');
  const match = context.match(/\bord\.\s*pris(?:\s*från)?\s+(\d{1,4})(?::(\d{2}))?/i);
  if (!match) return null;
  const kronor = Number(match[1]);
  const ore = match[2] ? Number(match[2]) / 100 : 0;
  const price = kronor + ore;
  return Number.isFinite(price) ? price : null;
}

function isCoopDrNonProductLine(line: string): boolean {
  const normalized = line.trim().toLowerCase();
  return (
    normalized.length <= 1 ||
    normalized.startsWith('jfr-pris') ||
    normalized.startsWith('ord. pris') ||
    normalized.startsWith('tidigare lägsta pris') ||
    normalized.startsWith('du sparar') ||
    normalized === 'medlemspris' ||
    normalized.startsWith('max ') ||
    normalized.includes('välkommen till') ||
    normalized.includes('erbjudanden för') ||
    normalized.includes('missa inte') ||
    normalized.includes('veckans bästa') ||
    normalized.startsWith('cx_') ||
    unitTextFromCoopDrLine(normalized) !== ''
  );
}

function hasNearbyCoopDrMemberPrice(lines: readonly string[], nameIndex: number, nextIndex: number): boolean {
  return lines.slice(nameIndex, Math.min(lines.length, nextIndex + 4)).some((line) => line.trim().toLowerCase() === 'medlemspris');
}

function stableCoopDrKey(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'offer';
}

export async function fetchCoopWeeklyDiscountsForAllStores(
  options: FetchCoopAllStoreWeeklyDiscountsOptions = {}
): Promise<CoopWeeklyDiscount[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const serviceAccess = options.subscriptionKey && options.storeApiSubscriptionKey
    ? {
        personalizationApiUrl: options.personalizationApiUrl ?? COOP_PERSONALIZATION_API_URL,
        personalizationApiSubscriptionKey: options.subscriptionKey,
        personalizationApiVersion: options.apiVersion ?? DEFAULT_COOP_API_VERSION,
        storeApiUrl: options.storeApiUrl ?? COOP_STORE_API_URL,
        storeApiSubscriptionKey: options.storeApiSubscriptionKey
      }
    : await fetchCoopPublicWeeklyServiceAccess(fetchImpl);
  const stores = await fetchCoopStores({
    fetchImpl,
    maxRows: options.maxStores,
    storeApiVersion: options.storeApiVersion,
    storeApiUrl: serviceAccess.storeApiUrl,
    storeApiSubscriptionKey: serviceAccess.storeApiSubscriptionKey,
    includeDetails: options.includeStoreDetails,
    retrievedAt: options.retrievedAt
  });
  const maxRows = options.maxRows ?? stores.length * (options.productQueries?.length ?? DEFAULT_COOP_WEEKLY_DISCOUNT_QUERIES.length);
  const { rows, failures } = await runAllStoreTasks<CoopStore, CoopWeeklyDiscount>({
    stores,
    storeId: (store) => store.storeId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (store) => await fetchCoopWeeklyDiscounts({
        fetchImpl,
        storeIds: [store.storeId],
        storeApiVersion: options.storeApiVersion,
        storeApiUrl: serviceAccess.storeApiUrl,
        storeApiSubscriptionKey: serviceAccess.storeApiSubscriptionKey,
        productQueries: options.productQueries,
        maxRows,
        device: options.device,
        apiVersion: serviceAccess.personalizationApiVersion,
        subscriptionKey: serviceAccess.personalizationApiSubscriptionKey,
        personalizationApiUrl: serviceAccess.personalizationApiUrl,
        retrievedAt: options.retrievedAt,
        flyerOfferHints: options.flyerOfferHints
      })
  });
  if (rows.length >= maxRows) return rows.slice(0, maxRows);
  if (rows.length === 0 && failures.length > 0) {
    throw new Error(`Coop all-store weekly discount requests returned no usable branch offers: ${failures[0]!.storeId}:${failures[0]!.error}`);
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
    supportsOnlineProductPrices: coopStoreSupportsOnlineProductPrices(store),
    sourceUrl,
    retrievedAt
  };
}

function coopStoreSupportsOnlineProductPrices(store: CoopStoreResponse): boolean {
  if (!Array.isArray(store.services)) return false;
  return store.services.some((service) => {
    const normalized = text(service).toLowerCase();
    return normalized.includes('hämta') && normalized.includes('beställ');
  });
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
    flyerOfferHint?: CoopFlyerOfferHint;
  }
): CoopWeeklyDiscount | null {
  const code = text(product.id) || text(product.ean);
  const ean = text(product.ean) || code;
  const name = text(product.name);
  const ordinaryPrice = numberOrNull(product.salesPriceData?.b2cPrice);
  if (context.flyerOfferHint?.code && context.flyerOfferHint.code !== code && context.flyerOfferHint.code !== ean) {
    return null;
  }
  const promotion = product.onlinePromotions?.find((candidate) => numberOrNull(candidate.priceData?.b2cPrice) !== null);
  const offerPrice = numberOrNull(promotion?.priceData?.b2cPrice) ?? context.flyerOfferHint?.offerPrice ?? null;
  if (!code || !name || ordinaryPrice === null || offerPrice === null || ordinaryPrice <= offerPrice) {
    return null;
  }

  const offerUnitPrice = numberOrNull(promotion?.comparativePrice?.b2cPrice) ?? context.flyerOfferHint?.offerUnitPrice ?? null;
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
    offerUnitPriceText: context.flyerOfferHint?.offerUnitPriceText ?? priceWithUnit(offerUnitPrice, product.comparativePriceText),
    offerMechanicText: text(promotion?.message) || context.flyerOfferHint?.offerMechanicText || '',
    promotionId: text(promotion?.id) || `flyer:${context.storeId}:${code}:${context.validFrom.slice(0, 10)}`,
    medMeraRequired: promotion?.medMeraRequired === true || context.flyerOfferHint?.medMeraRequired === true,
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

function findFlyerOfferHint(
  hints: readonly CoopFlyerOfferHint[],
  storeId: string,
  query: string
): CoopFlyerOfferHint | undefined {
  return hints.find((hint) =>
    hint.query === query &&
    (!hint.storeIds || hint.storeIds.includes(storeId))
  );
}

function prioritizeHintedProduct(
  products: CoopSearchProduct[],
  hint: CoopFlyerOfferHint | undefined
): CoopSearchProduct[] {
  if (!hint?.code) return products;
  return [
    ...products.filter((product) => text(product.id) === hint.code || text(product.ean) === hint.code),
    ...products.filter((product) => text(product.id) !== hint.code && text(product.ean) !== hint.code)
  ];
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
