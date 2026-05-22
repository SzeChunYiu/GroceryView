export type MathemProduct = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  price: number;
  priceText: string;
  unitPrice: number | null;
  unitPriceText: string;
  unitPriceUnit: string;
  imageUrl: string;
  productUrl: string;
  available: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

type MathemSearchProduct = {
  id?: unknown;
  type?: unknown;
  attributes?: {
    id?: unknown;
    fullName?: unknown;
    brand?: unknown;
    name?: unknown;
    nameExtra?: unknown;
    frontUrl?: unknown;
    absoluteUrl?: unknown;
    grossPrice?: unknown;
    grossUnitPrice?: unknown;
    unitPriceQuantityAbbreviation?: unknown;
    currency?: unknown;
    availability?: { isAvailable?: unknown };
    images?: Array<{ thumbnail?: { url?: unknown }; large?: { url?: unknown } }>;
  };
};

export const MATHEM_SEARCH_BASE_URL = 'https://www.mathem.se/se/search/products/';

export const DEFAULT_MATHEM_SEARCH_QUERIES = [
  'makaroner',
  'mjolk',
  'kaffe',
  'ris',
  'pasta',
  'yoghurt',
  'brod',
  'ost',
  'agg',
  'smor',
  'potatis',
  'banan',
  'kyckling',
  'ketchup',
  'havregryn',
  'lax',
  'notfars',
  'flask',
  'tomat',
  'gurka',
  'apelsin',
  'apple',
  'choklad',
  'chips',
  'juice',
  'cola',
  'te',
  'mjol',
  'socker',
  'olja',
  'glass',
  'blabar',
  'jordgubbar',
  'korv',
  'falukorv',
  'fisk',
  'rakor',
  'morot',
  'lok',
  'vitlok'
] as const;
export const DEFAULT_MATHEM_MAX_ROWS = 1600;

export type FetchMathemProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildMathemSearchUrl(query: string): string {
  const url = new URL(MATHEM_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchMathemProducts(options: FetchMathemProductsOptions = {}): Promise<MathemProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_MATHEM_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? DEFAULT_MATHEM_MAX_ROWS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MathemProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildMathemSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`Mathem search request failed for ${query}: ${response.status}`);
    }

    for (const product of parseMathemSearchProducts(await response.text())) {
      const row = normalizeMathemProduct(product, sourceUrl, retrievedAt);
      if (!row || seenCodes.has(row.code)) {
        continue;
      }
      seenCodes.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export function parseMathemSearchProducts(html: string): MathemSearchProduct[] {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error('Mathem search page did not include __NEXT_DATA__');
  }

  const data = JSON.parse(match[1]) as unknown;
  const products: MathemSearchProduct[] = [];
  visit(data, products);
  return products;
}

export function normalizeMathemProduct(
  product: MathemSearchProduct,
  sourceUrl: string,
  retrievedAt: string
): MathemProduct | null {
  const attributes = product.attributes;
  const code = text(attributes?.id ?? product.id);
  const price = numberFromText(attributes?.grossPrice);
  const name = text(attributes?.fullName) || text(attributes?.name);
  if (product.type !== 'product' || !attributes || !code || !name || price === null) {
    return null;
  }

  const unitPrice = numberFromText(attributes.grossUnitPrice);
  const unit = text(attributes.unitPriceQuantityAbbreviation);
  return {
    code,
    name,
    brand: text(attributes.brand),
    packageText: text(attributes.nameExtra),
    price,
    priceText: `${price.toFixed(2)} ${text(attributes.currency) || 'SEK'}`,
    unitPrice,
    unitPriceText: unitPrice === null ? '' : `${unitPrice.toFixed(2)} ${text(attributes.currency) || 'SEK'}`,
    unitPriceUnit: unit,
    imageUrl: text(attributes.images?.[0]?.thumbnail?.url) || text(attributes.images?.[0]?.large?.url),
    productUrl: absoluteMathemUrl(attributes.frontUrl ?? attributes.absoluteUrl),
    available: attributes.availability?.isAvailable === true,
    sourceUrl,
    retrievedAt
  };
}

function visit(value: unknown, products: MathemSearchProduct[]): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  if ((value as MathemSearchProduct).type === 'product' && (value as MathemSearchProduct).attributes) {
    products.push(value as MathemSearchProduct);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      visit(item, products);
    }
    return;
  }
  for (const item of Object.values(value)) {
    visit(item, products);
  }
}

function absoluteMathemUrl(value: unknown): string {
  const url = text(value);
  if (!url) {
    return '';
  }
  return url.startsWith('https://') ? url : new URL(url, 'https://www.mathem.se').toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberFromText(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(text(value));
  return Number.isFinite(parsed) ? parsed : null;
}
