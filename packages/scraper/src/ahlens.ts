import {
  ahlensFoodCategoryMap,
  categoryForAhlensPath,
  type AhlensFoodCategory,
  type GroceryCategory
} from './categoryMap.js';

export interface AhlensProduct {
  id: string;
  name: string;
  brand?: string;
  category: GroceryCategory;
  ahlensCategory: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
}

export interface AhlensScrapeOptions {
  fetcher?: typeof fetch;
  now?: () => Date;
  startUrls?: readonly string[];
  userAgent?: string;
}

interface ProductCandidate {
  id?: unknown;
  sku?: unknown;
  name?: unknown;
  brand?: unknown;
  category?: unknown;
  offers?: unknown;
  price?: unknown;
  priceCurrency?: unknown;
  image?: unknown;
  url?: unknown;
}

export const ahlensFoodStartUrls = ahlensFoodCategoryMap.map((category) => category.url);

export async function scrapeAhlensFoodProducts(options: AhlensScrapeOptions = {}): Promise<AhlensProduct[]> {
  const fetcher = options.fetcher ?? fetch;
  const startUrls = options.startUrls ?? ahlensFoodStartUrls;
  const retrievedAt = (options.now ?? (() => new Date()))().toISOString();
  const allProducts: AhlensProduct[] = [];

  for (const sourceUrl of startUrls) {
    const response = await fetcher(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': options.userAgent ?? 'GroceryViewBot/0.1'
      }
    });

    if (!response.ok) {
      throw new Error(`Åhléns scraper failed for ${sourceUrl}: ${response.status} ${response.statusText}`);
    }

    allProducts.push(...parseAhlensProductListing(await response.text(), sourceUrl, retrievedAt));
  }

  return dedupeProducts(allProducts);
}

export function parseAhlensProductListing(
  html: string,
  sourceUrl: string,
  retrievedAt = new Date().toISOString()
): AhlensProduct[] {
  const category = categoryForAhlensPath(sourceUrl);

  if (!category) {
    return [];
  }

  const candidates = [
    ...extractJsonLdProducts(html),
    ...extractNextDataProducts(html)
  ];

  return dedupeProducts(
    candidates
      .map((candidate) => toAhlensProduct(candidate, category, sourceUrl, retrievedAt))
      .filter((product): product is AhlensProduct => product !== undefined)
  );
}

function extractJsonLdProducts(html: string): ProductCandidate[] {
  const products: ProductCandidate[] = [];
  const scriptPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    const parsed = parseJsonScript(match[1] ?? '');

    for (const value of Array.isArray(parsed) ? parsed : [parsed]) {
      collectStructuredProducts(value, products);
    }
  }

  return products;
}

function extractNextDataProducts(html: string): ProductCandidate[] {
  const products: ProductCandidate[] = [];
  const match = html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  const parsed = parseJsonScript(match?.[1] ?? '');

  collectStructuredProducts(parsed, products);
  return products;
}

function collectStructuredProducts(value: unknown, products: ProductCandidate[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStructuredProducts(item, products);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (value['@type'] === 'Product' || (typeof value.name === 'string' && (value.url || value.offers))) {
    products.push(value);
  }

  if (Array.isArray(value.itemListElement)) {
    for (const item of value.itemListElement) {
      if (isRecord(item) && item.item) {
        collectStructuredProducts(item.item, products);
      }
    }
  }

  for (const child of Object.values(value)) {
    if (isRecord(child) || Array.isArray(child)) {
      collectStructuredProducts(child, products);
    }
  }
}

function toAhlensProduct(
  candidate: ProductCandidate,
  category: AhlensFoodCategory,
  sourceUrl: string,
  retrievedAt: string
): AhlensProduct | undefined {
  const name = stringValue(candidate.name);
  const productUrl = absoluteAhlensUrl(stringValue(candidate.url));

  if (!name || !productUrl) {
    return undefined;
  }

  const offer = firstOffer(candidate.offers);
  const sku = stringValue(candidate.sku) ?? stringValue(offer?.sku) ?? lastPathToken(productUrl);
  const brand = brandName(candidate.brand);
  const price = numberValue(candidate.price) ?? numberValue(offer?.price);
  const currency = stringValue(candidate.priceCurrency) ?? stringValue(offer?.priceCurrency);

  return {
    id: sku,
    name: stripHtml(name),
    ...(brand ? { brand } : {}),
    category: category.groceryCategory,
    ahlensCategory: category.name,
    ...(price !== undefined ? { price } : {}),
    ...(currency ? { currency } : {}),
    ...(absoluteAhlensUrl(firstString(candidate.image)) ? { imageUrl: absoluteAhlensUrl(firstString(candidate.image)) } : {}),
    productUrl,
    sourceUrl,
    retrievedAt
  };
}

function firstOffer(offers: unknown): ProductCandidate | undefined {
  const offer = Array.isArray(offers) ? offers[0] : offers;
  return isRecord(offer) ? offer : undefined;
}

function brandName(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return stripHtml(value);
  }

  if (isRecord(value)) {
    return stringValue(value.name);
  }

  return undefined;
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string');
  }

  return undefined;
}

function absoluteAhlensUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return new URL(value, 'https://www.ahlens.se').toString();
}

function lastPathToken(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? url;
}

function parseJsonScript(json: string): unknown {
  if (!json.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(unescapeHtml(json));
  } catch {
    return undefined;
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? stripHtml(value.trim()) : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stripHtml(value: string): string {
  return unescapeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&#60;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#62;/g, '>');
}

function dedupeProducts(products: AhlensProduct[]): AhlensProduct[] {
  const seen = new Set<string>();

  return products.filter((product) => {
    const key = product.productUrl || product.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
