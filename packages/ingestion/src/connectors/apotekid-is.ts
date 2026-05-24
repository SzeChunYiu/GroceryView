export type ApotekidProductCategory = 'otc' | 'supplement' | 'beauty' | 'pharmacy';

export type ApotekidProduct = {
  chain: 'apotekid-is';
  code: string;
  name: string;
  brand: string;
  category: ApotekidProductCategory;
  price: number;
  priceText: string;
  originalPrice: number | null;
  originalPriceText: string;
  currency: 'ISK';
  stockStatus: string;
  productUrl: string;
  imageUrl: string;
  isOtc: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

type ApotekidRawProduct = {
  '@type'?: unknown;
  brand?: unknown;
  category?: unknown;
  image?: unknown;
  images?: unknown;
  name?: unknown;
  offers?: { availability?: unknown; price?: unknown; priceCurrency?: unknown; url?: unknown } | Array<{ availability?: unknown; price?: unknown; priceCurrency?: unknown; url?: unknown }>;
  price?: unknown;
  productUrl?: unknown;
  regularPrice?: unknown;
  sku?: unknown;
  title?: unknown;
  url?: unknown;
};

export type FetchApotekidProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const APOTEKID_BASE_URL = 'https://www.apotekid.is';

export const DEFAULT_APOTEKID_SOURCE_URLS = [
  'https://www.apotekid.is/search?query=vitamin',
  'https://www.apotekid.is/search?query=s%C3%B3larv%C3%B6rn',
  'https://www.apotekid.is/search?query=verkjalyf',
  'https://www.apotekid.is/search?query=h%C3%BA%C3%B0v%C3%B6rur'
] as const;

export async function fetchApotekidProducts(options: FetchApotekidProductsOptions = {}): Promise<ApotekidProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: ApotekidProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_APOTEKID_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Apótekið request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const product of parseApotekidProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export function parseApotekidProducts(html: string, sourceUrl: string, retrievedAt: string): ApotekidProduct[] {
  const candidates: ApotekidRawProduct[] = [];

  for (const data of extractJsonLd(html)) {
    visit(data, (value) => {
      const candidate = value as ApotekidRawProduct;
      if (isProductCandidate(candidate)) {
        candidates.push(candidate);
      }
    });
  }

  for (const data of extractScriptJsonObjects(html)) {
    visit(data, (value) => {
      const candidate = value as ApotekidRawProduct;
      if (isProductCandidate(candidate)) {
        candidates.push(candidate);
      }
    });
  }

  const seen = new Set<string>();
  const rows: ApotekidProduct[] = [];
  for (const candidate of candidates) {
    const product = normalizeApotekidProduct(candidate, sourceUrl, retrievedAt);
    if (!product || seen.has(product.code)) continue;
    seen.add(product.code);
    rows.push(product);
  }
  return rows;
}

export function normalizeApotekidProduct(
  product: ApotekidRawProduct,
  sourceUrl: string,
  retrievedAt: string
): ApotekidProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const name = text(product.name) || text(product.title);
  const price = numberFromText(offer?.price ?? product.price);
  const code = text(product.sku) || slugFromText(name);
  if (!name || !code || price === null) {
    return null;
  }

  const originalPrice = numberFromText(product.regularPrice);
  const categoryText = `${text(product.category)} ${sourceUrl}`.toLowerCase();
  const productUrl = absoluteUrl(offer?.url ?? product.productUrl ?? product.url, APOTEKID_BASE_URL);

  return {
    chain: 'apotekid-is',
    code,
    name,
    brand: brandText(product.brand),
    category: apotekidCategory(categoryText),
    price,
    priceText: `${price.toFixed(0)} ISK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(0)} ISK`,
    currency: 'ISK',
    stockStatus: text(offer?.availability),
    productUrl,
    imageUrl: absoluteUrl(firstImage(product.image ?? product.images), APOTEKID_BASE_URL),
    isOtc: categoryText.includes('lyf') || categoryText.includes('verkja') || productUrl.includes('/lyf'),
    sourceUrl,
    retrievedAt
  };
}

function isProductCandidate(value: ApotekidRawProduct): boolean {
  return Boolean((value.name || value.title) && (value.offers || value.price));
}

function extractJsonLd(html: string): unknown[] {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.flatMap((match) => parseJson(match[1] ?? ''));
}

function extractScriptJsonObjects(html: string): unknown[] {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  return scripts.flatMap((match) => {
    const body = match[1] ?? '';
    const jsonMatch = body.match(/(?:__NEXT_DATA__\s*=|window\.__INITIAL_STATE__\s*=)\s*({[\s\S]*})\s*;?/);
    return jsonMatch ? parseJson(jsonMatch[1]) : [];
  });
}

function parseJson(source: string): unknown[] {
  try {
    const parsed = JSON.parse(source.trim());
    return [parsed];
  } catch {
    return [];
  }
}

function visit(value: unknown, callback: (value: unknown) => void): void {
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) visit(item, callback);
  }
}

function apotekidCategory(value: string): ApotekidProductCategory {
  if (value.includes('vítam') || value.includes('bætief') || value.includes('supplement')) return 'supplement';
  if (value.includes('snyrt') || value.includes('húð') || value.includes('beauty')) return 'beauty';
  if (value.includes('lyf') || value.includes('verkja') || value.includes('otc')) return 'otc';
  return 'pharmacy';
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw) return '';
  return new URL(raw, baseUrl).toString();
}

function brandText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'name' in value) {
    return text((value as { name?: unknown }).name);
  }
  return '';
}

function firstImage(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function htmlHeaders(): RequestInit {
  return { headers: { accept: 'text/html,application/xhtml+xml' } };
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugFromText(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
