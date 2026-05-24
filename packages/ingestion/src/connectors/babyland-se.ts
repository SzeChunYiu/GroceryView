export type BabylandSeProduct = {
  available: boolean;
  brand: string;
  category: string;
  code: string;
  currency: string;
  imageUrl: string;
  name: string;
  packageText: string;
  price: number;
  priceText: string;
  productUrl: string;
  retrievedAt: string;
  sourceUrl: string;
  unitPrice: number | null;
  unitPriceText: string;
};

type BabylandSeRawProduct = {
  sku?: unknown;
  id?: unknown;
  name?: unknown;
  brand?: unknown | { name?: unknown };
  category?: unknown;
  url?: unknown;
  image?: unknown | string[];
  offers?: {
    price?: unknown;
    priceCurrency?: unknown;
    availability?: unknown;
  } | Array<{
    price?: unknown;
    priceCurrency?: unknown;
    availability?: unknown;
  }>;
  price?: unknown;
  priceCurrency?: unknown;
};

export const BABYLAND_SE_DIAPERS_URL = 'https://www.babyland.se/blojor';
export const BABYLAND_SE_FORMULA_URL = 'https://www.babyland.se/modersmjolksersattning';
export const BABYLAND_SE_BABY_FOOD_URL = 'https://www.babyland.se/barnmat';
export const DEFAULT_BABYLAND_SE_CATEGORY_URLS = [
  BABYLAND_SE_DIAPERS_URL,
  BABYLAND_SE_FORMULA_URL,
  BABYLAND_SE_BABY_FOOD_URL
] as const;

export type FetchBabylandSeProductsOptions = {
  categoryUrls?: readonly string[];
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
};

export async function fetchBabylandSeProducts(options: FetchBabylandSeProductsOptions = {}): Promise<BabylandSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const categoryUrls = options.categoryUrls ?? DEFAULT_BABYLAND_SE_CATEGORY_URLS;
  const maxRows = options.maxRows ?? 1500;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: BabylandSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of categoryUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) {
      throw new Error(`Babyland category request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const row of parseBabylandSeProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseBabylandSeProducts(html: string, sourceUrl: string, retrievedAt: string): BabylandSeProduct[] {
  const rows: BabylandSeProduct[] = [];
  for (const raw of extractRawProducts(html)) {
    const row = normalizeBabylandSeProduct(raw, sourceUrl, retrievedAt);
    if (row) rows.push(row);
  }
  return rows;
}

export function normalizeBabylandSeProduct(
  product: BabylandSeRawProduct,
  sourceUrl: string,
  retrievedAt: string
): BabylandSeProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const price = numberValue(offer?.price ?? product.price);
  const code = text(product.sku ?? product.id);
  const name = text(product.name);
  if (!code || !name || price === null) return null;

  const currency = text(offer?.priceCurrency ?? product.priceCurrency) || 'SEK';
  const brandValue = typeof product.brand === 'object' && product.brand !== null ? text(product.brand.name) : text(product.brand);
  const imageValue = Array.isArray(product.image) ? text(product.image[0]) : text(product.image);
  const productUrl = absoluteBabylandUrl(product.url, sourceUrl);

  return {
    available: !/OutOfStock/i.test(text(offer?.availability)),
    brand: brandValue,
    category: categoryFromSourceUrl(sourceUrl, text(product.category)),
    code,
    currency,
    imageUrl: imageValue,
    name,
    packageText: packageTextFromName(name),
    price,
    priceText: `${price.toFixed(2)} ${currency}`,
    productUrl,
    retrievedAt,
    sourceUrl,
    unitPrice: null,
    unitPriceText: ''
  };
}

function extractRawProducts(html: string): BabylandSeRawProduct[] {
  const products: BabylandSeRawProduct[] = [];
  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      visitJson(JSON.parse(htmlDecode(match[1] ?? '')), products);
    } catch {
      // Ignore unrelated/non-JSON script blocks.
    }
  }
  return products;
}

function visitJson(value: unknown, products: BabylandSeRawProduct[]) {
  if (!value || typeof value !== 'object') return;
  const candidate = value as BabylandSeRawProduct & { '@type'?: unknown; itemListElement?: unknown };
  if (text(candidate['@type']).toLowerCase() === 'product' || (candidate.offers && candidate.name)) {
    products.push(candidate);
  }
  if (Array.isArray(candidate.itemListElement)) {
    for (const item of candidate.itemListElement) visitJson((item as { item?: unknown }).item ?? item, products);
  }
  if (Array.isArray(value)) {
    for (const item of value) visitJson(item, products);
  }
}

function categoryFromSourceUrl(sourceUrl: string, fallback: string): string {
  if (/blojor|blöjor/i.test(sourceUrl)) return 'diapers';
  if (/modersmjolksersattning|ersattning/i.test(sourceUrl)) return 'formula';
  if (/barnmat|valling/i.test(sourceUrl)) return 'baby_food';
  return fallback || 'baby_specialty';
}

function packageTextFromName(name: string): string {
  return name.match(/\b\d+\s*(?:st|ml|l|g|kg)\b/i)?.[0] ?? '';
}

function absoluteBabylandUrl(value: unknown, baseUrl: string): string {
  const url = text(value);
  if (!url) return '';
  return url.startsWith('https://') ? url : new URL(url, baseUrl).toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function htmlDecode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
