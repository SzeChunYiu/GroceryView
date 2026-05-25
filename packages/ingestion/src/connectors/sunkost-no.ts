export type SunkostNoChain = 'sunkost-no';

export type SunkostNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: SunkostNoChain;
  retailerType: 'health_food';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  memberPrice: number | null;
  onSale: boolean;
  inStock: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type SunkostNoChainStatus = {
  chain: SunkostNoChain;
  country: 'NO';
  retailerType: 'health_food';
  status: 'official_algolia_catalog';
  qualifiesForNationalChain: true;
  minimumStoreCount: 3;
  evidence: Array<{
    kind: 'official_site' | 'official_store_locator';
    label: string;
    sourceUrl: string;
  }>;
};

export type FetchSunkostNoProductsOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  hitsPerPage?: number;
  pages?: number;
  maxRows?: number;
  retrievedAt?: string;
};

type AlgoliaHit = Record<string, unknown>;

export const SUNKOST_NO_BASE_URL = 'https://sunkost.no';
export const SUNKOST_NO_STORE_LOCATOR_URL = 'https://sunkost.no/butikker';
export const SUNKOST_NO_ALGOLIA_APP_ID = 'TPGC19BRDR';
export const SUNKOST_NO_ALGOLIA_SEARCH_KEY = 'NDM3MGQxNWQ3NDBhNmEzNGYxZGY2OGU4ODBjM2Y4MTM1MTg2OWVmMGU4M2NhNTBjZDU2ZTY3N2JhYWYyMGFmZHRhZ0ZpbHRlcnM9';
export const SUNKOST_NO_ALGOLIA_INDEX = 'sunkost_default_products';
export const SUNKOST_NO_ALGOLIA_QUERIES_URL = `https://${SUNKOST_NO_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`;
export const SUNKOST_NO_PARSER_VERSION = 'sunkost-no-algolia-v1';

export const SUNKOST_NO_CHAIN_STATUS: SunkostNoChainStatus = {
  chain: 'sunkost-no',
  country: 'NO',
  retailerType: 'health_food',
  status: 'official_algolia_catalog',
  qualifiesForNationalChain: true,
  minimumStoreCount: 3,
  evidence: [
    {
      kind: 'official_site',
      label: 'Sunkost publishes an official Norwegian product catalogue backed by the site Algolia index.',
      sourceUrl: SUNKOST_NO_BASE_URL
    },
    {
      kind: 'official_store_locator',
      label: 'The official Sunkost store locator documents national physical-store coverage exceeding the three-store ticket threshold.',
      sourceUrl: SUNKOST_NO_STORE_LOCATOR_URL
    }
  ]
};

export async function fetchSunkostNoProducts(options: FetchSunkostNoProductsOptions = {}): Promise<SunkostNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const hitsPerPage = options.hitsPerPage ?? Math.min(options.maxRows ?? 36, 100);
  const pages = options.pages ?? 1;
  const rows: SunkostNoProduct[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < pages; page += 1) {
    const response = await fetchImpl(SUNKOST_NO_ALGOLIA_QUERIES_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'user-agent': 'GroceryView/0.1 sunkost-no-connector (+https://github.com/SzeChunYiu/GroceryView)',
        'x-algolia-application-id': SUNKOST_NO_ALGOLIA_APP_ID,
        'x-algolia-api-key': SUNKOST_NO_ALGOLIA_SEARCH_KEY
      },
      body: JSON.stringify(buildSunkostNoAlgoliaRequest(options.query ?? '', hitsPerPage, page))
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Sunkost NO Algolia source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Sunkost NO Algolia source failed with HTTP ${response.status}.`);

    for (const product of parseSunkostNoProducts(await response.json(), SUNKOST_NO_ALGOLIA_QUERIES_URL, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function buildSunkostNoAlgoliaRequest(query = '', hitsPerPage = 36, page = 0): { requests: Array<{ indexName: string; params: string }> } {
  const params = new URLSearchParams({
    query,
    hitsPerPage: String(hitsPerPage),
    page: String(page)
  });
  return {
    requests: [{ indexName: SUNKOST_NO_ALGOLIA_INDEX, params: params.toString() }]
  };
}

export function parseSunkostNoProducts(payload: unknown, sourceUrl: string, retrievedAt: string): SunkostNoProduct[] {
  return collectSunkostNoHits(payload)
    .map((hit) => normalizeSunkostNoProduct(hit, sourceUrl, retrievedAt))
    .filter((product): product is SunkostNoProduct => product !== null);
}

export function normalizeSunkostNoProduct(hit: AlgoliaHit, sourceUrl: string, retrievedAt: string): SunkostNoProduct | null {
  const code = firstText(hit, ['sku', 'objectID', 'id']);
  const name = firstText(hit, ['name', 'title']);
  const price = priceNumber(priceValue(hit.price));
  if (!code || !name || price === null) return null;

  const memberPrice = priceNumber(hit.member_price);
  const productPath = firstText(hit, ['url', 'product_url']);
  const categories = stringArray(hit.categories_without_path);

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'sunkost-no',
    retailerType: 'health_food',
    code,
    name,
    brand: firstText(hit, ['manufacturer', 'brand']),
    category: categories[0] ?? firstCategory(hit.categories),
    price,
    priceText: priceText(priceValue(hit.price)) || `${price.toFixed(0)},-`,
    memberPrice,
    onSale: Boolean(priceOnSale(hit.price_on_sale)) || memberPrice !== null,
    inStock: hit.in_stock !== 0 && hit.in_stock !== false,
    productUrl: productPath ? absoluteUrl(productPath, SUNKOST_NO_BASE_URL) : '',
    imageUrl: absoluteUrl(firstText(hit, ['image_url', 'thumbnail_url', 'image']), SUNKOST_NO_BASE_URL),
    sourceUrl,
    retrievedAt
  };
}

export function verifySunkostNoChainStatus(): SunkostNoChainStatus {
  return SUNKOST_NO_CHAIN_STATUS;
}

function collectSunkostNoHits(payload: unknown): AlgoliaHit[] {
  if (isRecord(payload)) {
    if (Array.isArray(payload.hits)) return payload.hits.filter(isRecord);
    if (Array.isArray(payload.results)) {
      return payload.results.flatMap((result) => (isRecord(result) && Array.isArray(result.hits) ? result.hits.filter(isRecord) : []));
    }
  }
  return [];
}

function priceValue(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const nok = value.NOK;
  if (isRecord(nok)) return nok.default ?? nok.value ?? nok.amount ?? nok.default_formated;
  return value.default ?? value.value ?? value.amount ?? value.formatted;
}

function priceText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(0)},-`;
  if (isRecord(value)) {
    const nok = value.NOK;
    if (isRecord(nok)) return firstText(nok, ['default_formated', 'formatted', 'display']);
    return firstText(value, ['default_formated', 'formatted', 'display']);
  }
  return '';
}

function priceOnSale(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (isRecord(value)) return priceOnSale(priceValue(value));
  return false;
}

function firstCategory(value: unknown): string {
  if (!isRecord(value)) return '';
  for (const level of ['level2', 'level1', 'level0']) {
    const categories = stringArray(value[level]);
    if (categories.length > 0) return categories[0].split('///').map((part) => part.trim()).filter(Boolean).pop() ?? categories[0];
  }
  return '';
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

function firstText(record: unknown, keys: string[]): string {
  if (!isRecord(record)) return '';
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return '';
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function priceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round((value + Number.EPSILON) * 100) / 100;
  const normalized = text(value).replace(/\s/g, '').replace(/kr|nok|,-/gi, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  return new URL(value, baseUrl).toString();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
