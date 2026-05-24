export type MatsparProduct = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  countryFrom: string;
  price: number;
  priceText: string;
  medianPrice: number | null;
  warehousePriceCount: number;
  sourceUrl: string;
  productUrl: string;
  imageHash: string;
  retrievedAt: string;
};

type MatsparPageData = {
  payload?: {
    products?: MatsparPageProduct[];
  };
};

type MatsparPageProduct = {
  productid?: unknown;
  id?: unknown;
  name?: unknown;
  brand?: unknown;
  image?: unknown;
  weight_pretty?: unknown;
  country_from?: unknown;
  slug?: unknown;
  price?: unknown;
  median_price?: unknown;
  w_prices?: Record<string, unknown>;
};

export const MATSPAR_SEARCH_BASE_URL = 'https://www.matspar.se/kategori';

export const DEFAULT_MATSPAR_SEARCH_QUERIES = [
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
  'juice',
  'flingor',
  'mjol',
  'olja',
  'tomat',
  'fisk',
  'kottfars',
  'korv',
  'glass',
  'choklad',
  'frukt',
  'gronsaker',
  'godis',
  'soppa',
  'tacos',
  'broccoli',
  'blomkal',
  'morot',
  'lok',
  'paprika',
  'gurka',
  'apple',
  'apelsin',
  'paron',
  'vindruvor',
  'lax',
  'rakor',
  'tonfisk',
  'bacon',
  'skinka',
  'gradde',
  'creme fraiche',
  'kvarg',
  'keso',
  'knackebrod',
  'tortilla',
  'majonnas',
  'senap',
  'sylt',
  'honung',
  'notter',
  'mandel',
  'tvattmedel',
  'diskmedel',
  'nudlar',
  'falukorv',
  'havredryck',
  'filmjolk',
  'leverpastej',
  'kaviar',
  'sill',
  'bulgur',
  'couscous',
  'linser',
  'bonor'
] as const;
export const DEFAULT_MATSPAR_SEARCH_PAGES = [1, 2, 3] as const;
export const DEFAULT_MATSPAR_MAX_ROWS = 7500;

export type FetchMatsparProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  pages?: readonly number[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildMatsparSearchUrl(query: string, page = 1): string {
  const url = new URL(MATSPAR_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  if (page > 1) url.searchParams.set('page', String(page));
  return url.toString();
}

export async function fetchMatsparProducts(options: FetchMatsparProductsOptions = {}): Promise<MatsparProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_MATSPAR_SEARCH_QUERIES;
  const pages = options.pages ?? DEFAULT_MATSPAR_SEARCH_PAGES;
  const maxRows = options.maxRows ?? DEFAULT_MATSPAR_MAX_ROWS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MatsparProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    for (const page of pages) {
      const sourceUrl = buildMatsparSearchUrl(query, page);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'text/html,application/xhtml+xml',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!response.ok) {
        throw new Error(`Matspar search request failed for ${query} page ${page}: ${response.status}`);
      }

      for (const product of parseMatsparPageProducts(await response.text())) {
        const row = normalizeMatsparProduct(product, sourceUrl, retrievedAt);
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
  }

  return rows;
}

export function parseMatsparPageProducts(html: string): MatsparPageProduct[] {
  const match = html.match(/window\.__PAGEDATA__ = JSON\.parse\("([\s\S]*?)"\);/);
  if (!match) {
    throw new Error('Matspar page did not include __PAGEDATA__');
  }
  const jsonText = JSON.parse(`"${match[1]}"`) as string;
  const pageData = JSON.parse(jsonText) as MatsparPageData;
  return pageData.payload?.products ?? [];
}

export function normalizeMatsparProduct(
  product: MatsparPageProduct,
  sourceUrl: string,
  retrievedAt: string
): MatsparProduct | null {
  const code = text(product.productid ?? product.id);
  const name = text(product.name);
  const price = oreToSek(product.price);
  if (!code || !name || price === null) {
    return null;
  }

  const medianPrice = oreToSek(product.median_price);
  return {
    code,
    name,
    brand: text(product.brand),
    packageText: text(product.weight_pretty),
    countryFrom: text(product.country_from),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    medianPrice,
    warehousePriceCount: product.w_prices && typeof product.w_prices === 'object' ? Object.keys(product.w_prices).length : 0,
    sourceUrl,
    productUrl: buildMatsparProductUrl(product.slug),
    imageHash: text(product.image),
    retrievedAt
  };
}

function buildMatsparProductUrl(slug: unknown): string {
  const slugText = text(slug);
  return slugText ? new URL(`/${slugText}`, 'https://www.matspar.se').toString() : '';
}

function oreToSek(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(text(value));
  return Number.isFinite(numeric) ? numeric / 100 : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
