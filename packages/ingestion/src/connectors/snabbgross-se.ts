import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export type SnabbgrossProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'snabbgross';
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  regularPriceText: string;
  validUntil: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type SnabbgrossStoreProduct = SnabbgrossProduct & {
  storeId: string;
  storeName: string;
  city: string;
};

export type SnabbgrossStore = {
  country: 'SE';
  currency: 'SEK';
  chain: 'snabbgross';
  storeId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  retrievedAt: string;
};

type SnabbgrossStoreMapPayload = {
  data?: SnabbgrossStoreMapRow[];
};

type SnabbgrossStoreMapRow = {
  displayName?: unknown;
  name?: unknown;
  line1?: unknown;
  town?: unknown;
  postalCode?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export const SNABBGROSS_BASE_URL = 'https://www.snabbgross.se';
export const SNABBGROSS_STORE_FINDER_URL = `${SNABBGROSS_BASE_URL}/butik-sok`;
export const SNABBGROSS_WEEKLY_OFFERS_URL = `${SNABBGROSS_BASE_URL}/erbjudanden`;
export const SNABBGROSS_CATEGORY_BASE_URL = `${SNABBGROSS_BASE_URL}/V%C3%A5rt-sortiment/c`;
export const DEFAULT_SNABBGROSS_CATEGORY_PATHS = ['N00'] as const;
export const DEFAULT_SNABBGROSS_STORE_ID = '6009';
export const DEFAULT_SNABBGROSS_MINIMUM_ROWS = 1;

export type FetchSnabbgrossProductsOptions = {
  fetchImpl?: typeof fetch;
  categoryPaths?: readonly string[];
  categoryUrl?: string;
  storeId?: string;
  maxRows?: number;
  minRows?: number;
  retrievedAt?: string;
};

export type FetchSnabbgrossProductsForAllStoresOptions = Omit<FetchSnabbgrossProductsOptions, 'storeId' | 'maxRows'> & AllStoreTaskRunnerControls & {
  storeFinderUrl?: string;
  maxStores?: number;
  maxRowsPerStore?: number;
};

export type FetchSnabbgrossStoresOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  storeFinderUrl?: string;
};

export function buildSnabbgrossCategoryUrl(categoryPath: string, storeId?: string): string {
  const safePath = categoryPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const url = new URL(`${SNABBGROSS_CATEGORY_BASE_URL}/${safePath}`);
  if (storeId) url.searchParams.set('store', storeId);
  return url.toString();
}

export async function fetchSnabbgrossStores(options: FetchSnabbgrossStoresOptions = {}): Promise<SnabbgrossStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.storeFinderUrl ?? SNABBGROSS_STORE_FINDER_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Snabbgross store finder request failed: ${response.status}`);
  const rows = parseSnabbgrossStoresHtml(await response.text(), sourceUrl, retrievedAt);
  if (rows.length === 0) throw new Error('Snabbgross store finder had no usable stores.');
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export async function fetchSnabbgrossProducts(options: FetchSnabbgrossProductsOptions = {}): Promise<SnabbgrossProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const minRows = options.minRows ?? DEFAULT_SNABBGROSS_MINIMUM_ROWS;
  const urls = options.categoryUrl
    ? [options.categoryUrl]
    : (options.categoryPaths ?? DEFAULT_SNABBGROSS_CATEGORY_PATHS).map((path) => buildSnabbgrossCategoryUrl(path, options.storeId));
  const rows: SnabbgrossProduct[] = [];
  const seenCodes = new Set<string>();

  for (const sourceUrl of urls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Snabbgross product page request failed: ${response.status}`);
    for (const row of parseSnabbgrossProductsHtml(await response.text(), sourceUrl, retrievedAt)) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  if (rows.length < minRows) {
    throw new Error(`Snabbgross product fetch returned only ${rows.length} rows; minimum required is ${minRows}.`);
  }
  return rows;
}

export async function fetchSnabbgrossWeeklyOffers(options: FetchSnabbgrossProductsOptions = {}): Promise<SnabbgrossProduct[]> {
  return fetchSnabbgrossProducts({
    ...options,
    categoryUrl: options.categoryUrl ?? SNABBGROSS_WEEKLY_OFFERS_URL
  });
}

