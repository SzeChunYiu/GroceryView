export type TigerIsProduct = {
  country: 'IS';
  currency: 'ISK';
  chain: 'tiger';
  id: string;
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  price: number;
  compareAtPrice?: number;
  available: boolean;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type ShopifyVariant = {
  id?: unknown;
  price?: unknown;
  compare_at_price?: unknown;
  available?: unknown;
};

type ShopifyProduct = {
  id?: unknown;
  handle?: unknown;
  title?: unknown;
  vendor?: unknown;
  product_type?: unknown;
  variants?: ShopifyVariant[];
  images?: Array<{ src?: unknown }>;
};

type ShopifyProductsResponse = {
  products?: ShopifyProduct[];
};

export type FetchTigerIsProductsOptions = {
  fetchImpl?: typeof fetch;
  productsUrl?: string;
  maxRows?: number;
  pageSize?: number;
  retrievedAt?: string;
};

export const TIGER_IS_PRODUCTS_URL = 'https://tigerstores.is/products.json';

export function buildTigerIsProductsUrl(page = 1, limit = 250, productsUrl = TIGER_IS_PRODUCTS_URL): string {
  const url = new URL(productsUrl);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('page', String(page));
  return url.toString();
}

export async function fetchTigerIsProducts(options: FetchTigerIsProductsOptions = {}): Promise<TigerIsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const pageSize = Math.min(Math.max(options.pageSize ?? 250, 1), 250);
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: TigerIsProduct[] = [];
  const seenIds = new Set<string>();
  let page = 1;

  while (rows.length < maxRows) {
    const sourceUrl = buildTigerIsProductsUrl(page, pageSize, options.productsUrl);
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json', 'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)' } });
    if (!response.ok) throw new Error(`Tiger IS products request failed: ${response.status}`);
    const payload = await response.json() as ShopifyProductsResponse;
    const products = payload.products ?? [];
    if (products.length === 0) break;
    for (const product of products) {
      const row = normalizeTigerIsProduct(product, sourceUrl, retrievedAt);
      if (!row || seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
    if (products.length < pageSize) break;
    page += 1;
  }

  return rows;
}

export function normalizeTigerIsProduct(product: ShopifyProduct, sourceUrl: string, retrievedAt: string): TigerIsProduct | null {
  const id = text(product.id);
  const title = text(product.title);
  const handle = text(product.handle);
  const variant = product.variants?.[0];
  const price = money(variant?.price);
  if (!id || !title || price === null) return null;
  const compareAtPrice = money(variant?.compare_at_price);
  return {
    country: 'IS',
    currency: 'ISK',
    chain: 'tiger',
    id,
    handle,
    title,
    vendor: text(product.vendor),
    productType: text(product.product_type),
    price,
    ...(compareAtPrice === null ? {} : { compareAtPrice }),
    available: variant?.available !== false,
    imageUrl: text(product.images?.[0]?.src),
    sourceUrl,
    retrievedAt
  };
}

function text(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' ? value.trim() : '';
}

function money(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}
