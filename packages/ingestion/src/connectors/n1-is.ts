import { createHash } from 'node:crypto';
import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export type N1IsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId;
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l';
  currency: 'ISK';
  chainId: 'n1-is';
  sourceKind: FuelPriceSourceKind;
  operatorName: 'N1';
  sourceUrl: string;
  observedAt: string;
  effectiveFrom: string;
  provenance: {
    source: 'n1_is_fuel_prices';
    parserVersion: typeof N1_IS_FUEL_PRICE_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    originalStationName?: string;
  };
};

export type N1IsConvenienceSku = {
  domain: 'convenience';
  chainId: 'n1-is';
  productId: string;
  sku: string;
  variantSku?: string;
  name: string;
  description?: string;
  categoryPath: string[];
  categorySlug: string;
  price: number;
  priceText: string;
  currency: 'ISK';
  unit?: string;
  imageUrl?: string;
  productUrl: string;
  inStock: boolean;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'n1_is_webshop_algolia';
    parserVersion: typeof N1_IS_CONVENIENCE_PARSER_VERSION;
    contentDigest: string;
    objectID: string;
    indexName: typeof N1_IS_ALGOLIA_PRODUCTS_INDEX;
    originalPrice: number;
  };
};

export type N1IsObservation = N1IsFuelPriceObservation | N1IsConvenienceSku;

type N1IsAlgoliaHit = {
  objectID?: unknown;
  sku?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  categories?: unknown;
  hierarchical_categories?: unknown;
  category_breadcrumbs?: unknown;
  variants?: unknown;
  attributes?: unknown;
  media?: unknown;
  stock_level?: unknown;
  stock_level_stores?: unknown;
};

type N1IsAlgoliaResponse = {
  hits?: unknown;
};

export const N1_IS_FUEL_PRICES_URL = 'https://n1.is/is/verdtafla';
export const N1_IS_FUEL_PRICE_PARSER_VERSION = 'n1-is-fuel-prices-v1';
export const N1_IS_WEBSTORE_URL = 'https://n1.is/is/vefverslun';
export const N1_IS_ALGOLIA_APP_ID = 'LU6HO9UFWF';
export const N1_IS_ALGOLIA_SEARCH_API_KEY = '1fc8f9f8099e352754bc2d197f6f12a8';
export const N1_IS_ALGOLIA_PRODUCTS_INDEX = 'PROD_PRODUCTS';
export const N1_IS_CONVENIENCE_PARSER_VERSION = 'n1-is-webshop-algolia-v1';
export const N1_IS_ALGOLIA_PRODUCTS_QUERY_URL = `https://${N1_IS_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${N1_IS_ALGOLIA_PRODUCTS_INDEX}/query`;

const fuelHeaders: Array<{ needles: string[]; productId: FuelGradeId; label: string }> = [
  { needles: ['bensín', 'bensin', '95'], productId: 'fuel-95-e10', label: 'N1 Bensín' },
  { needles: ['dísel', 'diesel'], productId: 'fuel-diesel', label: 'N1 Dísel' }
];

const browserUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function contentHashFor(body: string) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function textFromHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIcelandicPrice(value: string) {
  const match = value.replace(/\./g, '').match(/(\d+(?:,\d+)?)/);
  return match ? Number(match[1]!.replace(',', '.')) : undefined;
}

function headerProductId(header: string) {
  const normalized = header.toLocaleLowerCase('is-IS');
  if (normalized.includes('lituð') || normalized.includes('colored')) return undefined;
  return fuelHeaders.find((candidate) => candidate.needles.some((needle) => normalized.includes(needle))) ?? undefined;
}

