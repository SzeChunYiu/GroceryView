export const AFROSHOP_NO_MAMABRIDGET_PRODUCTS_URL = 'https://mamabridget.com/collections/all/products.json?limit=250';
export const AFROSHOP_NO_MAMABRIDGET_ABOUT_URL = 'https://mamabridget.com/pages/about-us';
export const AFROSHOP_NO_PARSER_VERSION = 'afroshop-no-shopify-v1';

export type AfroshopNoChainStatus = {
  chainId: 'mamabridget-no';
  chainName: 'Mama Bridget Afro-Caribbean Store';
  country: 'NO';
  retailerType: 'ethnic_african';
  status: 'verified_single_store_with_online_delivery';
  qualifiesForNationalChain: boolean;
  qualifiesForOnlineConnector: boolean;
  evidence: Array<{
    kind: 'official_site' | 'directory_listing';
    label: string;
    city: string;
    address: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type AfroshopNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'mamabridget-no';
  retailerType: 'ethnic_african';
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
  variants?: Array<{
    id?: unknown;
    sku?: unknown;
    title?: unknown;
    price?: unknown;
    compare_at_price?: unknown;
    available?: unknown;
    featured_image?: { src?: unknown } | null;
  }>;
};

export type FetchAfroshopNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const AFROSHOP_NO_CHAIN_STATUS: AfroshopNoChainStatus = {
  chainId: 'mamabridget-no',
  chainName: 'Mama Bridget Afro-Caribbean Store',
  country: 'NO',
  retailerType: 'ethnic_african',
  status: 'verified_single_store_with_online_delivery',
  qualifiesForNationalChain: false,
  qualifiesForOnlineConnector: true,
  evidence: [
    {
      kind: 'official_site',
      label: 'Official Mama Bridget about page describes an Afro-Caribbean food store with online/offline grocery service.',
      city: 'Oslo',
      address: 'Thorvald Meyers Gate 85, 0550 Oslo',
      sourceUrl: AFROSHOP_NO_MAMABRIDGET_ABOUT_URL
    },
    {
      kind: 'directory_listing',
      label: 'Ango Afro is a verified Bergen African specialty retail listing, tracked as an independent coverage candidate rather than this chain.',
      city: 'Bergen',
      address: 'Fjøsangerveien 18, 5053 Bergen',
      sourceUrl: 'https://www.finn.no/butikk/angoafro2021'
    }
  ],
  caveat: 'No source-backed evidence found for a single AfroShop-branded Norway chain spanning Oslo, Bergen, and other cities; this connector therefore targets the verified Mama Bridget online/offline Afro-Caribbean grocery source and keeps Bergen as independent coverage evidence.'
};

export async function fetchAfroshopNoProducts(options: FetchAfroshopNoProductsOptions = {}): Promise<AfroshopNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: AfroshopNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? [AFROSHOP_NO_MAMABRIDGET_PRODUCTS_URL]) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 afroshop-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`AfroShop NO source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) {
      throw new Error(`AfroShop NO source failed with HTTP ${response.status}.`);
    }

    for (const product of parseAfroshopNoProducts(await response.json(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseAfroshopNoProducts(payload: unknown, sourceUrl: string, retrievedAt: string): AfroshopNoProduct[] {
  const products = isRecord(payload) && Array.isArray(payload.products) ? payload.products : [];
  return products.flatMap((product) => normalizeAfroshopNoProduct(product as ShopifyProduct, sourceUrl, retrievedAt));
}

export function normalizeAfroshopNoProduct(product: ShopifyProduct, sourceUrl: string, retrievedAt: string): AfroshopNoProduct[] {
  const title = text(product.title);
  const handle = text(product.handle);
  if (!title || !handle || !Array.isArray(product.variants)) return [];

  const tags = tagsFrom(product.tags);
  return product.variants.flatMap((variant) => {
    const price = money(variant.price);
    if (price === null) return [];
    const variantId = text(variant.id);
    const sku = text(variant.sku);
    const code = sku || variantId || `${handle}:${text(variant.title) || 'default'}`;
    const variantTitle = text(variant.title);
    const name = variantTitle && variantTitle.toLowerCase() !== 'default title' ? `${title} - ${variantTitle}` : title;
    return [{
      country: 'NO' as const,
      currency: 'NOK' as const,
      chain: 'mamabridget-no' as const,
      retailerType: 'ethnic_african' as const,
      code,
      name,
      brand: text(product.vendor),
      category: text(product.product_type) || categoryFrom(tags),
      tags,
      price,
      priceText: `${price.toFixed(2)} NOK`,
      compareAtPrice: money(variant.compare_at_price),
      available: variant.available !== false,
      productUrl: `https://mamabridget.com/products/${handle}`,
      imageUrl: imageUrl(product, variant),
      sourceUrl,
      retrievedAt
    }];
  });
}

export function verifyAfroshopNoChainStatus(): AfroshopNoChainStatus {
  return AFROSHOP_NO_CHAIN_STATUS;
}

function categoryFrom(tags: string[]): string {
  if (tags.some((tag) => /garri|fufu|yam|plantain|rice|beans|spice|sauce|soup|beverage|drink|food/i.test(tag))) return 'afro-caribbean-grocery';
  return 'afro-caribbean-specialty';
}

function imageUrl(product: ShopifyProduct, variant: NonNullable<ShopifyProduct['variants']>[number]): string {
  const variantImage = text(variant.featured_image?.src);
  if (variantImage) return variantImage;
  return text(product.images?.[0]?.src);
}

function tagsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return text(value).split(',').map((tag) => tag.trim()).filter(Boolean);
}

function money(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round((value + Number.EPSILON) * 100) / 100;
  const normalized = text(value).replace(/\s/g, '').replace(/kr|nok/gi, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
