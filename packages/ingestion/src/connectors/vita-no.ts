export type VitaNoProduct = {
  chain: 'vita-no';
  code: string;
  name: string;
  brand: string;
  category: 'personal_care' | 'supplement' | 'beauty';
  price: number;
  priceText: string;
  currency: 'NOK';
  channel: 'online';
  productUrl: string;
  imageUrl: string;
  stockStatus: string;
  sourceUrl: string;
  retrievedAt: string;
};

type JsonLdProduct = {
  '@type'?: unknown;
  brand?: { name?: unknown } | string;
  hasVariant?: JsonLdProduct[];
  image?: unknown;
  name?: unknown;
  offers?: { availability?: unknown; price?: unknown; priceCurrency?: unknown; sku?: unknown; url?: unknown } | null;
  sku?: unknown;
  url?: unknown;
};

export type FetchVitaNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const VITA_NO_BASE_URL = 'https://www.vita.no';
export const DEFAULT_VITA_NO_SOURCE_URLS = [
  'https://www.vita.no/hudpleie/toner/glow2oh-dark-spot-toner-190ml',
  'https://www.vita.no/hudpleie',
  'https://www.vita.no/helsekost-og-kosttilskudd'
] as const;

export async function fetchVitaNoProducts(options: FetchVitaNoProductsOptions = {}): Promise<VitaNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: VitaNoProduct[] = [];
  const seenCodes = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_VITA_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 Vita NO connector (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Vita NO request failed for ${sourceUrl}: ${response.status}`);

    for (const row of parseVitaNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseVitaNoProducts(html: string, sourceUrl: string, retrievedAt: string): VitaNoProduct[] {
  const rows: VitaNoProduct[] = [];
  for (const product of extractJsonLdProducts(html)) {
    const normalized = normalizeVitaNoProduct(product, sourceUrl, retrievedAt);
    if (normalized) rows.push(normalized);
  }
  return rows;
}

export function normalizeVitaNoProduct(product: JsonLdProduct, sourceUrl: string, retrievedAt: string): VitaNoProduct | null {
  const offer = product.offers && !Array.isArray(product.offers) ? product.offers : null;
  const price = numberFromText(offer?.price);
  const code = text(offer?.sku) || text(product.sku);
  const name = text(product.name);
  if (!code || !name || price === null) return null;

  return {
    chain: 'vita-no',
    code,
    name,
    brand: typeof product.brand === 'string' ? product.brand : text(product.brand?.name),
    category: categoryFromUrl(sourceUrl),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    currency: 'NOK',
    channel: 'online',
    productUrl: absoluteUrl(offer?.url ?? product.url, VITA_NO_BASE_URL),
    imageUrl: absoluteUrl(product.image, VITA_NO_BASE_URL),
    stockStatus: stockStatusFromAvailability(offer?.availability),
    sourceUrl,
    retrievedAt
  };
}

function extractJsonLdProducts(html: string): JsonLdProduct[] {
  const products: JsonLdProduct[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1] ?? '')) as JsonLdProduct;
      collectProducts(parsed, products);
    } catch {
      // Ignore unrelated malformed scripts; Vita pages may include several JSON-LD blocks.
    }
  }
  return products;
}

function collectProducts(value: JsonLdProduct, products: JsonLdProduct[]) {
  if (value['@type'] === 'Product' && value.offers) products.push(value);
  for (const variant of value.hasVariant ?? []) collectProducts(variant, products);
}

function categoryFromUrl(sourceUrl: string): VitaNoProduct['category'] {
  if (/helsekost|kosttilskudd/i.test(sourceUrl)) return 'supplement';
  if (/makeup|sminke/i.test(sourceUrl)) return 'beauty';
  return 'personal_care';
}

function stockStatusFromAvailability(value: unknown): string {
  const raw = text(value);
  if (/InStock/i.test(raw)) return 'in_stock';
  if (/OutOfStock/i.test(raw)) return 'out_of_stock';
  return raw;
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw) return '';
  return new URL(raw, baseUrl).toString();
}

function numberFromText(value: unknown): number | null {
  const normalized = text(value).replace(/\s/g, '').replace(',', '.');
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
