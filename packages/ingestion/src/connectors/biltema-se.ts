export type BiltemaProduct = {
  code: string;
  name: string;
  brand: 'Biltema';
  category: 'paper' | 'cleaning' | 'batteries' | 'household';
  price: number;
  priceText: string;
  currency: 'SEK';
  productUrl: string;
  imageUrl: string;
  available: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchBiltemaProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

type JsonLdProduct = {
  '@type'?: unknown;
  name?: unknown;
  sku?: unknown;
  url?: unknown;
  image?: unknown;
  offers?: {
    price?: unknown;
    priceCurrency?: unknown;
    availability?: unknown;
  };
};

export const BILTEMA_SEARCH_BASE_URL = 'https://www.biltema.se/sok/';
export const DEFAULT_BILTEMA_HOUSEHOLD_QUERIES = ['hushållspapper', 'rengöring', 'batterier', 'diskmedel'] as const;

export function buildBiltemaSearchUrl(query: string): string {
  const url = new URL(BILTEMA_SEARCH_BASE_URL);
  url.searchParams.set('query', query);
  return url.toString();
}

export async function fetchBiltemaProducts(options: FetchBiltemaProductsOptions = {}): Promise<BiltemaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const queries = options.queries ?? DEFAULT_BILTEMA_HOUSEHOLD_QUERIES;
  const maxRows = options.maxRows ?? 500;
  const rows: BiltemaProduct[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildBiltemaSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Biltema search request failed for ${query}: ${response.status}`);

    for (const product of parseBiltemaProducts(await response.text(), { sourceUrl, retrievedAt, query })) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseBiltemaProducts(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; query?: string }
): BiltemaProduct[] {
  const products = parseJsonLdProducts(html);
  return products
    .map((product) => normalizeBiltemaProduct(product, context))
    .filter((row): row is BiltemaProduct => row !== null);
}

export function normalizeBiltemaProduct(
  product: JsonLdProduct,
  context: { sourceUrl: string; retrievedAt: string; query?: string }
): BiltemaProduct | null {
  const name = text(product.name);
  const price = Number(product.offers?.price);
  if (!name || !Number.isFinite(price)) return null;

  const productUrl = absoluteUrl(text(product.url));
  return {
    code: text(product.sku) || slugFromUrl(productUrl) || slug(name),
    name,
    brand: 'Biltema',
    category: householdCategory(`${context.query ?? ''} ${name}`),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    currency: 'SEK',
    productUrl,
    imageUrl: absoluteUrl(imageUrl(product.image)),
    available: !/outofstock|slut/i.test(text(product.offers?.availability)),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt
  };
}

function parseJsonLdProducts(html: string): JsonLdProduct[] {
  const rows: JsonLdProduct[] = [];
  for (const match of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1] ?? '')) as JsonLdProduct | JsonLdProduct[] | { '@graph'?: JsonLdProduct[] };
      const graph = !Array.isArray(parsed) && '@graph' in parsed ? parsed['@graph'] : undefined;
      const candidates = Array.isArray(parsed) ? parsed : graph ?? [parsed as JsonLdProduct];
      rows.push(...candidates.filter((item) => text(item['@type']).toLowerCase() === 'product'));
    } catch {
      continue;
    }
  }
  return rows;
}

function householdCategory(value: string): BiltemaProduct['category'] {
  const lower = value.toLowerCase();
  if (/papper|servett|toalett/.test(lower)) return 'paper';
  if (/batter/.test(lower)) return 'batteries';
  if (/rengör|disk|städ|tvätt/.test(lower)) return 'cleaning';
  return 'household';
}

function imageUrl(value: unknown) {
  return Array.isArray(value) ? text(value[0]) : text(value);
}

function absoluteUrl(value: string) {
  if (!value) return '';
  return new URL(value, 'https://www.biltema.se').toString();
}

function slugFromUrl(value: string) {
  return value.match(/\/([^/?#]+)\/?$/)?.[1] ?? '';
}

function slug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
