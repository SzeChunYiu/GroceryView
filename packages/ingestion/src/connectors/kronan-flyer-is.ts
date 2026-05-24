const DEFAULT_ENDPOINT = 'https://backend.kronan.is/api/sales/products/';
const PRODUCT_URL_BASE = 'https://kronan.is/vara';

export type KronanFlyerIsMemberTier = 'public' | 'member';

export type KronanFlyerIsItem = {
  chain: 'kronan';
  country: 'IS';
  currency: 'ISK';
  source: 'kronan.is/sales/products';
  memberTier: KronanFlyerIsMemberTier;
  sku: string;
  name: string;
  category?: string;
  price: number;
  flyerPrice: number;
  discountPercent?: number;
  unitPriceText?: string;
  imageUrl?: string;
  productUrl?: string;
};

type KronanSalesProduct = {
  sku?: unknown;
  name?: unknown;
  category?: { name?: unknown };
  price?: unknown;
  discountedPrice?: unknown;
  discountPercent?: unknown;
  priceInfo?: unknown;
  image?: unknown;
  slug?: unknown;
  memberOnly?: unknown;
  customerGroupOnly?: unknown;
};

type KronanSalesResponse = {
  page?: unknown;
  hasNextPage?: unknown;
  products?: unknown;
};

type FetchLike = (input: string | URL, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export type FetchKronanFlyerIsOptions = {
  endpoint?: string;
  fetchImpl?: FetchLike;
};

export async function fetchKronanFlyerIs(options: FetchKronanFlyerIsOptions = {}): Promise<KronanFlyerIsItem[]> {
  const fetchImpl = options.fetchImpl ?? ((globalThis as { fetch: FetchLike }).fetch);
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const items: KronanFlyerIsItem[] = [];
  let page = 1;

  while (true) {
    const url = new URL(endpoint);
    url.searchParams.set('page', String(page));
    const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Krónan flyer request failed: ${response.status}`);

    const payload = (await response.json()) as KronanSalesResponse;
    const products = Array.isArray(payload.products) ? (payload.products as KronanSalesProduct[]) : [];
    items.push(...products.flatMap(normalizeKronanFlyerProduct));

    if (payload.hasNextPage !== true) break;
    page += 1;
  }

  return items;
}

export function normalizeKronanFlyerProduct(product: KronanSalesProduct): KronanFlyerIsItem[] {
  const sku = asString(product.sku);
  const name = asString(product.name);
  const price = asNumber(product.price);
  const flyerPrice = asNumber(product.discountedPrice);
  if (!sku || !name || price === undefined || flyerPrice === undefined) return [];

  return [
    {
      chain: 'kronan',
      country: 'IS',
      currency: 'ISK',
      source: 'kronan.is/sales/products',
      memberTier: product.memberOnly === true || product.customerGroupOnly === true ? 'member' : 'public',
      sku,
      name,
      category: asString(product.category?.name),
      price,
      flyerPrice,
      discountPercent: asNumber(product.discountPercent),
      unitPriceText: asString(product.priceInfo),
      imageUrl: asString(product.image),
      productUrl: buildProductUrl(product.slug)
    }
  ];
}

function buildProductUrl(slug: unknown): string | undefined {
  const value = asString(slug);
  return value ? `${PRODUCT_URL_BASE}/${encodeURIComponent(value)}` : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
