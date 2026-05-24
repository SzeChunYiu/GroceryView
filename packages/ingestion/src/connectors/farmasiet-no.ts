export type FarmasietNoProduct = {
  availability: string;
  brand: string;
  category: 'otc' | 'supplement' | 'beauty' | 'pharmacy';
  chain: 'farmasiet-no';
  code: string;
  currency: 'NOK';
  ean: string;
  imageUrl: string;
  isPrescriptionProduct: boolean;
  name: string;
  price: number;
  priceText: string;
  productUrl: string;
  retrievedAt: string;
  sourceUrl: string;
};

type FarmasietNoJsonProduct = {
  '@type'?: unknown;
  availability?: unknown;
  brand?: { name?: unknown } | string;
  category?: unknown;
  gtin?: unknown;
  gtin13?: unknown;
  image?: unknown;
  name?: unknown;
  offers?: { availability?: unknown; price?: unknown; priceCurrency?: unknown } | Array<{ availability?: unknown; price?: unknown; priceCurrency?: unknown }>;
  sku?: unknown;
  url?: unknown;
};

export type FetchFarmasietNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const FARMASIET_NO_BASE_URL = 'https://www.farmasiet.no';
export const DEFAULT_FARMASIET_NO_SOURCE_URLS = [
  'https://www.farmasiet.no/sok?query=vitamin',
  'https://www.farmasiet.no/sok?query=solkrem',
  'https://www.farmasiet.no/sok?query=tannkrem',
  'https://www.farmasiet.no/sok?query=paracet',
  'https://www.farmasiet.no/kategori/hudpleie',
  'https://www.farmasiet.no/kategori/kosttilskudd'
] as const;

export async function fetchFarmasietNoProducts(options: FetchFarmasietNoProductsOptions = {}): Promise<FarmasietNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: FarmasietNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_FARMASIET_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml' } });
    if (!response.ok) throw new Error(`Farmasiet request failed for ${sourceUrl}: ${response.status}`);

    for (const product of parseFarmasietNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = product.ean || product.code || product.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseFarmasietNoProducts(html: string, sourceUrl: string, retrievedAt: string): FarmasietNoProduct[] {
  const products: FarmasietNoJsonProduct[] = [];
  for (const json of extractJsonLd(html)) collectJsonProducts(json, products);
  collectJsonProducts(extractNextData(html), products);

  return products
    .map((product) => normalizeFarmasietNoProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is FarmasietNoProduct => product !== null);
}

export function normalizeFarmasietNoProduct(
  product: FarmasietNoJsonProduct,
  sourceUrl: string,
  retrievedAt: string
): FarmasietNoProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const price = numberFromText(offer?.price);
  const name = text(product.name);
  const productUrl = absoluteUrl(product.url, FARMASIET_NO_BASE_URL);
  if (!name || price === null || !productUrl) return null;

  const categoryText = `${text(product.category)} ${sourceUrl}`.toLowerCase();
  const isPrescriptionProduct = /resept|recept|prescription/.test(categoryText);
  if (isPrescriptionProduct) return null;

  return {
    availability: text(offer?.availability ?? product.availability),
    brand: typeof product.brand === 'string' ? product.brand : text(product.brand?.name),
    category: farmasietCategory(categoryText),
    chain: 'farmasiet-no',
    code: text(product.sku) || eanText(product.gtin13 ?? product.gtin) || productUrl,
    currency: 'NOK',
    ean: eanText(product.gtin13 ?? product.gtin),
    imageUrl: imageUrl(product.image),
    isPrescriptionProduct,
    name,
    price,
    priceText: `${price.toFixed(2)} NOK`,
    productUrl,
    retrievedAt,
    sourceUrl
  };
}

function farmasietCategory(value: string): FarmasietNoProduct['category'] {
  if (/kosttilskudd|vitamin|mineral|tran|omega/.test(value)) return 'supplement';
  if (/hudpleie|solkrem|beauty|sminke|hår/.test(value)) return 'beauty';
  if (/legemiddel|reseptfri|paracet|ibux|forkjølelse|allergi/.test(value)) return 'otc';
  return 'pharmacy';
}

function extractJsonLd(html: string): unknown[] {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return blocks.flatMap((match) => parseJson(match[1] ?? ''));
}

function extractNextData(html: string): unknown {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  return match ? parseJson(match[1] ?? '') : null;
}

function collectJsonProducts(value: unknown, products: FarmasietNoJsonProduct[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectJsonProducts(entry, products));
    return;
  }

  const record = value as Record<string, unknown>;
  if ((record['@type'] === 'Product' || record.name) && (record.offers || record.gtin || record.gtin13 || record.sku)) {
    products.push(record as FarmasietNoJsonProduct);
  }
  Object.values(record).forEach((entry) => collectJsonProducts(entry, products));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function eanText(value: unknown): string {
  const digits = text(value).replace(/\D/g, '');
  return digits.length >= 8 ? digits : '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
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

function imageUrl(value: unknown): string {
  if (Array.isArray(value)) return absoluteUrl(value[0], FARMASIET_NO_BASE_URL);
  return absoluteUrl(value, FARMASIET_NO_BASE_URL);
}
