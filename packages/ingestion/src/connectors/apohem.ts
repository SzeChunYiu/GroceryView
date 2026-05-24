export type PharmacyChain = 'apohem' | 'apotek-hjartat' | 'apotek-1';

export type PharmacyProductCategory = 'otc' | 'supplement' | 'beauty';

export type ApohemProduct = {
  chain: PharmacyChain;
  code: string;
  ean: string;
  name: string;
  brand: string;
  category: PharmacyProductCategory;
  price: number;
  priceText: string;
  originalPrice: number | null;
  originalPriceText: string;
  vatPercent: number | null;
  stockStatus: string;
  productUrl: string;
  imageUrl: string;
  isOtc: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

type ApohemSearchProduct = {
  url?: unknown;
  displayName?: unknown;
  brandName?: unknown;
  code?: unknown;
  variationCode?: unknown;
  variationEAN?: unknown;
  price?: {
    current?: { inclVat?: unknown; vatPercent?: unknown };
    previous?: { inclVat?: unknown };
  };
  images?: Array<{ url?: unknown }>;
  stock?: { status?: unknown; stockStatus?: unknown };
  isotc?: unknown;
  isPrescriptionProduct?: unknown;
};

type ApotekHjartatProduct = {
  url?: unknown;
  productName?: unknown;
  sku?: unknown;
  gtin?: unknown;
  price?: {
    current?: { inclVat?: unknown; vatPercent?: unknown };
  };
  pricePerUnit?: unknown;
  storePrice?: unknown;
  images?: Array<{ url?: unknown }>;
  swatchImage?: { url?: unknown };
  variant?: { stockStatus?: unknown };
  brands?: Array<{ title?: unknown; name?: unknown }>;
  isBuyableWithoutPrescription?: unknown;
  belongsToPrescriptionProductGroup?: unknown;
  isOtcMedicine?: unknown;
  isDietarySupplement?: unknown;
  trackingProductInformation?: {
    brand?: unknown;
    category?: unknown;
    ean?: unknown;
    stockStatus?: unknown;
  };
};

type Apotek1Attribute = {
  identifier?: unknown;
  name?: unknown;
  values?: Array<{ value?: unknown }>;
};

type Apotek1Price = {
  usage?: unknown;
  value?: unknown;
  currency?: unknown;
};

type Apotek1Product = {
  partNumber?: unknown;
  singleSKUCatalogEntryID?: unknown;
  name?: unknown;
  manufacturer?: unknown;
  seotoken?: unknown;
  thumbnail?: unknown;
  fullImage?: unknown;
  buyable?: unknown;
  price?: Apotek1Price[];
  attributes?: Apotek1Attribute[];
};

type Apotek1SearchResponse = {
  catalogEntryView?: Apotek1Product[];
};

export type FetchApohemProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  apotekHjartatUrls?: readonly string[];
  apotek1Urls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const APOHEM_BASE_URL = 'https://www.apohem.se';
export const APOTEK_HJARTAT_BASE_URL = 'https://www.apotekhjartat.se';
export const APOTEK_1_BASE_URL = 'https://www.apotek1.no';

export const DEFAULT_APOHEM_SOURCE_PATHS = [
  '/sok?q=vitamin',
  '/sok?q=la%20roche',
  '/sok?q=solskydd',
  '/sok?q=tandkram',
  '/sok?q=munvard',
  '/vitaminer-kosttillskott',
  '/hudvard',
  '/receptfritt'
] as const;

export const DEFAULT_APOTEK_HJARTAT_SEARCH_URLS = [
  'https://www.apotekhjartat.se/search?q=vitamin',
  'https://www.apotekhjartat.se/search?q=la%20roche',
  'https://www.apotekhjartat.se/search?q=solskydd',
  'https://www.apotekhjartat.se/search?q=tandkram',
  'https://www.apotekhjartat.se/search?q=munvard',
  'https://www.apotekhjartat.se/search?q=pamol'
] as const;

export const DEFAULT_APOTEK_1_SEARCH_QUERIES = [
  'vitamin',
  'solkrem',
  'tannkrem',
  'hudpleie',
  'paracetamol',
  'kosttilskudd'
] as const;

export function buildApotek1SearchUrl(query: string, pageNumber = 1, pageSize = 24): string {
  const url = new URL('/search/resources/store/10151/productview/bySearchTerm/' + encodeURIComponent(query), APOTEK_1_BASE_URL);
  url.searchParams.set('catalogId', '10051');
  url.searchParams.set('langId', '-101');
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('pageNumber', String(pageNumber));
  return url.toString();
}

export async function fetchApohemProducts(options: FetchApohemProductsOptions = {}): Promise<ApohemProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: ApohemProduct[] = [];
  const seen = new Set<string>();

  for (const sourcePath of options.sourcePaths ?? DEFAULT_APOHEM_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(sourcePath, APOHEM_BASE_URL);
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Apohem request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseApohemProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) {
      return rows;
    }
  }

  return rows;
}

