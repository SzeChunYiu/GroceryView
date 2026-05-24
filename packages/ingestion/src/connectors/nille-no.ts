export const NILLE_NO_BASE_URL = 'https://www.nille.no';
export const DEFAULT_NILLE_NO_QUERIES = ['kaffe', 'lys', 'servietter'] as const;

export type NilleNoProduct = {
  chainId: 'nille-no';
  countryCode: 'NO';
  domain: 'variety';
  productId: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number | null;
  currency: 'NOK';
  packageText: string;
  inStock: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  promotionText: string;
};

type NilleNoApiProduct = {
  id?: unknown;
  sku?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  price?: unknown;
  salesPrice?: unknown;
  originalPrice?: unknown;
  beforePrice?: unknown;
  packageText?: unknown;
  inStock?: unknown;
  url?: unknown;
  productUrl?: unknown;
  imageUrl?: unknown;
  image?: unknown;
  campaignText?: unknown;
  promotionText?: unknown;
};

type NilleNoPayload = {
  products?: NilleNoApiProduct[];
  items?: NilleNoApiProduct[];
};

export function buildNilleNoSearchUrl(query: string): string {
  const url = new URL('/search', NILLE_NO_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchNilleNoProducts(options: {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  retrievedAt?: string;
} = {}): Promise<NilleNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_NILLE_NO_QUERIES;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NilleNoProduct[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildNilleNoSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json,text/html',
        'user-agent': 'GroceryView/0.1 nille-no-variety-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Nille NO request failed for ${query}: ${response.status}`);
    for (const row of parseNilleNoProducts(await response.text(), { sourceUrl, retrievedAt })) {
      if (seen.has(row.productId)) continue;
      seen.add(row.productId);
      rows.push(row);
    }
  }

  return rows;
}

export function parseNilleNoProducts(
  body: string,
  context: { sourceUrl: string; retrievedAt: string }
): NilleNoProduct[] {
  const payload = parsePayload(body);
  return (payload.products ?? payload.items ?? [])
    .map((product) => normalizeNilleNoProduct(product, context))
    .filter((row): row is NilleNoProduct => row !== null);
}

function normalizeNilleNoProduct(product: NilleNoApiProduct, context: { sourceUrl: string; retrievedAt: string }): NilleNoProduct | null {
  const productId = text(product.sku) || text(product.id);
  const name = text(product.name) || text(product.title);
  const price = numberValue(product.salesPrice) ?? numberValue(product.price);
  if (!productId || !name || price === null) return null;
  const originalPrice = numberValue(product.originalPrice) ?? numberValue(product.beforePrice);
  const productUrl = absoluteUrl(text(product.productUrl) || text(product.url));

  return {
    chainId: 'nille-no',
    countryCode: 'NO',
    domain: 'variety',
    productId,
    name,
    brand: text(product.brand) || 'Nille',
    category: text(product.category) || 'variety',
    price,
    originalPrice,
    currency: 'NOK',
    packageText: text(product.packageText),
    inStock: product.inStock !== false,
    productUrl,
    imageUrl: absoluteUrl(text(product.imageUrl) || text(product.image)),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    promotionText: text(product.promotionText) || text(product.campaignText) || (originalPrice !== null && originalPrice > price ? 'Nille discounted price' : '')
  };
}

function parsePayload(body: string): NilleNoPayload {
  const trimmed = body.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as NilleNoPayload;
  const embedded = body.match(/<script[^>]+id=["']__NILLE_PRODUCTS__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!embedded) throw new Error('Nille NO product payload missing.');
  return JSON.parse(embedded[1]) as NilleNoPayload;
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/\s+/g, '').replace(',', '.').replace(/kr|nok/gi, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function absoluteUrl(value: string): string {
  if (!value) return '';
  return new URL(value, NILLE_NO_BASE_URL).toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
