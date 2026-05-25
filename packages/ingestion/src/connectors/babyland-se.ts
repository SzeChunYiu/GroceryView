export const BABYLAND_SE_SOURCE_URL = 'https://www.babyland.se/';
export const BABYLAND_SE_PARSER_VERSION = 'babyland-se-jsonld-v1';

export type BabylandSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'babyland-se';
  retailerType: 'specialty_baby';
  code: string;
  name: string;
  category: 'diapers' | 'formula' | 'baby_food' | 'baby_specialty';
  price: number;
  priceText: string;
  available: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type JsonLdProduct = {
  '@type'?: unknown;
  sku?: unknown;
  mpn?: unknown;
  name?: unknown;
  image?: unknown;
  url?: unknown;
  category?: unknown;
  offers?: {
    price?: unknown;
    priceCurrency?: unknown;
    availability?: unknown;
    url?: unknown;
  } | Array<{
    price?: unknown;
    priceCurrency?: unknown;
    availability?: unknown;
    url?: unknown;
  }>;
};

export type FetchBabylandSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export async function fetchBabylandSeProducts(options: FetchBabylandSeProductsOptions = {}): Promise<BabylandSeProduct[]> {
  const sourceUrl = options.sourceUrl ?? BABYLAND_SE_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 babyland-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Babyland SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Babyland SE source failed with HTTP ${response.status}.`);

  const rows = parseBabylandSeProducts(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString());
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseBabylandSeProducts(html: string, sourceUrl: string, retrievedAt: string): BabylandSeProduct[] {
  const seen = new Set<string>();
  const products: BabylandSeProduct[] = [];
  for (const product of extractJsonLdProducts(html)) {
    const row = normalizeBabylandSeProduct(product, sourceUrl, retrievedAt);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    products.push(row);
  }
  return products;
}

export function normalizeBabylandSeProduct(product: JsonLdProduct, sourceUrl: string, retrievedAt: string): BabylandSeProduct | null {
  const name = text(product.name);
  const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const price = money(offers?.price);
  if (!name || price === null) return null;

  const productUrl = absoluteUrl(text(offers?.url) || text(product.url), sourceUrl);
  const code = text(product.sku) || text(product.mpn) || slugFrom(productUrl || name);
  if (!code) return null;

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'babyland-se',
    retailerType: 'specialty_baby',
    code,
    name,
    category: categoryFrom(`${name} ${text(product.category)}`),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    available: !/outofstock|soldout|slutsåld/i.test(text(offers?.availability)),
    productUrl,
    imageUrl: imageUrl(product.image),
    sourceUrl,
    retrievedAt
  };
}

function extractJsonLdProducts(html: string): JsonLdProduct[] {
  const rows: JsonLdProduct[] = [];
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptRe)) {
    try {
      collectProducts(JSON.parse(decodeHtml(match[1])), rows);
    } catch {
      // Ignore unrelated malformed JSON-LD blocks.
    }
  }
  return rows;
}

function collectProducts(value: unknown, rows: JsonLdProduct[]): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectProducts(entry, rows));
    return;
  }
  if (!isRecord(value)) return;
  if (value['@type'] === 'Product') rows.push(value as JsonLdProduct);
  collectProducts(value['@graph'], rows);
  collectProducts(value.itemListElement, rows);
  collectProducts(value.item, rows);
}

function categoryFrom(value: string): BabylandSeProduct['category'] {
  if (/blöj|diaper|wipes/i.test(value)) return 'diapers';
  if (/ersättning|formula|modersmjölksersättning|nan|baby semp/i.test(value)) return 'formula';
  if (/barnmat|gröt|välling|pur[eé]|klämm/i.test(value)) return 'baby_food';
  return 'baby_specialty';
}

function imageUrl(value: unknown): string {
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function absoluteUrl(value: string, baseUrl: string): string {
  return value ? new URL(value, baseUrl).toString() : '';
}

function slugFrom(value: string): string {
  return value.toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function money(value: unknown): number | null {
  const normalized = text(value).replace(/\s/g, '').replace(/kr|sek/gi, '').replace(',', '.');
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
