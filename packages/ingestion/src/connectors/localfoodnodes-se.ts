import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';

export type LocalFoodNodesNode = {
  nodeId: string;
  name: string;
  city: string;
  country: 'SE';
  currency: 'SEK';
  url: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type LocalFoodNodesProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'localfoodnodes';
  code: string;
  name: string;
  brand: string;
  category: string;
  packageText: string;
  price: number;
  priceText: string;
  unitPrice: number | null;
  unitPriceUnit: string;
  storeId: string;
  storeName: string;
  nodeId: string;
  nodeName: string;
  producer: string;
  available: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type LocalFoodNodesApiNode = Record<string, unknown>;
type LocalFoodNodesApiProduct = Record<string, unknown>;

export const LOCAL_FOOD_NODES_BASE_URL = 'https://localfoodnodes.com';
export const LOCAL_FOOD_NODES_NODES_PATH = '/api/nodes';
export const DEFAULT_LOCAL_FOOD_NODES_COUNTRY = 'SE';
export const DEFAULT_LOCAL_FOOD_NODES_CURRENCY = 'SEK';

export type FetchLocalFoodNodesNodesOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
  country?: string;
};

export type FetchLocalFoodNodesProductsOptions = {
  fetchImpl?: typeof fetch;
  node: LocalFoodNodesNode;
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export type FetchLocalFoodNodesProductsForAllNodesOptions = Omit<FetchLocalFoodNodesProductsOptions, 'node'> & AllStoreTaskRunnerControls & {
  maxNodes?: number;
  maxRowsPerNode?: number;
  country?: string;
};

export function buildLocalFoodNodesNodesUrl(input: {
  baseUrl?: string;
  country?: string;
} = {}): string {
  const url = new URL(LOCAL_FOOD_NODES_NODES_PATH, input.baseUrl ?? LOCAL_FOOD_NODES_BASE_URL);
  const country = input.country ?? DEFAULT_LOCAL_FOOD_NODES_COUNTRY;
  url.searchParams.set('country', country);
  url.searchParams.set('region', country);
  return url.toString();
}

export function buildLocalFoodNodesProductsUrl(input: {
  nodeId: string;
  baseUrl?: string;
}): string {
  return new URL(`/api/nodes/${encodeURIComponent(input.nodeId)}/products`, input.baseUrl ?? LOCAL_FOOD_NODES_BASE_URL).toString();
}

export async function fetchLocalFoodNodesNodes(options: FetchLocalFoodNodesNodesOptions = {}): Promise<LocalFoodNodesNode[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = buildLocalFoodNodesNodesUrl({ baseUrl: options.baseUrl, country: options.country });
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`LocalFoodNodes node request failed: ${response.status}`);
  const payload = await response.json() as unknown;
  const rows: LocalFoodNodesNode[] = [];
  const seen = new Set<string>();
  for (const candidate of unwrapRows(payload, ['nodes', 'data', 'items', 'results'])) {
    const node = normalizeLocalFoodNodesNode(candidate, sourceUrl, retrievedAt, options.baseUrl);
    if (!node || seen.has(node.nodeId)) continue;
    seen.add(node.nodeId);
    rows.push(node);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('LocalFoodNodes SE node catalog had no usable nodes.');
  return rows;
}

export async function fetchLocalFoodNodesProducts(options: FetchLocalFoodNodesProductsOptions): Promise<LocalFoodNodesProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrl = buildLocalFoodNodesProductsUrl({ nodeId: options.node.nodeId, baseUrl: options.baseUrl });
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`LocalFoodNodes product request failed for node ${options.node.nodeId}: ${response.status}`);
  const payload = await response.json() as unknown;
  const rows: LocalFoodNodesProduct[] = [];
  const seen = new Set<string>();
  for (const candidate of unwrapRows(payload, ['products', 'data', 'items', 'results'])) {
    const product = normalizeLocalFoodNodesProduct(candidate, options.node, sourceUrl, retrievedAt, options.baseUrl);
    if (!product) continue;
    const key = `${product.nodeId}:${product.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  return rows;
}

export async function fetchLocalFoodNodesProductsForAllNodes(
  options: FetchLocalFoodNodesProductsForAllNodesOptions = {}
): Promise<LocalFoodNodesProduct[]> {
  const nodes = await fetchLocalFoodNodesNodes({
    fetchImpl: options.fetchImpl,
    maxRows: options.maxNodes,
    retrievedAt: options.retrievedAt,
    baseUrl: options.baseUrl,
    country: options.country
  });
  const { rows: fetchedRows, failures } = await runAllStoreTasks({
    stores: nodes,
    storeId: (node) => node.nodeId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: (node) => fetchLocalFoodNodesProducts({
      fetchImpl: options.fetchImpl,
      node,
      maxRows: options.maxRowsPerNode ?? options.maxRows,
      retrievedAt: options.retrievedAt,
      baseUrl: options.baseUrl
    })
  });
  if (fetchedRows.length === 0 && failures.length > 0) {
    throw new Error(`LocalFoodNodes all-node product requests returned no usable products: ${failures[0]!.storeId}:${failures[0]!.error}`);
  }
  return fetchedRows;
}

export function normalizeLocalFoodNodesNode(
  candidate: unknown,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = LOCAL_FOOD_NODES_BASE_URL
): LocalFoodNodesNode | null {
  if (!isRecord(candidate)) return null;
  const country = countryCode(candidate);
  if (country && country !== DEFAULT_LOCAL_FOOD_NODES_COUNTRY) return null;
  const nodeId = firstText(candidate, ['id', 'uuid', 'nodeId', 'node_id', 'slug']);
  const name = firstText(candidate, ['name', 'title', 'displayName', 'display_name']);
  if (!nodeId || !name) return null;
  const city = firstText(candidate, ['city', 'locality', 'municipality']) || firstText(recordAt(candidate, ['address', 'location']), ['city', 'locality', 'municipality']);
  return {
    nodeId,
    name,
    city,
    country: DEFAULT_LOCAL_FOOD_NODES_COUNTRY,
    currency: DEFAULT_LOCAL_FOOD_NODES_CURRENCY,
    url: absoluteUrl(firstText(candidate, ['url', 'publicUrl', 'public_url', 'href']) || `/nodes/${nodeId}`, baseUrl),
    sourceUrl,
    retrievedAt
  };
}

export function normalizeLocalFoodNodesProduct(
  candidate: unknown,
  node: LocalFoodNodesNode,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = LOCAL_FOOD_NODES_BASE_URL
): LocalFoodNodesProduct | null {
  if (!isRecord(candidate)) return null;
  const code = firstText(candidate, ['id', 'uuid', 'productId', 'product_id', 'sku', 'slug']);
  const name = firstText(candidate, ['name', 'title', 'displayName', 'display_name']);
  const price = priceNumber(firstDefined(candidate, ['price', 'currentPrice', 'current_price', 'grossPrice', 'gross_price']));
  if (!code || !name || price === null) return null;
  const producerRecord = recordAt(candidate, ['producer', 'supplier', 'farm', 'seller', 'vendor']);
  const brand = firstText(candidate, ['brand']) || firstText(producerRecord, ['name', 'title']) || '';
  const packageText = firstText(candidate, ['packageText', 'package_text', 'unit', 'unitLabel', 'unit_label', 'quantity', 'size']);
  const unitPrice = priceNumber(firstDefined(candidate, ['unitPrice', 'unit_price', 'comparePrice', 'compare_price']));
  const currency = firstText(candidate, ['currency', 'currencyCode', 'currency_code']) || node.currency;
  return {
    country: DEFAULT_LOCAL_FOOD_NODES_COUNTRY,
    currency: currency === DEFAULT_LOCAL_FOOD_NODES_CURRENCY ? DEFAULT_LOCAL_FOOD_NODES_CURRENCY : DEFAULT_LOCAL_FOOD_NODES_CURRENCY,
    chain: 'localfoodnodes',
    code,
    name,
    brand,
    category: firstText(candidate, ['category', 'categoryName', 'category_name']) || firstText(recordAt(candidate, ['category']), ['name', 'title']),
    packageText,
    price,
    priceText: firstText(candidate, ['priceText', 'price_text']) || `${formatPrice(price)} ${DEFAULT_LOCAL_FOOD_NODES_CURRENCY}`,
    unitPrice,
    unitPriceUnit: firstText(candidate, ['unitPriceUnit', 'unit_price_unit', 'unit']) || '',
    storeId: node.nodeId,
    storeName: node.name,
    nodeId: node.nodeId,
    nodeName: node.name,
    producer: brand,
    available: booleanOrDefault(firstDefined(candidate, ['available', 'inStock', 'in_stock', 'active']), true),
    productUrl: absoluteUrl(firstText(candidate, ['url', 'publicUrl', 'public_url', 'href']) || `/nodes/${node.nodeId}/products/${code}`, baseUrl),
    imageUrl: imageUrl(candidate, baseUrl),
    sourceUrl,
    retrievedAt
  };
}

function unwrapRows(payload: unknown, keys: readonly string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstDefined(record: Record<string, unknown> | null, keys: readonly string[]): unknown {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function text(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function firstText(record: Record<string, unknown> | null, keys: readonly string[]): string {
  return text(firstDefined(record, keys));
}

function recordAt(record: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> | null {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function countryCode(record: Record<string, unknown>): string {
  const direct = firstText(record, ['country', 'countryCode', 'country_code', 'region']).toUpperCase();
  if (direct === 'SWEDEN' || direct === 'SVERIGE') return 'SE';
  if (direct.length === 2) return direct;
  const nested = recordAt(record, ['address', 'location']);
  if (!nested) return '';
  return countryCode(nested);
}

function priceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1000 ? value / 100 : value;
  const raw = text(value).replace(/\s+/g, '').replace(',', '.');
  if (!raw) return null;
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const raw = text(value).toLowerCase();
  if (!raw) return fallback;
  if (['true', 'yes', '1', 'available', 'in_stock', 'active'].includes(raw)) return true;
  if (['false', 'no', '0', 'sold_out', 'unavailable', 'inactive'].includes(raw)) return false;
  return fallback;
}

function imageUrl(record: Record<string, unknown>, baseUrl: string): string {
  const direct = firstText(record, ['imageUrl', 'image_url', 'image', 'photo', 'thumbnail']);
  if (direct) return absoluteUrl(direct, baseUrl);
  const images = record.images;
  if (Array.isArray(images)) {
    for (const image of images) {
      if (typeof image === 'string') return absoluteUrl(image, baseUrl);
      if (isRecord(image)) {
        const nested = firstText(image, ['url', 'src', 'href']);
        if (nested) return absoluteUrl(nested, baseUrl);
      }
    }
  }
  return '';
}

function absoluteUrl(pathOrUrl: string, baseUrl: string): string {
  if (!pathOrUrl) return '';
  try {
    return new URL(pathOrUrl, baseUrl).toString();
  } catch {
    return pathOrUrl;
  }
}
