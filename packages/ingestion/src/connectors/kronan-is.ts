export type KronanIsProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: 'ISK';
  country: 'IS';
  unitPrice: number | null;
  unitPriceUnit: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

type KronanApiProduct = {
  id?: unknown;
  sku?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  price?: unknown;
  currentPrice?: unknown;
  unitPrice?: unknown;
  unitPriceUnit?: unknown;
  image?: unknown;
  imageUrl?: unknown;
};

export const KRONAN_IS_PRODUCTS_URL = 'https://www.kronan.is/api/products';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function productArray(payload: unknown): KronanApiProduct[] {
  if (Array.isArray(payload)) return payload as KronanApiProduct[];
  if (payload && typeof payload === 'object') {
    const record = payload as { products?: unknown; data?: unknown; items?: unknown };
    if (Array.isArray(record.products)) return record.products as KronanApiProduct[];
    if (Array.isArray(record.data)) return record.data as KronanApiProduct[];
    if (Array.isArray(record.items)) return record.items as KronanApiProduct[];
  }
  return [];
}

export function parseKronanIsProducts(payload: unknown, sourceUrl = KRONAN_IS_PRODUCTS_URL, retrievedAt = new Date().toISOString()): KronanIsProduct[] {
  return productArray(payload).flatMap((product) => {
    const id = text(product.id) || text(product.sku);
    const name = text(product.name) || text(product.title);
    const price = numberOrNull(product.price) ?? numberOrNull(product.currentPrice);
    if (!id || !name || price === null || price < 0) return [];
    return [{
      id,
      name,
      brand: text(product.brand),
      category: text(product.category),
      price,
      currency: 'ISK' as const,
      country: 'IS' as const,
      unitPrice: numberOrNull(product.unitPrice),
      unitPriceUnit: text(product.unitPriceUnit),
      imageUrl: text(product.imageUrl) || text(product.image),
      sourceUrl,
      retrievedAt
    }];
  });
}

export async function fetchKronanIsProducts(options: { fetchImpl?: FetchLike; sourceUrl?: string; retrievedAt?: string } = {}) {
  const sourceUrl = options.sourceUrl ?? KRONAN_IS_PRODUCTS_URL;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike | undefined);
  if (!fetchImpl) throw new Error('fetchKronanIsProducts requires a fetch implementation');
  const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Kronan IS product request failed: ${response.status}`);
  return parseKronanIsProducts(await response.json(), sourceUrl, options.retrievedAt ?? new Date().toISOString());
}
