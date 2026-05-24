export const NORMAL_SE_BASE_URL = 'https://www.normal.se';
export const NORMAL_SE_RETAILER_ID = 'normal-se';

export type NormalSeProductRow = {
  retailerId: typeof NORMAL_SE_RETAILER_ID;
  countryCode: 'SE';
  retailer_type: 'cosmetics';
  productId: string;
  name: string;
  brand: string | null;
  category: string;
  price: number;
  currency: 'SEK';
  productUrl: string;
  imageUrl: string | null;
  retrievedAt: string;
  raw: Record<string, unknown>;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown>; text(): Promise<string>; headers?: { get(name: string): string | null } }>;

export type FetchNormalSeProductsOptions = {
  sourceUrl?: string;
  retrievedAt?: string | Date;
  fetchImpl?: FetchLike;
  maxRows?: number;
};

export const NORMAL_SE_FIXTURE = {
  products: [
    {
      id: 'normal-shampoo-250ml',
      name: 'Everyday Shampoo 250 ml',
      brand: 'Normal',
      category: 'shampoo',
      price: '24,90',
      url: '/se/harvard/schampo/everyday-shampoo',
      imageUrl: 'https://www.normal.se/example.jpg'
    }
  ]
} as const;

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

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('retrievedAt must be a valid date.');
  return date.toISOString();
}

function absoluteUrl(value: string): string {
  return new URL(value, NORMAL_SE_BASE_URL).toString();
}

function collectProducts(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.flatMap(collectProducts);
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if ((record.id || record.sku || record.slug) && (record.name || record.title) && (record.price || record.currentPrice)) return [record];
  return ['products', 'items', 'results', 'data'].flatMap((key) => collectProducts(record[key]));
}

function normalizeNormalSeProduct(product: Record<string, unknown>, retrievedAt: string): NormalSeProductRow | null {
  const productId = text(product.id) ?? text(product.sku) ?? text(product.slug);
  const name = text(product.name) ?? text(product.title);
  const price = numberValue(product.price) ?? numberValue(product.currentPrice);
  if (!productId || !name || price === undefined) return null;
  return {
    retailerId: NORMAL_SE_RETAILER_ID,
    countryCode: 'SE',
    retailer_type: 'cosmetics',
    productId,
    name,
    brand: text(product.brand) ?? null,
    category: text(product.category) ?? 'cosmetics_personal_care',
    price,
    currency: 'SEK',
    productUrl: absoluteUrl(text(product.url) ?? text(product.productUrl) ?? `/se/search?q=${encodeURIComponent(name)}`),
    imageUrl: text(product.imageUrl) ?? text(product.image) ?? null,
    retrievedAt,
    raw: product
  };
}

export function parseNormalSeProducts(payload: unknown, options: { retrievedAt?: string | Date; maxRows?: number } = {}): NormalSeProductRow[] {
  const retrievedAt = timestamp(options.retrievedAt);
  const maxRows = options.maxRows ?? 500;
  return collectProducts(payload).flatMap((product) => {
    const row = normalizeNormalSeProduct(product, retrievedAt);
    return row ? [row] : [];
  }).slice(0, maxRows);
}

export async function fetchNormalSeProducts(options: FetchNormalSeProductsOptions = {}): Promise<NormalSeProductRow[]> {
  const fetcher = options.fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (!fetcher) throw new Error('fetch is required for Normal SE ingestion.');
  const sourceUrl = options.sourceUrl ?? `${NORMAL_SE_BASE_URL}/se/`;
  const response = await fetcher(sourceUrl, { headers: { accept: 'application/json, text/html;q=0.9' } });
  if (!response.ok) throw new Error(`Normal SE product request failed with status ${response.status}.`);
  const contentType = response.headers?.get('content-type') ?? '';
  const payload = contentType.includes('json') ? await response.json() : await response.text();
  return parseNormalSeProducts(payload, { retrievedAt: options.retrievedAt, maxRows: options.maxRows });
}
