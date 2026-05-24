export const LIFE_SE_BASE_URL = 'https://www.life.se';
export const LIFE_SE_CONNECTOR_VERSION = 'life-se-health-food-v1';

export type LifeSeProduct = {
  chain: 'life-se';
  market: 'SE';
  category: 'health_food';
  code: string;
  ean: string;
  name: string;
  brand: string;
  price: number;
  priceText: string;
  originalPrice: number | null;
  productUrl: string;
  imageUrl: string;
  stockStatus: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'life_se';
    parserVersion: string;
    nationalStoreFootprint: '~100 SE stores';
  };
};

type LifeRawProduct = Record<string, unknown>;

type FetchLifeSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

export const DEFAULT_LIFE_SE_SOURCE_PATHS = [
  '/halsa',
  '/vitaminer-mineraler',
  '/traning',
  '/hudvard',
  '/kosttillskott'
] as const;

export const lifeSeTestFixture = {
  products: [{
    id: 'life-omega-3',
    ean: '7350000000012',
    name: 'Omega-3 Forte',
    brand: 'Life',
    price: '129 kr',
    originalPrice: '159 kr',
    url: '/produkt/omega-3-forte',
    image: { url: '/images/omega-3.png' },
    stockStatus: 'in_stock'
  }]
};

export async function fetchLifeSeProducts(options: FetchLifeSeProductsOptions = {}): Promise<LifeSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LifeSeProduct[] = [];
  const seen = new Set<string>();

  for (const path of options.sourcePaths ?? DEFAULT_LIFE_SE_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(path, LIFE_SE_BASE_URL);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView life-se connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Life.se request failed for ${sourceUrl}: ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('json') ? await response.json() : extractStructuredData(await response.text());
    for (const row of parseLifeSeProducts(payload, sourceUrl, retrievedAt)) {
      const key = row.ean || row.code || row.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseLifeSeProducts(payload: unknown, sourceUrl: string, retrievedAt: string): LifeSeProduct[] {
  const products: LifeRawProduct[] = [];
  visit(payload, (value) => {
    const candidate = value as LifeRawProduct;
    if ((candidate.name || candidate.title) && (candidate.price || candidate.currentPrice || candidate.salesPrice)) {
      products.push(candidate);
    }
  });

  return products
    .map((product) => normalizeLifeSeProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is LifeSeProduct => product !== null);
}

export function normalizeLifeSeProduct(product: LifeRawProduct, sourceUrl: string, retrievedAt: string): LifeSeProduct | null {
  const name = text(product.name) || text(product.title);
  const price = numberFromText(product.price) ?? numberFromText(product.currentPrice) ?? numberFromText(product.salesPrice);
  if (!name || price === null) return null;

  const nestedImage = isRecord(product.image) ? text(product.image.url) : '';
  return {
    chain: 'life-se',
    market: 'SE',
    category: 'health_food',
    code: text(product.id) || text(product.sku) || stableCode(name),
    ean: digits(text(product.ean) || text(product.gtin) || text(product.barcode)),
    name,
    brand: text(product.brand) || text(product.manufacturer) || 'Life',
    price,
    priceText: `${price.toFixed(2)} SEK`,
    originalPrice: numberFromText(product.originalPrice) ?? numberFromText(product.compareAtPrice),
    productUrl: absoluteUrl(text(product.url) || text(product.productUrl), LIFE_SE_BASE_URL),
    imageUrl: absoluteUrl(text(product.imageUrl) || nestedImage, LIFE_SE_BASE_URL),
    stockStatus: text(product.stockStatus) || text(product.availability),
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'life_se',
      parserVersion: LIFE_SE_CONNECTOR_VERSION,
      nationalStoreFootprint: '~100 SE stores'
    }
  };
}

function extractStructuredData(html: string): unknown {
  const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (nextData) return safeJson(nextData[1]);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (jsonLd) return safeJson(jsonLd[1]);
  return {};
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function visit(value: unknown, visitor: (value: unknown) => void) {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
  } else if (isRecord(value)) {
    for (const item of Object.values(value)) visit(item, visitor);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function digits(value: string): string {
  return value.replace(/\D/g, '');
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

function stableCode(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
