export const NORMAL_NO_PRODUCTS_URL = 'https://www.normal.no/products.json?limit=250';
export const NORMAL_NO_PARSER_VERSION = 'normal-no-shopify-v1';

export type NormalNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'normal-no';
  retailerType: 'cosmetics';
  code: string;
  name: string;
  brand: string;
  category: string;
  tags: string[];
  price: number;
  priceText: string;
  compareAtPrice: number | null;
  available: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type ShopifyProduct = {
  id?: unknown;
  handle?: unknown;
  title?: unknown;
  vendor?: unknown;
  product_type?: unknown;
  tags?: unknown;
  images?: Array<{ src?: unknown }>;
  variants?: Array<{ id?: unknown; sku?: unknown; price?: unknown; compare_at_price?: unknown; available?: unknown }>;
};

export type FetchNormalNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function price(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseNormalNoProducts(
  payload: unknown,
  sourceUrl = NORMAL_NO_PRODUCTS_URL,
  retrievedAt = new Date().toISOString()
): NormalNoProduct[] {
  const products = Array.isArray((payload as { products?: unknown }).products)
    ? (payload as { products: ShopifyProduct[] }).products
    : [];
  return products.flatMap((product) => {
    const variant = product.variants?.[0];
    const productPrice = price(variant?.price);
    const name = text(product.title);
    if (!variant || productPrice === null || !name) return [];
    const handle = text(product.handle);
    const code = text(variant.sku) || String(variant.id ?? product.id ?? handle);
    return [{
      country: 'NO',
      currency: 'NOK',
      chain: 'normal-no',
      retailerType: 'cosmetics',
      code,
      name,
      brand: text(product.vendor) || 'Normal',
      category: text(product.product_type) || 'cosmetics',
      tags: Array.isArray(product.tags) ? product.tags.map(text).filter(Boolean) : [],
      price: productPrice,
      priceText: `${productPrice.toFixed(2)} kr`,
      compareAtPrice: price(variant.compare_at_price),
      available: Boolean(variant.available),
      productUrl: handle ? `https://www.normal.no/products/${handle}` : 'https://www.normal.no',
      imageUrl: text(product.images?.[0]?.src),
      sourceUrl,
      retrievedAt
    } satisfies NormalNoProduct];
  });
}

export async function fetchNormalNoProducts(options: FetchNormalNoProductsOptions = {}): Promise<NormalNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NormalNoProduct[] = [];
  const seen = new Set<string>();
  for (const sourceUrl of options.sourceUrls ?? [NORMAL_NO_PRODUCTS_URL]) {
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json', 'user-agent': 'GroceryView/0.1 normal-no-connector' } });
    if (!response.ok) throw new Error(`Normal NO source failed with HTTP ${response.status}.`);
    for (const product of parseNormalNoProducts(await response.json(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }
  return rows;
}