export async function fetchSnabbgrossProductsForAllStores(
  options: FetchSnabbgrossProductsForAllStoresOptions = {}
): Promise<SnabbgrossStoreProduct[]> {
  const stores = await fetchSnabbgrossStores({
    fetchImpl: options.fetchImpl,
    maxRows: options.maxStores,
    retrievedAt: options.retrievedAt,
    storeFinderUrl: options.storeFinderUrl
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
      const products = await fetchSnabbgrossProducts({
        fetchImpl: options.fetchImpl,
        categoryPaths: options.categoryPaths,
        storeId: store.storeId,
        maxRows: options.maxRowsPerStore,
        minRows: 0,
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
  if (rows.length === 0 && failures.length > 0) {
    throw new Error(`Snabbgross all-store product requests returned no usable branch products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  }
  return rows;
}

export function parseSnabbgrossStoresHtml(html: string, sourceUrl: string, retrievedAt: string): SnabbgrossStore[] {
  const payload = extractHiddenInputValue(html, 'js-storefinder-stores');
  if (!payload) return [];
  const parsed = JSON.parse(decodeHtml(payload)) as SnabbgrossStoreMapPayload;
  const rows: SnabbgrossStore[] = [];
  const seenStoreIds = new Set<string>();
  for (const store of parsed.data ?? []) {
    const row = normalizeSnabbgrossStore(store, sourceUrl, retrievedAt);
    if (!row || seenStoreIds.has(row.storeId)) continue;
    seenStoreIds.add(row.storeId);
    rows.push(row);
  }
  return rows;
}

export function parseSnabbgrossProductsHtml(html: string, sourceUrl: string, retrievedAt: string): SnabbgrossProduct[] {
  const rows: SnabbgrossProduct[] = [];
  const productBlocks = html.match(/<div class="product_item_reference_logged_out[\s\S]*?(?=<div class="product_item_reference_logged_out|<\/main>|$)/g) ?? [];
  for (const block of productBlocks) {
    const row = normalizeSnabbgrossProductBlock(block, sourceUrl, retrievedAt);
    if (row) rows.push(row);
  }
  return rows;
}

function normalizeSnabbgrossStore(store: SnabbgrossStoreMapRow, sourceUrl: string, retrievedAt: string): SnabbgrossStore | null {
  const storeId = text(store.name);
  const name = text(store.displayName);
  const address = text(store.line1);
  const city = text(store.town);
  if (!storeId || !name || !address || !city) return null;
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'snabbgross',
    storeId,
    name,
    address,
    city,
    postalCode: text(store.postalCode),
    latitude: numberFromText(store.latitude),
    longitude: numberFromText(store.longitude),
    sourceUrl,
    retrievedAt
  };
}

function normalizeSnabbgrossProductBlock(block: string, sourceUrl: string, retrievedAt: string): SnabbgrossProduct | null {
  const href = firstMatch(block, /<a class="thumb" href="([^"]+)"/);
  const code = firstMatch(href, /\/produkt\/([^/?#]+)/);
  const name = htmlText(firstMatch(block, /<a class="name"[\s\S]*?<div class="text-left">\s*([\s\S]*?)\s*<\/div>/));
  const priceText = htmlText(firstMatch(block, /<span class="js-product-price[\s\S]*?>\s*([\s\S]*?)\s*<\/span>/));
  const price = priceFromText(priceText);
  if (!code || !name || price === null) return null;
  const brandAndPackage = htmlText(firstMatch(block, /<div class="name_ordinary">([\s\S]*?)<\/div>/));
  const imageUrl = decodeHtml(firstMatch(block, /<img src="([^"]+)"/));
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'snabbgross',
    code,
    name,
    brand: brandAndPackage.split(/\s+/)[0] ?? '',
    packageText: htmlText(firstMatch(block, /<span class="js-list-commercial-name3">([\s\S]*?)<\/span>/)),
    category: categoryFromHref(href),
    price,
    priceText,
    unitPriceText: htmlText(firstMatch(block, /Jmf\.pris\s*([\s\S]*?)<\/span>\s*<\/div>/)),
    regularPriceText: htmlText(firstMatch(block, /<span class="js-product-regularprice-value">\s*([\s\S]*?)\s*<\/span>/)),
    validUntil: htmlText(firstMatch(block, /Priset gäller t\.o\.m&nbsp;([0-9.]+)/)),
    imageUrl,
    sourceUrl,
    retrievedAt
  };
}

function categoryFromHref(href: string): string {
  const parts = href.split('/produkt/')[0]?.split('/').filter(Boolean) ?? [];
  return parts.slice(1).map((part) => decodeURIComponent(part)).join('|');
}

function extractHiddenInputValue(html: string, className: string): string {
  return firstMatch(html, new RegExp(`<input[^>]+class="${className}"[^>]+value='([\\s\\S]*?)'`, 'm'));
}

function firstMatch(value: string, pattern: RegExp): string {
  return pattern.exec(value)?.[1]?.trim() ?? '';
}

function htmlText(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();
}

function text(value: unknown): string {
  return typeof value === 'string' ? decodeHtml(value).trim() : '';
}

function numberFromText(value: unknown): number | null {
  const parsed = Number(text(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function priceFromText(value: string): number | null {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.').match(/[0-9.]+/)?.[0] ?? '');
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&ouml;/g, '\u00f6')
    .replace(/&auml;/g, '\u00e4')
    .replace(/&aring;/g, '\u00e5')
    .replace(/&Ouml;/g, '\u00d6')
    .replace(/&Auml;/g, '\u00c4')
    .replace(/&Aring;/g, '\u00c5')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
