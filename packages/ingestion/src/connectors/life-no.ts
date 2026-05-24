export type LifeNoProduct = {
  availability: string;
  brand: string;
  category: 'health_food' | 'supplement' | 'beauty' | 'wellness';
  chain: 'life-no';
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
  unitPriceText: string;
};

type LifeNoJsonProduct = {
  availability?: unknown;
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  id?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  price?: unknown;
  priceText?: unknown;
  title?: unknown;
  unitPrice?: unknown;
  unitPriceText?: unknown;
  url?: unknown;
};

export type FetchLifeNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const LIFE_NO_BASE_URL = 'https://www.life.no';
export const DEFAULT_LIFE_NO_SOURCE_URLS = [
  'https://www.life.no/sok?q=vitamin',
  'https://www.life.no/sok?q=omega',
  'https://www.life.no/sok?q=protein',
  'https://www.life.no/kosttilskudd',
  'https://www.life.no/naturlig-hudpleie'
] as const;

export async function fetchLifeNoProducts(options: FetchLifeNoProductsOptions = {}): Promise<LifeNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LifeNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_LIFE_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 health-food-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Life NO request failed for ${sourceUrl}: ${response.status}`);

    for (const product of parseLifeNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = product.code || product.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseLifeNoProducts(html: string, sourceUrl: string, retrievedAt: string): LifeNoProduct[] {
  const products: LifeNoJsonProduct[] = [];
  collectProducts(extractNextData(html), products);
  for (const json of extractJsonLd(html)) collectProducts(json, products);
  collectProductsFromHtml(html, products);

  return products
    .map((product) => normalizeLifeNoProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is LifeNoProduct => product !== null);
}

export function normalizeLifeNoProduct(product: LifeNoJsonProduct, sourceUrl: string, retrievedAt: string): LifeNoProduct | null {
  const name = text(product.name ?? product.title);
  const price = numberFromText(product.price ?? product.priceText);
  const priceText = text(product.priceText ?? product.price);
  if (!name || price === null) return null;

  const categoryText = `${text(product.category)} ${text(product.description)} ${sourceUrl}`.toLowerCase();

  return {
    availability: text(product.availability),
    brand: text(product.brand),
    category: lifeCategory(categoryText),
    chain: 'life-no',
    code: text(product.id) || slugify(`${name}-${priceText || price}`),
    country: 'NO',
    currency: 'NOK',
    imageUrl: absoluteUrl(product.imageUrl ?? product.image, LIFE_NO_BASE_URL),
    name,
    price,
    priceText: priceText || `${price.toFixed(2)} NOK`,
    productUrl: absoluteUrl(product.url, LIFE_NO_BASE_URL) || sourceUrl,
    retrievedAt,
    sourceUrl,
    unitPriceText: text(product.unitPriceText ?? product.unitPrice)
  };
}

function lifeCategory(value: string): LifeNoProduct['category'] {
  if (/kosttilskudd|vitamin|mineral|omega|protein|tran/.test(value)) return 'supplement';
  if (/hudpleie|beauty|hår|hair|skin/.test(value)) return 'beauty';
  if (/helsekost|mat|food|te|snack/.test(value)) return 'health_food';
  return 'wellness';
}

function extractNextData(html: string): unknown {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  return match ? parseJson(match[1] ?? '') : null;
}

function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => parseJson(match[1] ?? ''));
}

function collectProducts(value: unknown, products: LifeNoJsonProduct[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectProducts(entry, products));
    return;
  }
  const record = value as Record<string, unknown>;
  if ((record.name || record.title) && (record.price || record.priceText)) products.push(record as LifeNoJsonProduct);
  Object.values(record).forEach((entry) => collectProducts(entry, products));
}

function collectProductsFromHtml(html: string, products: LifeNoJsonProduct[]) {
  const pageText = decodeHtmlText(html);
  const pattern = /([A-ZÆØÅa-zæøå0-9][^.;:]{2,90}?)\s+(\d{1,4}[,.]\d{0,2})\s*(?:kr|,-)/g;
  for (const match of pageText.matchAll(pattern)) {
    products.push({ name: match[1]?.trim(), priceText: match[2] });
  }
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
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'life-no-product';
}
