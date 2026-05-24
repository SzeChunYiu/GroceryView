export type EuroprisNoCategory = 'personal_care' | 'household' | 'snacks';

export type EuroprisNoProduct = {
  chain: 'europris';
  country: 'NO';
  currency: 'NOK';
  code: string;
  name: string;
  brand: string;
  category: EuroprisNoCategory;
  price: number;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type EuroprisJsonProduct = {
  sku?: unknown;
  gtin13?: unknown;
  name?: unknown;
  brand?: { name?: unknown } | string;
  image?: unknown;
  offers?: { price?: unknown; priceCurrency?: unknown } | Array<{ price?: unknown; priceCurrency?: unknown }>;
  url?: unknown;
  category?: unknown;
};

export type FetchEuroprisNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const EUROPRIS_NO_BASE_URL = 'https://www.europris.no';
export const DEFAULT_EUROPRIS_NO_SOURCE_PATHS = [
  '/search?text=shampoo',
  '/search?text=vaskemiddel',
  '/search?text=kaffe',
  '/search?text=godteri'
] as const;

export async function fetchEuroprisNoProducts(options: FetchEuroprisNoProductsOptions = {}): Promise<EuroprisNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: EuroprisNoProduct[] = [];
  const seen = new Set<string>();

  for (const path of options.sourcePaths ?? DEFAULT_EUROPRIS_NO_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(path);
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'GroceryView/0.1' } });
    if (!response.ok) throw new Error(`Europris request failed for ${sourceUrl}: ${response.status}`);
    for (const product of parseEuroprisNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = product.code || product.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseEuroprisNoProducts(html: string, sourceUrl: string, retrievedAt: string): EuroprisNoProduct[] {
  return extractJsonLd(html)
    .flatMap((node) => Array.isArray(node) ? node : [node])
    .flatMap((node) => node && typeof node === 'object' && (node as { '@graph'?: unknown }).['@graph'] && Array.isArray((node as { '@graph': unknown[] })['@graph']) ? (node as { '@graph': unknown[] })['@graph'] : [node])
    .map((node) => normalizeEuroprisNoProduct(node as EuroprisJsonProduct, sourceUrl, retrievedAt))
    .filter((row): row is EuroprisNoProduct => row !== null);
}

export function normalizeEuroprisNoProduct(product: EuroprisJsonProduct, sourceUrl: string, retrievedAt: string): EuroprisNoProduct | null {
  const name = text(product.name);
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const price = numberFromText(offer?.price);
  const currency = text(offer?.priceCurrency) || 'NOK';
  if (!name || price === null || currency !== 'NOK') return null;

  return {
    chain: 'europris',
    country: 'NO',
    currency: 'NOK',
    code: text(product.sku) || text(product.gtin13) || slug(name),
    name,
    brand: typeof product.brand === 'string' ? product.brand : text(product.brand?.name),
    category: categoryFromText(`${sourceUrl} ${text(product.category)} ${name}`),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    productUrl: absoluteUrl(product.url),
    imageUrl: absoluteUrl(product.image),
    sourceUrl,
    retrievedAt
  };
}

function categoryFromText(value: string): EuroprisNoCategory {
  const normalized = value.toLowerCase();
  if (/shampoo|såpe|soap|hud|hår|tann|deodorant/.test(normalized)) return 'personal_care';
  if (/vask|rengjør|clean|klut|lys|batteri|household/.test(normalized)) return 'household';
  return 'snacks';
}

function extractJsonLd(html: string): unknown[] {
  const nodes: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      nodes.push(JSON.parse(match[1]));
    } catch {
      // Skip malformed third-party JSON-LD blocks.
    }
  }
  return nodes;
}

function absoluteUrl(value: unknown): string {
  const url = text(value);
  if (!url) return '';
  return url.startsWith('http') ? url : new URL(url, EUROPRIS_NO_BASE_URL).toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
