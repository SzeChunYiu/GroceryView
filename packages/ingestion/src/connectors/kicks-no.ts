export type KicksNoProduct = {
  availability: string;
  brand: string;
  category: 'cosmetics' | 'skin_care' | 'hair_care' | 'fragrance';
  chain: 'kicks-no';
  code: string;
  country: 'NO';
  currency: 'NOK';
  imageUrl: string;
  name: string;
  price: number;
  priceText: string;
  productUrl: string;
  retrievedAt: string;
  sourceUrl: string;
};

type KicksJsonProduct = {
  availability?: unknown;
  brand?: unknown;
  category?: unknown;
  id?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  price?: unknown;
  priceText?: unknown;
  title?: unknown;
  url?: unknown;
};

export type FetchKicksNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const KICKS_NO_BASE_URL = 'https://www.kicks.no';
export const DEFAULT_KICKS_NO_SOURCE_URLS = [
  'https://www.kicks.no/search?q=mascara',
  'https://www.kicks.no/search?q=spf',
  'https://www.kicks.no/hudpleie',
  'https://www.kicks.no/makeup',
  'https://www.kicks.no/parfyme'
] as const;

export async function fetchKicksNoProducts(options: FetchKicksNoProductsOptions = {}): Promise<KicksNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: KicksNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_KICKS_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 cosmetics-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`KICKS NO request failed for ${sourceUrl}: ${response.status}`);

    for (const product of parseKicksNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = product.code || product.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseKicksNoProducts(html: string, sourceUrl: string, retrievedAt: string): KicksNoProduct[] {
  const products: KicksJsonProduct[] = [];
  collectProducts(extractNextData(html), products);
  for (const json of extractJsonLd(html)) collectProducts(json, products);
  collectProductsFromHtml(html, products);

  return products
    .map((product) => normalizeKicksNoProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is KicksNoProduct => product !== null);
}

export function normalizeKicksNoProduct(product: KicksJsonProduct, sourceUrl: string, retrievedAt: string): KicksNoProduct | null {
  const name = text(product.name ?? product.title);
  const price = numberFromText(product.price ?? product.priceText);
  const priceText = text(product.priceText ?? product.price);
  if (!name || price === null) return null;

  const categoryText = `${text(product.category)} ${sourceUrl}`.toLowerCase();

  return {
    availability: text(product.availability),
    brand: text(product.brand),
    category: kicksCategory(categoryText),
    chain: 'kicks-no',
    code: text(product.id) || slugify(`${name}-${priceText || price}`),
    country: 'NO',
    currency: 'NOK',
    imageUrl: absoluteUrl(product.imageUrl ?? product.image, KICKS_NO_BASE_URL),
    name,
    price,
    priceText: priceText || `${price.toFixed(2)} NOK`,
    productUrl: absoluteUrl(product.url, KICKS_NO_BASE_URL) || sourceUrl,
    retrievedAt,
    sourceUrl
  };
}

function kicksCategory(value: string): KicksNoProduct['category'] {
  if (/hudpleie|skin|spf|serum|cream/.test(value)) return 'skin_care';
  if (/hår|hair|shampoo|balsam/.test(value)) return 'hair_care';
  if (/parfyme|fragrance|perfume|duft/.test(value)) return 'fragrance';
  return 'cosmetics';
}

function extractNextData(html: string): unknown {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  return match ? parseJson(match[1] ?? '') : null;
}

function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => parseJson(match[1] ?? ''));
}

function collectProducts(value: unknown, products: KicksJsonProduct[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectProducts(entry, products));
    return;
  }
  const record = value as Record<string, unknown>;
  if ((record.name || record.title) && (record.price || record.priceText)) products.push(record as KicksJsonProduct);
  Object.values(record).forEach((entry) => collectProducts(entry, products));
}

function collectProductsFromHtml(html: string, products: KicksJsonProduct[]) {
  const pageText = decodeHtmlText(html);
  const pattern = /([A-ZÆØÅa-zæøå0-9][^.;:]{2,90}?)\s+(\d{1,4}[,.]\d{0,2})\s*(?:kr|,-)/g;
  for (const match of pageText.matchAll(pattern)) products.push({ name: match[1]?.trim(), priceText: match[2] });
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  } catch {
    return null;
  }
}

function decodeHtmlText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function numberFromText(value: unknown): number | null {
  const parsed = Number.parseFloat(text(value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw) return '';
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return '';
  }
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'kicks-no-product';
}
