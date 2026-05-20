import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { createGunzip } from 'node:zlib';

export type OpenFoodFactsProduct = {
  code: string;
  name: string;
  brands: string;
  quantity: string;
  categories: string[];
  labels: string[];
  nutriscoreGrade: string;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type OpenFoodFactsApiProduct = {
  code?: unknown;
  product_name?: unknown;
  product_name_sv?: unknown;
  brands?: unknown;
  quantity?: unknown;
  categories_tags?: unknown;
  labels_tags?: unknown;
  nutriscore_grade?: unknown;
  image_front_url?: unknown;
  url?: unknown;
};

type OpenFoodFactsApiResponse = {
  status?: unknown;
  product?: OpenFoodFactsApiProduct;
};

export const OPENFOODFACTS_FIELDS = [
  'code',
  'product_name',
  'product_name_sv',
  'brands',
  'quantity',
  'categories_tags',
  'labels_tags',
  'nutriscore_grade',
  'image_front_url',
  'url'
] as const;

export const OPENFOODFACTS_EXPORT_URL = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';

export const DEFAULT_OPENFOODFACTS_CODES = [
  '7340083494406',
  '7340083492464',
  '7340083480638',
  '7340083492358',
  '7331217012993',
  '8714100083352',
  '7391737003000',
  '7311590002262',
  '7340083450617',
  '7311043014033',
  '7340083463471',
  '7311041058572',
  '7311041003398',
  '7340083479885',
  '7340083459436',
  '7311043007837',
  '7350113940414',
  '7311041052624',
  '7311043023837',
  '0089686170269',
  '7350126087274',
  '7311041053508',
  '7340083469077',
  '7340083456343',
  '7314320041036',
  '8711327484849',
  '7391737003710',
  '7340083464980',
  '7350113940001',
  '7330242240029',
  '4056489767930',
  '7311041052327',
  '8606103381842',
  '7391737003383',
  '7611612142182',
  '7350113940056',
  '7340083466861',
  '7311043008841',
  '7340083442605',
  '4005900370525',
  '7350116923681',
  '7311043018734',
  '6431901820321',
  '7330242260188',
  '6431901840787',
  '7315061730197',
  '7330242240012',
  '7311312007100',
  '7311312007117',
  '7311070008708',
  '7340083479434',
  '8721201908590',
  '7611612142205',
  '7310130012044',
  '7340083490774',
  '7311070330090',
  '7311043007677',
  '6416453043800',
  '7311070001952',
  '7311043014132'
] as const;

export type FetchOpenFoodFactsProductsOptions = {
  codes?: readonly string[];
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
};

export type FetchOpenFoodFactsExportProductsOptions = {
  codes?: readonly string[];
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
};

export function buildOpenFoodFactsProductUrl(code: string): string {
  const fields = OPENFOODFACTS_FIELDS.join(',');
  return `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${encodeURIComponent(fields)}`;
}

export async function fetchOpenFoodFactsProducts(options: FetchOpenFoodFactsProductsOptions = {}): Promise<OpenFoodFactsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: OpenFoodFactsProduct[] = [];

  for (const code of options.codes ?? DEFAULT_OPENFOODFACTS_CODES) {
    const sourceUrl = buildOpenFoodFactsProductUrl(code);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenFoodFacts request failed for ${code}: ${response.status}`);
    }

    const payload = await response.json() as OpenFoodFactsApiResponse;
    const product = payload.product;
    if (payload.status !== 1 || !product) {
      continue;
    }

    const row = normalizeOpenFoodFactsProduct(product, sourceUrl, retrievedAt);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}

export async function fetchOpenFoodFactsExportProducts(options: FetchOpenFoodFactsExportProductsOptions = {}): Promise<OpenFoodFactsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(OPENFOODFACTS_EXPORT_URL, {
    headers: {
      accept: 'application/gzip, text/tab-separated-values',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`OpenFoodFacts export request failed: ${response.status}`);
  }
  if (!response.body) {
    throw new Error('OpenFoodFacts export response did not include a body');
  }

  const wantedCodes = options.codes ? new Set(options.codes) : null;
  const maxRows = options.maxRows ?? 50;
  const rows: OpenFoodFactsProduct[] = [];
  let headers: string[] | null = null;

  const stream = Readable.fromWeb(response.body as unknown as NodeReadableStream<Uint8Array>).pipe(createGunzip());
  const lines = createInterface({ input: stream, crlfDelay: Infinity });

  try {
    for await (const line of lines) {
      if (!headers) {
        headers = parseTsvLine(line);
        continue;
      }

      const fields = parseTsvLine(line);
      const record = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? '']));
      if (wantedCodes && !wantedCodes.has(record.code)) {
        continue;
      }

      const row = normalizeOpenFoodFactsExportRecord(record, retrievedAt);
      if (row) {
        rows.push(row);
      }
      if (rows.length >= maxRows) {
        lines.close();
        stream.destroy();
        break;
      }
    }
  } finally {
    lines.close();
    stream.destroy();
  }

  return rows;
}

export function normalizeOpenFoodFactsProduct(
  product: OpenFoodFactsApiProduct,
  sourceUrl: string,
  retrievedAt: string
): OpenFoodFactsProduct | null {
  const code = asText(product.code);
  const name = asText(product.product_name_sv) || asText(product.product_name);
  if (!code || !name) {
    return null;
  }

  return {
    code,
    name,
    brands: asText(product.brands),
    quantity: asText(product.quantity),
    categories: asTextArray(product.categories_tags),
    labels: asTextArray(product.labels_tags),
    nutriscoreGrade: asText(product.nutriscore_grade) || 'unknown',
    imageUrl: asText(product.image_front_url),
    productUrl: asText(product.url) || `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
    sourceUrl,
    retrievedAt
  };
}

export function normalizeOpenFoodFactsExportRecord(
  record: Record<string, string>,
  retrievedAt: string
): OpenFoodFactsProduct | null {
  const code = asText(record.code);
  const name = asText(record.product_name);
  if (!code || !name) {
    return null;
  }

  return {
    code,
    name,
    brands: asText(record.brands),
    quantity: asText(record.quantity),
    categories: splitTags(record.categories_tags),
    labels: splitTags(record.labels_tags),
    nutriscoreGrade: asText(record.nutriscore_grade) || 'unknown',
    imageUrl: asText(record.image_url),
    productUrl: asText(record.url) || `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
    sourceUrl: `${OPENFOODFACTS_EXPORT_URL}#code=${encodeURIComponent(code)}`,
    retrievedAt
  };
}

function parseTsvLine(line: string): string[] {
  return line.split('\t');
}

function splitTags(value: unknown): string[] {
  const text = asText(value);
  return text ? text.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asTextArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}
