export const NATURKRAFT_SE_PRODUCTS_URL = 'https://naturkraft.se/products.json?limit=250';
export const NATURKRAFT_SE_PARSER_VERSION = 'naturkraft-se-shopify-v1';

export type NaturkraftSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'naturkraft-se';
  retailerType: 'health_food';
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

export type FetchNaturkraftSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asPrice(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number.parseFloat(asText(value));
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

export function parseNaturkraftSeProducts(payload: unknown, sourceUrl = NATURKRAFT_SE_PRODUCTS_URL, retrievedAt = new Date().toISOString()): NaturkraftSeProduct[] {
  const products = Array.isArray((payload as { products?: unknown }).products) ? (payload as { products: ShopifyProduct[] }).products : [];
  return products.flatMap((product) => {
    const variant = product.variants?.[0];
    const price = asPrice(variant?.price);
    const name = asText(product.title);
    if (!variant || price === null || !name) return [];
    const handle = asText(product.handle);
    const code = asText(variant.sku) || String(variant.id ?? product.id ?? handle);
    return [{
      country: 'SE',
      currency: 'SEK',
      chain: 'naturkraft-se',
      retailerType: 'health_food',
      code,
      name,
      brand: asText(product.vendor) || 'Naturkraft',
      category: asText(product.product_type) || 'health_food',
      tags: Array.isArray(product.tags) ? product.tags.map(asText).filter(Boolean) : [],
      price,
      priceText: `${price.toFixed(2)} kr`,
      compareAtPrice: asPrice(variant.compare_at_price),
      available: Boolean(variant.available),
      productUrl: handle ? `https://naturkraft.se/products/${handle}` : 'https://naturkraft.se',
      imageUrl: asText(product.images?.[0]?.src),
      sourceUrl,
      retrievedAt
    } satisfies NaturkraftSeProduct];
  });
}

export async function fetchNaturkraftSeProducts(options: FetchNaturkraftSeProductsOptions = {}): Promise<NaturkraftSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NaturkraftSeProduct[] = [];
  const seen = new Set<string>();
  for (const sourceUrl of options.sourceUrls ?? [NATURKRAFT_SE_PRODUCTS_URL]) {
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json', 'user-agent': 'GroceryView/0.1 naturkraft-se-connector' } });
    if (!response.ok) throw new Error(`Naturkraft SE source failed with HTTP ${response.status}.`);
    for (const product of parseNaturkraftSeProducts(await response.json(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }
  return rows;
}
