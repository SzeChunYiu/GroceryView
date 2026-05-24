export type AfroshopNoProduct = {
  chain: 'afroshop-no';
  country: 'NO';
  specialty: 'ethnic_african';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  currency: string;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type ShopifyProduct = {
  handle?: unknown;
  id?: unknown;
  images?: Array<{ src?: unknown }>;
  product_type?: unknown;
  title?: unknown;
  variants?: Array<{
    barcode?: unknown;
    id?: unknown;
    price?: unknown;
    sku?: unknown;
  }>;
  vendor?: unknown;
};

type JsonLdProduct = {
  '@type'?: unknown;
  brand?: unknown | { name?: unknown };
  category?: unknown;
  gtin?: unknown;
  image?: unknown;
  name?: unknown;
  offers?: unknown | Array<unknown>;
  sku?: unknown;
  url?: unknown;
};

export type FetchAfroshopNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const AFROSHOP_NO_BASE_URL = 'https://afro-shop.eu';
export const DEFAULT_AFROSHOP_NO_SOURCE_URLS = [
  'https://afro-shop.eu/products.json?limit=250',
  'https://afro-shop.eu/collections/food/products.json?limit=250'
] as const;

export const AFROSHOP_NO_CHAIN_STATUS = {
  status: 'verified_specialty_online_unverified_physical_chain',
  note: 'Afroshop has an active African-food online storefront; public Norwegian African grocery evidence is store-level rather than a confirmed national Afroshop chain.',
  verificationSources: [
    'https://afro-shop.eu/pages/about-afroshop',
    'https://www.proff.no/selskap/kejetia-african-supermarket-salong-manko-owusu-mensah/oslo/butikkhandel/IGCD69X10MC',
    'https://norgeguide.com/en/oslo/gave-og-suvenirbutikker/kejetia-african-supermarket-and-salon/'
  ]
} as const;

export async function fetchAfroshopNoProducts(options: FetchAfroshopNoProductsOptions = {}): Promise<AfroshopNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 500;
  const rows: AfroshopNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_AFROSHOP_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json,text/html',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) {
      throw new Error(`Afroshop NO request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const product of parseAfroshopNoProducts(await response.text(), { retrievedAt, sourceUrl })) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseAfroshopNoProducts(
  payload: string,
  context: { retrievedAt: string; sourceUrl: string }
): AfroshopNoProduct[] {
  return [
    ...parseShopifyProducts(payload, context),
    ...parseJsonLdProducts(payload, context)
  ];
}

function parseShopifyProducts(payload: string, context: { retrievedAt: string; sourceUrl: string }): AfroshopNoProduct[] {
  try {
    const data = JSON.parse(payload) as { products?: ShopifyProduct[] };
    if (!Array.isArray(data.products)) return [];

    return data.products.flatMap((product) => normalizeShopifyProduct(product, context));
  } catch {
    return [];
  }
}

function normalizeShopifyProduct(
  product: ShopifyProduct,
  context: { retrievedAt: string; sourceUrl: string }
): AfroshopNoProduct[] {
  const variants = product.variants?.length ? product.variants : [{}];
  return variants
    .map((variant) => {
      const price = numberFromText(variant.price);
      const name = text(product.title);
      if (!name || price === null) return null;

      const code = text(variant.sku ?? variant.barcode ?? variant.id ?? product.id);
      if (!code) return null;

      return productRow({
        brand: text(product.vendor),
        category: text(product.product_type),
        code,
        imageUrl: absoluteUrl(product.images?.[0]?.src, AFROSHOP_NO_BASE_URL),
        name,
        price,
        productUrl: absoluteUrl(`/products/${text(product.handle)}`, AFROSHOP_NO_BASE_URL),
        retrievedAt: context.retrievedAt,
        sourceUrl: context.sourceUrl
      });
    })
    .filter((product): product is AfroshopNoProduct => product !== null);
}

function parseJsonLdProducts(payload: string, context: { retrievedAt: string; sourceUrl: string }): AfroshopNoProduct[] {
  const rows: AfroshopNoProduct[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of payload.matchAll(scriptPattern)) {
    const jsonText = match[1];
    if (!jsonText) continue;

    try {
      visit(JSON.parse(jsonText), (value) => {
        const candidate = value as JsonLdProduct;
        if (text(candidate['@type']).toLowerCase() !== 'product') return;
        const row = normalizeJsonLdProduct(candidate, context);
        if (row) rows.push(row);
      });
    } catch {
      // Ignore unrelated JSON-LD.
    }
  }

  return rows;
}

function normalizeJsonLdProduct(
  product: JsonLdProduct,
  context: { retrievedAt: string; sourceUrl: string }
): AfroshopNoProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const offerRecord = offer && typeof offer === 'object' ? offer as Record<string, unknown> : {};
  const price = numberFromText(offerRecord.price);
  const name = text(product.name);
  if (!name || price === null) return null;

  const code = text(product.sku ?? product.gtin) || slugify(name);
  return productRow({
    brand: brandText(product.brand),
    category: text(product.category),
    code,
    imageUrl: absoluteUrl(Array.isArray(product.image) ? product.image[0] : product.image, AFROSHOP_NO_BASE_URL),
    name,
    price,
    productUrl: absoluteUrl(product.url, AFROSHOP_NO_BASE_URL),
    retrievedAt: context.retrievedAt,
    sourceUrl: context.sourceUrl
  });
}

function productRow(input: Omit<AfroshopNoProduct, 'chain' | 'country' | 'currency' | 'priceText' | 'specialty'>): AfroshopNoProduct {
  return {
    ...input,
    chain: 'afroshop-no',
    country: 'NO',
    currency: 'NOK',
    priceText: `${input.price.toFixed(2)} NOK`,
    specialty: 'ethnic_african'
  };
}

function brandText(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value) return text((value as { name?: unknown }).name);
  return text(value);
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw) return '';

  return new URL(raw, baseUrl).toString();
}

function numberFromText(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function visit(value: unknown, visitor: (value: unknown) => void): void {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) visit(item, visitor);
  }
}
