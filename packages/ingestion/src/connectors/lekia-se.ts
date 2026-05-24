export type LekiaProductCategory =
  | 'baby'
  | 'book'
  | 'game'
  | 'outdoor'
  | 'school'
  | 'toy'
  | 'other';

export type LekiaProduct = {
  chain: 'lekia-se';
  code: string;
  name: string;
  brand: string;
  category: LekiaProductCategory;
  categories: string[];
  price: number;
  priceCurrency: 'SEK';
  originalPrice: number | null;
  originalPriceCurrency: 'SEK' | '';
  recommendedPrice: number | null;
  recommendedPriceCurrency: 'SEK' | '';
  discountPrice: number | null;
  discountPriceCurrency: 'SEK' | '';
  stockStatus: string;
  inStockQuantity: number | null;
  availableInStoresCount: number | null;
  badgeText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type LekiaRawProduct = {
  articleNumber?: unknown;
  name?: unknown;
  stockStatus?: {
    inStockQuantity?: unknown;
  };
  mediumImages?: LekiaRawImage[];
  largeImages?: LekiaRawImage[];
  price?: {
    unitPriceIncludingVat?: unknown;
    discountPriceIncludingVat?: unknown;
  };
  recommendedPriceIncludingVat?: unknown;
  parents?: {
    nodes?: Array<{ name?: unknown }>;
  };
  fields?: {
    brand?: Array<{ name?: unknown }> | null;
    badge1Text?: Array<{ name?: unknown; value?: unknown }> | null;
    badge1FreeText?: unknown;
    articleStatus?: Array<{ value?: unknown }>;
  };
  storeStockStatus?: {
    availableInStoresCount?: unknown;
  };
  url?: unknown;
  __typename?: unknown;
};

type LekiaRawImage = {
  url?: unknown;
};

export type FetchLekiaProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const LEKIA_SE_BASE_URL = 'https://www.lekia.se';

export const DEFAULT_LEKIA_SE_SOURCE_PATHS = [
  '/',
  '/leksaker',
  '/leksaker/babyleksaker',
  '/leksaker/barnbocker',
  '/leksaker/spel',
  '/leksaker/utelek'
] as const;

export async function fetchLekiaProducts(options: FetchLekiaProductsOptions = {}): Promise<LekiaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LekiaProduct[] = [];
  const seen = new Set<string>();

  for (const sourcePath of options.sourcePaths ?? DEFAULT_LEKIA_SE_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(sourcePath, LEKIA_SE_BASE_URL);
    const response = await fetchImpl(sourceUrl, { headers: htmlHeaders() });
    if (!response.ok) {
      throw new Error(`Lekia request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseLekiaProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) {
      return rows;
    }
  }

  return rows;
}

export function parseLekiaProducts(html: string, sourceUrl: string, retrievedAt: string): LekiaProduct[] {
  return extractLekiaRawProducts(html)
    .map((product) => normalizeLekiaProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is LekiaProduct => product !== null);
}

export function normalizeLekiaProduct(
  product: LekiaRawProduct,
  sourceUrl: string,
  retrievedAt: string
): LekiaProduct | null {
  const code = text(product.articleNumber);
  const name = text(product.name);
  const price = numberFromText(product.price?.unitPriceIncludingVat);
  if (!code || !name || price === null) {
    return null;
  }

  const categories = product.parents?.nodes
    ?.map((node) => text(node.name))
    .filter((category) => category && category !== 'LandingPage') ?? [];
  const discountPrice = numberFromText(product.price?.discountPriceIncludingVat);
  const recommendedPrice = numberFromText(product.recommendedPriceIncludingVat);
  const brand = product.fields?.brand?.map((item) => text(item.name)).find(Boolean) ?? '';
  const badgeText = product.fields?.badge1Text?.map((item) => text(item.name) || text(item.value)).find(Boolean)
    ?? text(product.fields?.badge1FreeText);
  const status = product.fields?.articleStatus?.map((item) => text(item.value)).find(Boolean) ?? '';

  return {
    chain: 'lekia-se',
    code,
    name,
    brand,
    category: lekiaCategory(categories, product.url),
    categories,
    price,
    priceCurrency: 'SEK',
    originalPrice: discountPrice === null ? null : price,
    originalPriceCurrency: discountPrice === null ? '' : 'SEK',
    recommendedPrice,
    recommendedPriceCurrency: recommendedPrice === null ? '' : 'SEK',
    discountPrice,
    discountPriceCurrency: discountPrice === null ? '' : 'SEK',
    stockStatus: status,
    inStockQuantity: numberFromText(product.stockStatus?.inStockQuantity),
    availableInStoresCount: numberFromText(product.storeStockStatus?.availableInStoresCount),
    badgeText,
    productUrl: absoluteUrl(product.url, LEKIA_SE_BASE_URL),
    imageUrl: absoluteUrl(product.mediumImages?.[0]?.url ?? product.largeImages?.[0]?.url, LEKIA_SE_BASE_URL),
    sourceUrl,
    retrievedAt
  };
}

function extractLekiaRawProducts(html: string): LekiaRawProduct[] {
  const products: LekiaRawProduct[] = [];
  let cursor = 0;

  while (cursor < html.length) {
    const marker = html.indexOf('\\"articleNumber\\"', cursor);
    if (marker === -1) {
      break;
    }
    const start = html.lastIndexOf('{\\"id\\"', marker);
    if (start === -1) {
      cursor = marker + 1;
      continue;
    }
    const end = findBalancedObjectEnd(html, start);
    if (end === -1) {
      cursor = marker + 1;
      continue;
    }

    const rawObject = html.slice(start, end).replaceAll('\\"', '"');
    try {
      const product = JSON.parse(rawObject) as LekiaRawProduct;
      if (product.__typename === 'LekiaProductProduct') {
        products.push(product);
      }
    } catch {
      // Ignore non-product RSC fragments with a similar shape.
    }
    cursor = end;
  }

  return products;
}

function findBalancedObjectEnd(value: string, start: number): number {
  let depth = 0;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];
    if (character === '{') {
      depth += 1;
    } else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
  }

  return -1;
}

function lekiaCategory(categories: readonly string[], url: unknown): LekiaProductCategory {
  const haystack = `${categories.join(' ')} ${text(url)}`.toLocaleLowerCase('sv-SE');
  if (haystack.includes('baby')) {
    return 'baby';
  }
  if (haystack.includes('bok') || haystack.includes('böcker')) {
    return 'book';
  }
  if (haystack.includes('spel') || haystack.includes('pussel')) {
    return 'game';
  }
  if (haystack.includes('utelek') || haystack.includes('sport')) {
    return 'outdoor';
  }
  if (haystack.includes('skola') || haystack.includes('skriva') || haystack.includes('rita')) {
    return 'school';
  }
  if (haystack.includes('leksaker')) {
    return 'toy';
  }
  return 'other';
}

function addRows(
  rows: LekiaProduct[],
  seen: Set<string>,
  products: readonly LekiaProduct[],
  maxRows: number | undefined
) {
  for (const product of products) {
    if (seen.has(product.code)) {
      continue;
    }
    seen.add(product.code);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) {
      return;
    }
  }
}

function htmlHeaders(): HeadersInit {
  return {
    accept: 'text/html,application/xhtml+xml',
    'accept-language': 'sv-SE,sv;q=0.9,en;q=0.7',
    'user-agent': 'GroceryView/0.1'
  };
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const path = text(value);
  if (!path) {
    return '';
  }
  return new URL(path, baseUrl).toString();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = Number(value.replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
