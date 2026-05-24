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
  allergens?: string[];
  traces?: string[];
  additives?: string[];
  countries?: string[];
  stores?: string[];
  origins?: string[];
  manufacturingPlaces?: string[];
  packaging?: string[];
  ingredientsText?: string;
  servingSize?: string;
  nutriscoreGrade: string;
  novaGroup?: number | null;
  ecoscoreGrade?: string;
  dataQualityTags?: string[];
  nutritionPer100g: OpenFoodFactsNutritionPer100g;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type OpenFoodFactsNutritionPer100g = {
  energyKj: number | null;
  energyKcal: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
  sodium: number | null;
};

export type OpenFoodFactsRetailerProductCandidate = {
  chain: 'citygross' | 'willys' | 'hemkop' | 'coop' | 'ica' | 'mathem' | 'matspar';
  productCode: string;
  name: string;
  brand: string;
  packageText: string;
  barcode?: string;
  imageUrl?: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type OpenFoodFactsRetailerEnrichment = Omit<OpenFoodFactsProduct, 'code'> & {
  barcode: string;
  retailerMatches: OpenFoodFactsRetailerProductCandidate[];
};

type OpenFoodFactsApiProduct = {
  code?: unknown;
  product_name?: unknown;
  product_name_sv?: unknown;
  brands?: unknown;
  quantity?: unknown;
  categories_tags?: unknown;
  labels_tags?: unknown;
  allergens_tags?: unknown;
  traces_tags?: unknown;
  additives_tags?: unknown;
  countries_tags?: unknown;
  stores?: unknown;
  origins_tags?: unknown;
  manufacturing_places_tags?: unknown;
  packaging_tags?: unknown;
  ingredients_text?: unknown;
  ingredients_text_sv?: unknown;
  serving_size?: unknown;
  nutriscore_grade?: unknown;
  nova_group?: unknown;
  ecoscore_grade?: unknown;
  environmental_score_grade?: unknown;
  data_quality_tags?: unknown;
  nutriments?: unknown;
  image_front_url?: unknown;
  url?: unknown;
};

type OpenFoodFactsApiResponse = {
  status?: unknown;
  product?: OpenFoodFactsApiProduct;
};

type OpenFoodFactsSearchResponse = {
  count?: unknown;
  page?: unknown;
  page_count?: unknown;
  page_size?: unknown;
  products?: OpenFoodFactsApiProduct[];
};

export type OpenFoodFactsCatalogPageEvent = {
  page: number;
  products: number;
  rows: number;
  skipped: boolean;
  totalPages: number;
};

export const OPENFOODFACTS_FIELDS = [
  'code',
  'product_name',
  'product_name_sv',
  'brands',
  'quantity',
  'categories_tags',
  'labels_tags',
  'allergens_tags',
  'traces_tags',
  'additives_tags',
  'countries_tags',
  'stores',
  'origins_tags',
  'manufacturing_places_tags',
  'packaging_tags',
  'ingredients_text',
  'ingredients_text_sv',
  'serving_size',
  'nutriscore_grade',
  'nova_group',
  'ecoscore_grade',
  'environmental_score_grade',
  'data_quality_tags',
  'nutriments',
  'image_front_url',
  'url'
] as const;

export const OPENFOODFACTS_EXPORT_URL = 'https://world.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';
export const DEFAULT_OPENFOODFACTS_SWEDEN_CATALOG_MAX_PAGES = 12;

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

export type FetchOpenFoodFactsSwedenCatalogOptions = {
  concurrency?: number;
  fetchImpl?: typeof fetch;
  maxPages?: number;
  maxRows?: number;
  onPage?: (event: OpenFoodFactsCatalogPageEvent) => void;
  pageDelayMs?: number;
  pageSize?: number;
  requestRetryAttempts?: number;
  requestRetryBaseDelayMs?: number;
  retrievedAt?: string;
  skipFailedPages?: boolean;
};

export type FetchOpenFoodFactsRetailerEnrichmentsOptions = {
  candidates: readonly OpenFoodFactsRetailerProductCandidate[];
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
};

export type FetchOpenFoodFactsExportRetailerEnrichmentsOptions = {
  candidates: readonly OpenFoodFactsRetailerProductCandidate[];
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
};

export function buildOpenFoodFactsProductUrl(code: string): string {
  const fields = OPENFOODFACTS_FIELDS.join(',');
  return `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${encodeURIComponent(fields)}`;
}

export function buildOpenFoodFactsSwedenSearchUrl(page = 1, pageSize = 100): string {
  const url = new URL('https://world.openfoodfacts.org/api/v2/search');
  url.searchParams.set('countries_tags', 'sweden');
  url.searchParams.set('fields', OPENFOODFACTS_FIELDS.join(','));
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('page', String(page));
  return url.toString();
}


export async function fetchOpenFoodFactsSwedenCatalog(options: FetchOpenFoodFactsSwedenCatalogOptions = {}): Promise<OpenFoodFactsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 1));
  const pageDelayMs = options.pageDelayMs ?? 0;
  const pageSize = options.pageSize ?? 100;
  const requestRetryAttempts = options.requestRetryAttempts ?? 6;
  const requestRetryBaseDelayMs = options.requestRetryBaseDelayMs ?? 1500;
  const skipFailedPages = options.skipFailedPages ?? false;
  const onPage = options.onPage;
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;
  const rows: OpenFoodFactsProduct[] = [];
  const seenCodes = new Set<string>();
  let totalPages = Number.POSITIVE_INFINITY;

  const fetchPage = async (page: number): Promise<{ page: number; payload: OpenFoodFactsSearchResponse; sourceUrl: string } | null> => {
    const sourceUrl = buildOpenFoodFactsSwedenSearchUrl(page, pageSize);
    try {
      const payload = await fetchOpenFoodFactsSearchPage(fetchImpl, sourceUrl, page, {
        retryAttempts: requestRetryAttempts,
        retryBaseDelayMs: requestRetryBaseDelayMs
      });
      return { page, payload, sourceUrl };
    } catch (error) {
      if (!skipFailedPages) {
        throw error;
      }
      onPage?.({ page, products: 0, rows: rows.length, skipped: true, totalPages });
      return null;
    }
  };

  const appendPageRows = (page: number, payload: OpenFoodFactsSearchResponse, sourceUrl: string): number => {
    const products = Array.isArray(payload.products) ? payload.products : [];
    const reportedCount = numberOrNull(payload.count);
    const reportedPageSize = numberOrNull(payload.page_size) ?? pageSize;
    if (reportedCount !== null && reportedPageSize > 0) {
      totalPages = Math.max(1, Math.ceil(reportedCount / reportedPageSize));
    } else if (products.length < pageSize) {
      totalPages = page;
    }
    if (products.length === 0) {
      return 0;
    }

    for (const product of products) {
      const row = normalizeOpenFoodFactsProduct(product, sourceUrl, retrievedAt);
      if (!row || seenCodes.has(row.code)) {
        continue;
      }
      rows.push(row);
      seenCodes.add(row.code);
      if (rows.length >= maxRows) {
        break;
      }
    }
    onPage?.({ page, products: products.length, rows: rows.length, skipped: false, totalPages });
    return products.length;
  };

  const firstPage = await fetchPage(1);
  if (!firstPage) {
    return rows;
  }
  if (appendPageRows(firstPage.page, firstPage.payload, firstPage.sourceUrl) === 0) {
    return rows;
  }

  let nextPage = 2;
  while (nextPage <= totalPages && nextPage <= maxPages && rows.length < maxRows) {
    const batchPages: number[] = [];
    while (batchPages.length < concurrency && nextPage <= totalPages && nextPage <= maxPages && rows.length < maxRows) {
      batchPages.push(nextPage);
      nextPage += 1;
    }

    const batchResults = await Promise.all(batchPages.map((page) => fetchPage(page)));
    for (const result of batchResults) {
      if (!result) {
        continue;
      }
      appendPageRows(result.page, result.payload, result.sourceUrl);
      if (rows.length >= maxRows) {
        break;
      }
    }

    if (pageDelayMs > 0 && nextPage <= totalPages && nextPage <= maxPages && rows.length < maxRows) {
      await sleep(pageDelayMs);
    }
  }

  return rows;
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
  const maxRows = options.maxRows ?? 75;
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