export async function fetchApotekHjartatProducts(options: FetchApohemProductsOptions = {}): Promise<ApohemProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: ApohemProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.apotekHjartatUrls ?? DEFAULT_APOTEK_HJARTAT_SEARCH_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Apotek Hjärtat request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseApotekHjartatProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) {
      return rows;
    }
  }

  return rows;
}

export async function fetchApotek1Products(options: FetchApohemProductsOptions = {}): Promise<ApohemProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: ApohemProduct[] = [];
  const seen = new Set<string>();

  const sourceUrls = options.apotek1Urls ?? DEFAULT_APOTEK_1_SEARCH_QUERIES.map((query) => buildApotek1SearchUrl(query));
  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, jsonHeaders());
    if (!response.ok) {
      throw new Error(`Apotek 1 search request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseApotek1Products(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) {
      return rows;
    }
  }

  return rows;
}

export async function fetchPharmacyProducts(options: FetchApohemProductsOptions = {}): Promise<ApohemProduct[]> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const [apohemRows, hjartatRows, apotek1Rows] = await Promise.all([
    fetchApohemProducts({ ...options, retrievedAt }),
    fetchApotekHjartatProducts({ ...options, retrievedAt }),
    fetchApotek1Products({ ...options, retrievedAt })
  ]);
  const rows: ApohemProduct[] = [];
  const seen = new Set<string>();
  addRows(rows, seen, apohemRows, options.maxRows);
  addRows(rows, seen, hjartatRows, options.maxRows);
  addRows(rows, seen, apotek1Rows, options.maxRows);
  return rows;
}

export function parseApohemProducts(html: string, sourceUrl: string, retrievedAt: string): ApohemProduct[] {
  const data = extractWindowJsonObject(html, 'CURRENT_PAGE');
  const products: ApohemSearchProduct[] = [];
  visit(data, (value) => {
    const candidate = value as ApohemSearchProduct;
    if (candidate.price && candidate.displayName && candidate.variationEAN) {
      products.push(candidate);
    }
  });

  return products
    .map((product) => normalizeApohemProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is ApohemProduct => product !== null);
}

export function parseApotekHjartatProducts(html: string, sourceUrl: string, retrievedAt: string): ApohemProduct[] {
  const data = extractInitialData(html);
  const products: ApotekHjartatProduct[] = [];
  visit(data, (value) => {
    const candidate = value as ApotekHjartatProduct;
    if (candidate.productName && candidate.gtin && candidate.price) {
      products.push(candidate);
    }
  });

  return products
    .map((product) => normalizeApotekHjartatProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is ApohemProduct => product !== null);
}

export function parseApotek1Products(json: string, sourceUrl: string, retrievedAt: string): ApohemProduct[] {
  const data = JSON.parse(json) as Apotek1SearchResponse;
  return (data.catalogEntryView ?? [])
    .map((product) => normalizeApotek1Product(product, sourceUrl, retrievedAt))
    .filter((product): product is ApohemProduct => product !== null);
}

export function normalizeApohemProduct(
  product: ApohemSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): ApohemProduct | null {
  if (product.isPrescriptionProduct === true) {
    return null;
  }
  const ean = eanText(product.variationEAN);
  const price = numberFromText(product.price?.current?.inclVat);
  const name = text(product.displayName);
  if (!ean || !name || price === null) {
    return null;
  }

  const originalPrice = numberFromText(product.price?.previous?.inclVat);
  return {
    chain: 'apohem',
    code: text(product.variationCode) || text(product.code) || ean,
    ean,
    name,
    brand: text(product.brandName),
    category: apohemCategory(product, sourceUrl),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} SEK`,
    vatPercent: numberFromText(product.price?.current?.vatPercent),
    stockStatus: text(product.stock?.status) || text(product.stock?.stockStatus),
    productUrl: absoluteUrl(product.url, APOHEM_BASE_URL),
    imageUrl: absoluteUrl(product.images?.[0]?.url, APOHEM_BASE_URL),
    isOtc: product.isotc === true,
    sourceUrl,
    retrievedAt
  };
}