export function parseN1IsFuelPricePage(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): N1IsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? N1_IS_FUEL_PRICES_URL;
  if (!sourceUrl.includes('n1.is')) throw new Error('N1 IS fuel connector only accepts n1.is source URLs');
  if (/captcha|access denied|innskráning/i.test(input.body)) throw new Error('N1 IS fuel source blocked/login page');
  const digest = contentHashFor(input.body);
  const tableRows = [...input.body.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
    .map((row) => [...row[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => textFromHtml(cell[1] ?? '')))
    .filter((cells) => cells.length >= 2);
  const headerRow = tableRows.find((cells) => cells.some((cell) => headerProductId(cell)));
  if (!headerRow) return parseN1IsFuelPriceCards(input.body, {
    capturedAt: input.capturedAt,
    digest,
    sourceUrl
  });

  const gradeColumns = headerRow
    .map((header, index) => ({ index, spec: headerProductId(header) }))
    .filter((entry): entry is { index: number; spec: NonNullable<ReturnType<typeof headerProductId>> } => entry.spec !== undefined);
  const bestByGrade = new Map<FuelGradeId, N1IsFuelPriceObservation>();

  for (const cells of tableRows.slice(tableRows.indexOf(headerRow) + 1)) {
    const stationName = cells[0]?.trim();
    for (const { index, spec } of gradeColumns) {
      const originalPriceText = cells[index] ?? '';
      const price = parseIcelandicPrice(originalPriceText);
      if (price === undefined) continue;
      const current = bestByGrade.get(spec.productId);
      if (current && current.pricePerLitre <= price) continue;
      bestByGrade.set(spec.productId, {
        domain: 'fuel',
        productId: spec.productId,
        gradeLabel: spec.label,
        pricePerLitre: price,
        unit: 'l',
        currency: 'ISK',
        chainId: 'n1-is',
        sourceKind: 'operator_public_price_page',
        operatorName: 'N1',
        sourceUrl,
        observedAt: input.capturedAt,
        effectiveFrom: input.capturedAt.slice(0, 10),
        provenance: {
          source: 'n1_is_fuel_prices',
          parserVersion: N1_IS_FUEL_PRICE_PARSER_VERSION,
          contentDigest: digest,
          originalPriceText,
          originalStationName: stationName || undefined
        }
      });
    }
  }

  return [...bestByGrade.values()];
}

function parseN1IsFuelPriceCards(
  body: string,
  context: { capturedAt: string; digest: string; sourceUrl: string }
): N1IsFuelPriceObservation[] {
  const bestByGrade = new Map<FuelGradeId, N1IsFuelPriceObservation>();
  const cardPattern = /\\?"title\\?"\s*:\s*\\?"([^"\\]+)\\?"[\s\S]{0,300}?\\?"price\\?"\s*:\s*(\d+(?:\.\d+)?)/gi;
  for (const match of body.matchAll(cardPattern)) {
    const title = match[1] ?? '';
    const spec = headerProductId(title);
    const price = Number(match[2]);
    if (!spec || !Number.isFinite(price)) continue;
    const current = bestByGrade.get(spec.productId);
    if (current && current.pricePerLitre <= price) continue;
    bestByGrade.set(spec.productId, {
      domain: 'fuel',
      productId: spec.productId,
      gradeLabel: spec.label,
      pricePerLitre: price,
      unit: 'l',
      currency: 'ISK',
      chainId: 'n1-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'N1',
      sourceUrl: context.sourceUrl,
      observedAt: context.capturedAt,
      effectiveFrom: context.capturedAt.slice(0, 10),
      provenance: {
        source: 'n1_is_fuel_prices',
        parserVersion: N1_IS_FUEL_PRICE_PARSER_VERSION,
        contentDigest: context.digest,
        originalPriceText: `${price}`,
        originalStationName: 'Lægsta verð í gangi'
      }
    });
  }
  return [...bestByGrade.values()];
}

export function parseN1IsConvenienceProducts(input: {
  body: string | N1IsAlgoliaResponse;
  retrievedAt: string;
  sourceUrl?: string;
  maxRows?: number;
}): N1IsConvenienceSku[] {
  const sourceUrl = input.sourceUrl ?? N1_IS_ALGOLIA_PRODUCTS_QUERY_URL;
  if (!sourceUrl.includes('algolia.net') && !sourceUrl.includes('n1.is')) {
    throw new Error('N1 IS convenience connector only accepts n1.is or Algolia source URLs');
  }

  const response = typeof input.body === 'string' ? JSON.parse(input.body) as N1IsAlgoliaResponse : input.body;
  const digest = contentHashFor(typeof input.body === 'string' ? input.body : JSON.stringify(input.body));
  const hits = Array.isArray(response.hits) ? response.hits : [];
  const rows: N1IsConvenienceSku[] = [];
  const seen = new Set<string>();

  for (const rawHit of hits) {
    if (!isRecord(rawHit)) continue;
    const row = normalizeN1IsConvenienceHit(rawHit as N1IsAlgoliaHit, { digest, retrievedAt: input.retrievedAt, sourceUrl });
    if (!row || seen.has(row.productId)) continue;
    seen.add(row.productId);
    rows.push(row);
    if (input.maxRows && rows.length >= input.maxRows) break;
  }

  return rows;
}

export async function fetchN1IsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<N1IsFuelPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? N1_IS_FUEL_PRICES_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': browserUserAgent
    }
  });
  if (!response.ok) {
    throw new Error(`N1 IS fuel source blocked with HTTP ${response.status}`);
  }

  return parseN1IsFuelPricePage({
    body: await response.text(),
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    sourceUrl
  });
}

export async function fetchN1IsConvenienceProducts(options: {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrl?: string;
  maxRows?: number;
  query?: string;
} = {}): Promise<N1IsConvenienceSku[]> {
  const sourceUrl = options.sourceUrl ?? N1_IS_ALGOLIA_PRODUCTS_QUERY_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    query: options.query ?? '',
    hitsPerPage: String(options.maxRows ?? 50)
  });
  const response = await fetchImpl(sourceUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': browserUserAgent,
      'x-algolia-application-id': N1_IS_ALGOLIA_APP_ID,
      'x-algolia-api-key': N1_IS_ALGOLIA_SEARCH_API_KEY
    },
    body: JSON.stringify({ params: params.toString() })
  });
  if (!response.ok) {
    throw new Error(`N1 IS convenience source blocked with HTTP ${response.status}`);
  }

  return parseN1IsConvenienceProducts({
    body: await response.text(),
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    sourceUrl,
    maxRows: options.maxRows
  });
}