export async function fetchOpenFoodFactsExportRetailerEnrichments(
  options: FetchOpenFoodFactsExportRetailerEnrichmentsOptions
): Promise<OpenFoodFactsRetailerEnrichment[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const candidatesByBarcode = groupOpenFoodFactsCandidatesByBarcode(options.candidates);
  const maxRows = options.maxRows ?? candidatesByBarcode.size;
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

  const rows: OpenFoodFactsRetailerEnrichment[] = [];
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
      const candidates = candidatesByBarcode.get(record.code);
      if (!candidates) {
        continue;
      }

      const row = normalizeOpenFoodFactsExportRecord(record, retrievedAt);
      if (!row || !hasOpenFoodFactsNutrition(row.nutritionPer100g)) {
        continue;
      }

      rows.push({
        barcode: row.code,
        name: row.name,
        brands: row.brands,
        quantity: row.quantity,
        categories: row.categories,
        labels: row.labels,
        allergens: row.allergens,
        traces: row.traces,
        additives: row.additives,
        countries: row.countries,
        stores: row.stores,
        origins: row.origins,
        manufacturingPlaces: row.manufacturingPlaces,
        packaging: row.packaging,
        ingredientsText: row.ingredientsText,
        servingSize: row.servingSize,
        nutriscoreGrade: row.nutriscoreGrade,
        novaGroup: row.novaGroup,
        ecoscoreGrade: row.ecoscoreGrade,
        dataQualityTags: row.dataQualityTags,
        nutritionPer100g: row.nutritionPer100g,
        imageUrl: row.imageUrl,
        productUrl: row.productUrl,
        sourceUrl: row.sourceUrl,
        retrievedAt: row.retrievedAt,
        retailerMatches: candidates
      });

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

export async function fetchOpenFoodFactsRetailerEnrichments(
  options: FetchOpenFoodFactsRetailerEnrichmentsOptions
): Promise<OpenFoodFactsRetailerEnrichment[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRows = options.maxRows ?? 75;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const candidatesByBarcode = groupOpenFoodFactsCandidatesByBarcode(options.candidates);
  const rows: OpenFoodFactsRetailerEnrichment[] = [];

  for (const [barcode, candidates] of candidatesByBarcode) {
    const sourceUrl = buildOpenFoodFactsProductUrl(barcode);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (response.status === 404) {
      continue;
    }
    if (!response.ok) {
      throw new Error(`OpenFoodFacts enrichment request failed for ${barcode}: ${response.status}`);
    }

    const payload = await response.json() as OpenFoodFactsApiResponse;
    const product = payload.product;
    if (payload.status !== 1 || !product) {
      continue;
    }

    const row = normalizeOpenFoodFactsProduct(product, sourceUrl, retrievedAt);
    if (!row || !hasOpenFoodFactsNutrition(row.nutritionPer100g)) {
      continue;
    }

    rows.push({
      barcode: row.code,
      name: row.name,
      brands: row.brands,
      quantity: row.quantity,
      categories: row.categories,
      labels: row.labels,
      allergens: row.allergens,
      traces: row.traces,
      additives: row.additives,
      countries: row.countries,
      stores: row.stores,
      origins: row.origins,
      manufacturingPlaces: row.manufacturingPlaces,
      packaging: row.packaging,
      ingredientsText: row.ingredientsText,
      servingSize: row.servingSize,
      nutriscoreGrade: row.nutriscoreGrade,
      novaGroup: row.novaGroup,
      ecoscoreGrade: row.ecoscoreGrade,
      dataQualityTags: row.dataQualityTags,
      nutritionPer100g: row.nutritionPer100g,
      imageUrl: row.imageUrl,
      productUrl: row.productUrl,
      sourceUrl: row.sourceUrl,
      retrievedAt: row.retrievedAt,
      retailerMatches: candidates
    });

    if (rows.length >= maxRows) {
      break;
    }
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
    allergens: asTextArray(product.allergens_tags),
    traces: asTextArray(product.traces_tags),
    additives: asTextArray(product.additives_tags),
    countries: asTextArray(product.countries_tags),
    stores: splitTextList(product.stores),
    origins: asTextArray(product.origins_tags),
    manufacturingPlaces: asTextArray(product.manufacturing_places_tags),
    packaging: asTextArray(product.packaging_tags),
    ingredientsText: asText(product.ingredients_text_sv) || asText(product.ingredients_text),
    servingSize: asText(product.serving_size),
    nutriscoreGrade: asText(product.nutriscore_grade) || 'unknown',
    novaGroup: numberOrNull(product.nova_group),
    ecoscoreGrade: asText(product.ecoscore_grade) || asText(product.environmental_score_grade) || 'unknown',
    dataQualityTags: asTextArray(product.data_quality_tags),
    nutritionPer100g: normalizeOpenFoodFactsNutrition(product.nutriments),
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
  const name = asText(record.product_name) || asText(record.abbreviated_product_name) || asText(record.generic_name);
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
    allergens: splitTags(record.allergens_tags),
    traces: splitTags(record.traces_tags),
    additives: splitTags(record.additives_tags),
    countries: splitTags(record.countries_tags),
    stores: splitTextList(record.stores),
    origins: splitTags(record.origins_tags),
    manufacturingPlaces: splitTags(record.manufacturing_places_tags),
    packaging: splitTags(record.packaging_tags),
    ingredientsText: asText(record.ingredients_text),
    servingSize: asText(record.serving_size),
    nutriscoreGrade: asText(record.nutriscore_grade) || 'unknown',
    novaGroup: numberOrNull(record.nova_group),
    ecoscoreGrade: asText(record.ecoscore_grade) || asText(record.environmental_score_grade) || 'unknown',
    dataQualityTags: splitTags(record.data_quality_tags),
    nutritionPer100g: normalizeOpenFoodFactsNutrition(record),
    imageUrl: asText(record.image_url),
    productUrl: asText(record.url) || `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}`,
    sourceUrl: `${OPENFOODFACTS_EXPORT_URL}#code=${encodeURIComponent(code)}`,
    retrievedAt
  };
}

export function extractOpenFoodFactsBarcodeFromImageUrl(imageUrl: string): string {
  const barcodeSegments = [...imageUrl.matchAll(/(?:^|[/_.-])(\d{8,14})(?=[/_.-]|$|\?)/g)]
    .map((match) => match[1]);
  return barcodeSegments.find((segment) => /^\d{8,14}$/.test(segment)) ?? '';
}

export function extractOpenFoodFactsBarcodeFromAxfoodImageUrl(imageUrl: string): string {
  const match = imageUrl.match(/\/(0\d{13})(?:_|$)/);
  if (!match) {
    return extractOpenFoodFactsBarcodeFromImageUrl(imageUrl);
  }
  return match[1].replace(/^0(?=\d{13}$)/, '');
}


async function fetchOpenFoodFactsSearchPage(
  fetchImpl: typeof fetch,
  sourceUrl: string,
  page: number,
  options: { retryAttempts: number; retryBaseDelayMs: number }
): Promise<OpenFoodFactsSearchResponse> {
  const retryStatuses = new Set([429, 500, 502, 503, 504]);
  let lastStatus = 0;
  const attempts = Math.max(1, Math.floor(options.retryAttempts));
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    lastStatus = response.status;
    if (response.ok) {
      return await response.json() as OpenFoodFactsSearchResponse;
    }
    if (!retryStatuses.has(response.status) || attempt === attempts - 1) {
      break;
    }
    await sleep(Math.max(0, options.retryBaseDelayMs) * (attempt + 1));
  }
  throw new Error(`OpenFoodFacts Sweden catalog request failed for page ${page}: ${lastStatus}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groupOpenFoodFactsCandidatesByBarcode(
  candidates: readonly OpenFoodFactsRetailerProductCandidate[]
): Map<string, OpenFoodFactsRetailerProductCandidate[]> {
  const rows = new Map<string, OpenFoodFactsRetailerProductCandidate[]>();
  for (const candidate of candidates) {
    const barcode = candidate.barcode || extractOpenFoodFactsBarcodeFromAxfoodImageUrl(candidate.imageUrl ?? '');
    if (!/^\d{8,14}$/.test(barcode)) {
      continue;
    }
    const matches = rows.get(barcode) ?? [];
    matches.push(candidate);
    rows.set(barcode, matches);
  }
  return rows;
}

function normalizeOpenFoodFactsNutrition(value: unknown): OpenFoodFactsNutritionPer100g {
  const record = isRecord(value) ? value : {};
  return {
    energyKj: numberOrNull(record.energy_100g),
    energyKcal: numberOrNull(record['energy-kcal_100g']),
    fat: numberOrNull(record.fat_100g),
    saturatedFat: numberOrNull(record['saturated-fat_100g']),
    carbohydrates: numberOrNull(record.carbohydrates_100g),
    sugars: numberOrNull(record.sugars_100g),
    fiber: numberOrNull(record.fiber_100g),
    proteins: numberOrNull(record.proteins_100g),
    salt: numberOrNull(record.salt_100g),
    sodium: numberOrNull(record.sodium_100g)
  };
}

function hasOpenFoodFactsNutrition(nutrition: OpenFoodFactsNutritionPer100g): boolean {
  return Object.values(nutrition).some((value) => value !== null);
}

function parseTsvLine(line: string): string[] {
  return line.split('\t');
}

function splitTags(value: unknown): string[] {
  const text = asText(value);
  return text ? text.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function splitTextList(value: unknown): string[] {
  const text = asText(value);
  return text ? text.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asTextArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