export function normalizeApotekHjartatProduct(
  product: ApotekHjartatProduct,
  sourceUrl: string,
  retrievedAt: string
): ApohemProduct | null {
  if (product.belongsToPrescriptionProductGroup === true || product.isBuyableWithoutPrescription === false) {
    return null;
  }
  const ean = eanText(product.gtin ?? product.trackingProductInformation?.ean);
  const price = numberFromText(product.price?.current?.inclVat);
  const name = text(product.productName);
  if (!ean || !name || price === null) {
    return null;
  }
  const originalPrice = numberFromText(product.storePrice);

  return {
    chain: 'apotek-hjartat',
    code: text(product.sku) || ean,
    ean,
    name,
    brand: text(product.brands?.[0]?.title) || text(product.brands?.[0]?.name) || text(product.trackingProductInformation?.brand),
    category: apotekHjartatCategory(product, sourceUrl),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} SEK`,
    vatPercent: numberFromText(product.price?.current?.vatPercent),
    stockStatus: text(product.variant?.stockStatus) || text(product.trackingProductInformation?.stockStatus),
    productUrl: absoluteUrl(product.url, APOTEK_HJARTAT_BASE_URL),
    imageUrl: absoluteUrl(product.images?.[0]?.url ?? product.swatchImage?.url, APOTEK_HJARTAT_BASE_URL),
    isOtc: product.isOtcMedicine === true,
    sourceUrl,
    retrievedAt
  };
}

export function normalizeApotek1Product(
  product: Apotek1Product,
  sourceUrl: string,
  retrievedAt: string
): ApohemProduct | null {
  if (attributeValue(product, 'ReceiptCode') === 'J' || attributeValue(product, 'receipt') === 'receipt') {
    return null;
  }
  const ean = eanText(attributeValue(product, 'GTIN'));
  const price = apotek1Price(product.price, 'Offer') ?? apotek1Price(product.price, 'Display');
  const name = text(product.name);
  if (!ean || !name || price === null) {
    return null;
  }
  const originalPrice = apotek1Price(product.price, 'Display');

  return {
    chain: 'apotek-1',
    code: text(product.singleSKUCatalogEntryID) || text(product.partNumber) || ean,
    ean,
    name,
    brand: attributeValue(product, 'Merke') || text(product.manufacturer),
    category: apotek1Category(product),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} NOK`,
    vatPercent: null,
    stockStatus: text(product.buyable) === 'true' ? 'buyable' : text(product.buyable),
    productUrl: absoluteUrl(product.seotoken ? `/produkter/${text(product.seotoken)}` : '', APOTEK_1_BASE_URL),
    imageUrl: absoluteUrl(product.thumbnail || product.fullImage, APOTEK_1_BASE_URL),
    isOtc: attributeValue(product, 'ATC-kode') !== '',
    sourceUrl,
    retrievedAt
  };
}

export function findPharmacyEanMatches(products: readonly ApohemProduct[]): ApohemProduct[] {
  const chainsByEan = new Map<string, Set<PharmacyChain>>();
  for (const product of products) {
    if (!chainsByEan.has(product.ean)) {
      chainsByEan.set(product.ean, new Set());
    }
    chainsByEan.get(product.ean)!.add(product.chain);
  }
  return products.filter((product) => (chainsByEan.get(product.ean)?.size ?? 0) > 1);
}

