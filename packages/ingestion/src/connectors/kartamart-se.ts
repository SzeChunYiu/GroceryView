export const KARTAMART_SE_PRODUCTS_URL = 'https://kartamart.se/products.json?limit=250';
export const KARTAMART_SE_CHAIN = 'kartamart';
const CATEGORY_WHITELIST = ['rice', 'noodles', 'sauce', 'spices', 'snacks', 'tea', 'frozen', 'pantry', 'asian_grocery'];

export type KartaMartSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'kartamart';
  retailer_type: 'ethnic_asian';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  available: boolean;
  productUrl: string;
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
  variants?: Array<{ id?: unknown; sku?: unknown; price?: unknown; available?: unknown }>;
};

function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function price(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(text(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
function categoryFor(product: ShopifyProduct): string {
  const haystack = `${text(product.product_type)} ${Array.isArray(product.tags) ? product.tags.join(' ') : ''} ${text(product.title)}`.toLowerCase();
  return CATEGORY_WHITELIST.find((category) => haystack.includes(category.replace('_', ' ')) || haystack.includes(category)) ?? 'asian_grocery';
}

export function parseKartaMartSeProducts(payload: unknown, sourceUrl = KARTAMART_SE_PRODUCTS_URL, retrievedAt = new Date().toISOString()): KartaMartSeRow[] {
  const products = Array.isArray((payload as { products?: unknown }).products) ? (payload as { products: ShopifyProduct[] }).products : [];
  return products.flatMap((product) => {
    const variant = product.variants?.[0];
    const rowPrice = price(variant?.price);
    const name = text(product.title);
    if (!variant || rowPrice === null || !name) return [];
    const handle = text(product.handle);
    return [{
      country: 'SE',
      currency: 'SEK',
      chain: KARTAMART_SE_CHAIN,
      retailer_type: 'ethnic_asian',
      code: text(variant.sku) || String(variant.id ?? product.id ?? handle),
      name,
      brand: text(product.vendor) || 'Karta Mart',
      category: categoryFor(product),
      price: rowPrice,
      priceText: `${rowPrice.toFixed(2)} kr`,
      available: Boolean(variant.available),
      productUrl: handle ? `https://kartamart.se/products/${handle}` : 'https://kartamart.se',
      sourceUrl,
      retrievedAt
    } satisfies KartaMartSeRow];
  }).filter((row) => CATEGORY_WHITELIST.includes(row.category));
}

export async function fetchKartaMartSeProducts({ fetchImpl = fetch, sourceUrl = KARTAMART_SE_PRODUCTS_URL, retrievedAt = new Date().toISOString() } = {}) {
  const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json', 'user-agent': 'GroceryView/0.1 kartamart-se-connector' } });
  if (!response.ok) throw new Error(`Karta Mart SE source failed with HTTP ${response.status}.`);
  return parseKartaMartSeProducts(await response.json(), sourceUrl, retrievedAt);
}
