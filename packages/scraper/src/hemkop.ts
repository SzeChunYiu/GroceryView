import { retailerConfig } from './retailerMap.js';

export type HemkopCatalogProduct = Record<string, unknown>;

export type HemkopPriceSnapshot = {
  retailerId: string;
  storeBranch: string;
  productId: string;
  name: string;
  price: number;
  currency: string;
  unitPrice?: number;
  unit?: string;
  scrapedAt: string;
  raw: HemkopCatalogProduct;
};

export type HemkopSnapshotStore = {
  savePriceSnapshots(snapshots: HemkopPriceSnapshot[]): Promise<void>;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type HemkopScrapeOptions = {
  catalogUrl?: string;
  retailerId?: string;
  storeBranch?: string;
  scrapedAt?: string | Date;
  fetchImpl?: FetchLike;
  store?: HemkopSnapshotStore;
};

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (value && typeof value === 'object' && 'value' in value) return numberValue((value as { value?: unknown }).value);
  return undefined;
}

function productId(product: HemkopCatalogProduct): string | undefined {
  return text(product.id) ?? text(product.productId) ?? text(product.code) ?? text(product.articleNumber) ?? text(product.slug);
}

function productName(product: HemkopCatalogProduct): string | undefined {
  return text(product.name) ?? text(product.title) ?? text(product.displayName);
}

function productPrice(product: HemkopCatalogProduct): number | undefined {
  return numberValue(product.price) ?? numberValue(product.currentPrice) ?? numberValue(product.salesPrice) ?? numberValue(product.priceValue);
}

function productUnitPrice(product: HemkopCatalogProduct): number | undefined {
  return numberValue(product.unitPrice) ?? numberValue(product.comparisonPrice) ?? numberValue(product.comparePrice);
}

function looksLikeProduct(value: HemkopCatalogProduct): boolean {
  return Boolean(productId(value) && productName(value) && productPrice(value) !== undefined);
}

function collectProducts(value: unknown): HemkopCatalogProduct[] {
  if (Array.isArray(value)) return value.flatMap(collectProducts);
  if (!value || typeof value !== 'object') return [];
  const record = value as HemkopCatalogProduct;
  if (looksLikeProduct(record)) return [record];
  return ['products', 'items', 'results', 'data', 'productList'].flatMap((key) => collectProducts(record[key]));
}

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('scrapedAt must be a valid date.');
  return date.toISOString();
}

export function parseHemkopCatalogJson(payload: unknown, options: Omit<HemkopScrapeOptions, 'fetchImpl' | 'store' | 'catalogUrl'> = {}): HemkopPriceSnapshot[] {
  const hemkop = retailerConfig('hemkop');
  const retailerId = options.retailerId ?? hemkop.id;
  const storeBranch = options.storeBranch ?? hemkop.defaultStoreBranch;
  const scrapedAt = timestamp(options.scrapedAt);

  return collectProducts(payload).map((product) => ({
    retailerId,
    storeBranch,
    productId: productId(product)!,
    name: productName(product)!,
    price: productPrice(product)!,
    currency: text(product.currency) ?? 'SEK',
    ...(productUnitPrice(product) === undefined ? {} : { unitPrice: productUnitPrice(product) }),
    ...(text(product.unit) ? { unit: text(product.unit) } : {}),
    scrapedAt,
    raw: product
  }));
}

export async function scrapeHemkopPrices(options: HemkopScrapeOptions = {}): Promise<HemkopPriceSnapshot[]> {
  const hemkop = retailerConfig('hemkop');
  const fetcher = options.fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (!fetcher) throw new Error('fetch is required to scrape Hemköp catalog JSON.');

  const response = await fetcher(options.catalogUrl ?? hemkop.catalogUrl, {
    headers: { accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Hemköp catalog request failed with status ${response.status}.`);

  const snapshots = parseHemkopCatalogJson(await response.json(), options);
  if (options.store) await options.store.savePriceSnapshots(snapshots);
  return snapshots;
}