function addRows(
  rows: ApohemProduct[],
  seen: Set<string>,
  products: readonly ApohemProduct[],
  maxRows: number | undefined
): void {
  for (const product of products) {
    const key = `${product.chain}:${product.ean}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) {
      return;
    }
  }
}

function apotek1Category(product: Apotek1Product): PharmacyProductCategory {
  if (attributeValue(product, 'ATC-kode')) {
    return 'otc';
  }
  const categoryText = [
    attributeValue(product, 'Produkttype'),
    attributeValue(product, 'Primærfunksjon'),
    attributeValue(product, 'Innhold'),
    text(product.name)
  ].join(' ').toLowerCase();
  if (categoryText.includes('hud') || categoryText.includes('sol') || categoryText.includes('ansikt')) {
    return 'beauty';
  }
  return 'supplement';
}

function apotek1Price(prices: Apotek1Price[] | undefined, usage: string): number | null {
  const price = prices?.find((candidate) => text(candidate.usage).toLowerCase() === usage.toLowerCase());
  return numberFromText(price?.value);
}

function attributeValue(product: Apotek1Product, identifier: string): string {
  const normalized = identifier.toLowerCase();
  const attribute = product.attributes?.find((candidate) => {
    return text(candidate.identifier).toLowerCase().startsWith(normalized) || text(candidate.name).toLowerCase() === normalized;
  });
  return text(attribute?.values?.[0]?.value);
}

function apohemCategory(product: ApohemSearchProduct, sourceUrl: string): PharmacyProductCategory {
  if (product.isotc === true || sourceUrl.includes('/receptfritt')) {
    return 'otc';
  }
  if (sourceUrl.includes('/hudvard') || sourceUrl.includes('la%20roche')) {
    return 'beauty';
  }
  return 'supplement';
}

function apotekHjartatCategory(product: ApotekHjartatProduct, sourceUrl: string): PharmacyProductCategory {
  if (product.isOtcMedicine === true) {
    return 'otc';
  }
  if (product.isDietarySupplement === true) {
    return 'supplement';
  }
  const category = text(product.trackingProductInformation?.category).toLowerCase();
  if (category.includes('hud') || category.includes('sol') || category.includes('ansikte') || sourceUrl.includes('la%20roche')) {
    return 'beauty';
  }
  return 'supplement';
}

function extractWindowJsonObject(html: string, name: string): unknown {
  const marker = `window.${name} = `;
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error(`Apohem page did not include window.${name}`);
  }
  const objectStart = html.indexOf('{', start + marker.length);
  if (objectStart === -1) {
    throw new Error(`window.${name} did not include an object literal`);
  }
  const objectEnd = findBalancedEnd(html, objectStart);
  return JSON.parse(html.slice(objectStart, objectEnd + 1)) as unknown;
}

function extractInitialData(html: string): unknown {
  const marker = "window.INITIAL_DATA = JSON.parse('";
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error('Apotek Hjärtat page did not include window.INITIAL_DATA');
  }
  const jsonStart = start + marker.length;
  let escaped = false;
  for (let index = jsonStart; index < html.length; index += 1) {
    const char = html[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === "'" && html.slice(index, index + 3) === "');") {
      return JSON.parse(decodeSingleQuotedJsString(html.slice(jsonStart, index))) as unknown;
    }
  }
  throw new Error('Apotek Hjärtat INITIAL_DATA string was not terminated');
}

function decodeSingleQuotedJsString(value: string): string {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      decoded += char;
      continue;
    }
    index += 1;
    const escaped = value[index];
    if (escaped === undefined) {
      decoded += '\\';
    } else if (escaped === 'n') {
      decoded += '\n';
    } else if (escaped === 'r') {
      decoded += '\r';
    } else if (escaped === 't') {
      decoded += '\t';
    } else if (escaped === 'b') {
      decoded += '\b';
    } else if (escaped === 'f') {
      decoded += '\f';
    } else if (escaped === 'u') {
      const hex = value.slice(index + 1, index + 5);
      decoded += /^[\da-f]{4}$/i.test(hex) ? String.fromCharCode(Number.parseInt(hex, 16)) : `\\u${hex}`;
      index += 4;
    } else if (escaped === 'x') {
      const hex = value.slice(index + 1, index + 3);
      decoded += /^[\da-f]{2}$/i.test(hex) ? String.fromCharCode(Number.parseInt(hex, 16)) : `\\x${hex}`;
      index += 2;
    } else {
      decoded += escaped;
    }
  }
  return decoded;
}

function findBalancedEnd(value: string, start: number): number {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  throw new Error('Could not find balanced object end');
}

function visit(value: unknown, onObject: (value: Record<string, unknown>) => void): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      visit(item, onObject);
    }
    return;
  }
  onObject(value as Record<string, unknown>);
  for (const item of Object.values(value)) {
    visit(item, onObject);
  }
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function jsonHeaders(): RequestInit {
  return {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const url = text(value);
  if (!url) {
    return '';
  }
  return url.startsWith('https://') ? url : new URL(url, baseUrl).toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function eanText(value: unknown): string {
  const ean = text(value).replace(/\D/g, '');
  return ean.length >= 8 && ean.length <= 14 ? ean : '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = text(value).replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