export async function fetchN1IsProducts(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  retrievedAt?: string;
  fuelSourceUrl?: string;
  convenienceSourceUrl?: string;
  maxConvenienceRows?: number;
  query?: string;
} = {}): Promise<N1IsObservation[]> {
  const capturedAt = options.capturedAt ?? options.retrievedAt ?? new Date().toISOString();
  const [fuelRows, convenienceRows] = await Promise.all([
    fetchN1IsFuelPrices({ fetchImpl: options.fetchImpl, capturedAt, sourceUrl: options.fuelSourceUrl }),
    fetchN1IsConvenienceProducts({
      fetchImpl: options.fetchImpl,
      retrievedAt: options.retrievedAt ?? capturedAt,
      sourceUrl: options.convenienceSourceUrl,
      maxRows: options.maxConvenienceRows,
      query: options.query
    })
  ]);
  return [...fuelRows, ...convenienceRows];
}

function normalizeN1IsConvenienceHit(
  hit: N1IsAlgoliaHit,
  context: { digest: string; retrievedAt: string; sourceUrl: string }
): N1IsConvenienceSku | null {
  const objectID = text(hit.objectID);
  const sku = text(hit.sku) || objectID;
  const name = text(hit.name);
  const price = number(hit.price);
  if (!objectID || !sku || !name || price === undefined || price <= 0) return null;

  const categoryPath = categoryPathFor(hit);
  const categorySlug = slugFor(categoryPath.at(-1) ?? categoryPath[0] ?? 'convenience');
  const variantSku = firstVariantSku(hit.variants);
  const description = text(hit.description) || undefined;
  const unit = unitFor(hit.attributes);
  return {
    domain: 'convenience',
    chainId: 'n1-is',
    productId: `n1-is-${slugFor(variantSku || sku || objectID)}`,
    sku,
    variantSku,
    name,
    description,
    categoryPath,
    categorySlug,
    price,
    priceText: `${formatIcelandicPrice(price)} kr.`,
    currency: 'ISK',
    unit,
    imageUrl: imageUrlFor(hit.media),
    productUrl: buildN1IsProductSearchUrl(sku),
    inStock: inStock(hit),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    provenance: {
      source: 'n1_is_webshop_algolia',
      parserVersion: N1_IS_CONVENIENCE_PARSER_VERSION,
      contentDigest: context.digest,
      objectID,
      indexName: N1_IS_ALGOLIA_PRODUCTS_INDEX,
      originalPrice: price
    }
  };
}

function categoryPathFor(hit: N1IsAlgoliaHit): string[] {
  if (Array.isArray(hit.categories) && hit.categories.length > 0) {
    const category = hit.categories.map(text).filter(Boolean).at(-1);
    const parts = category?.split('>').map((part) => part.trim()).filter(Boolean) ?? [];
    if (parts.length > 0) return parts;
  }

  if (isRecord(hit.hierarchical_categories)) {
    const values = Object.entries(hit.hierarchical_categories)
      .filter(([key]) => /^lvl\d+$/i.test(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => text(value))
      .filter(Boolean);
    const deepest = values.at(-1);
    if (deepest) {
      const parts = deepest.split('>').map((part) => part.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
  }

  return ['Convenience'];
}

function firstVariantSku(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const sku = text(candidate.sku);
    if (sku) return sku;
  }
  return undefined;
}

function unitFor(value: unknown): string | undefined {
  if (!isRecord(value) || !isRecord(value.units)) return undefined;
  return text(value.units.unit) || undefined;
}

function imageUrlFor(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const imageUrl = text(candidate.product_list) || text(candidate['255']) || text(candidate['540']) || text(candidate['1080']);
    if (imageUrl) return imageUrl;
  }
  return undefined;
}

function inStock(hit: N1IsAlgoliaHit): boolean {
  const values = [text(hit.stock_level), text(hit.stock_level_stores)].join(' ');
  return !/(out\s*of\s*stock|ekki\s+til|uppselt)/i.test(values);
}

function buildN1IsProductSearchUrl(sku: string): string {
  const url = new URL(N1_IS_WEBSTORE_URL);
  url.searchParams.set(`${N1_IS_ALGOLIA_PRODUCTS_INDEX}[query]`, sku);
  return url.toString();
}

function formatIcelandicPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toLocaleString('is-IS', { maximumFractionDigits: 2 });
}

function slugFor(value: string): string {
  return value.toLocaleLowerCase('is-IS')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function number(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
