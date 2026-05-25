import { createHash } from 'node:crypto';
import type { FuelPriceSourceKind } from './okq8-fuel.js';

export const CIRCLE_K_SE_FUEL_PRICES_URL = 'https://www.circlek.se/foretag/drivmedel/priser';
export const CIRCLE_K_SE_FOODINFO_URL = 'https://foodinfo.circlekeurope.com/se';
export const CIRCLE_K_SE_FOODINFO_API_URL = 'https://backend.foodis-prod.alpaque.net/api';
export const CIRCLE_K_SE_FUEL_PARSER_VERSION = 'circle-k-se-fuel-prices-v1';
export const CIRCLE_K_SE_CONVENIENCE_PARSER_VERSION = 'circle-k-se-foodinfo-menu-v1';
export const DEFAULT_CIRCLE_K_SE_CONVENIENCE_QUERIES = ['kaffe', 'baguette', 'wrap', 'sallad', 'muffin', 'croissant', 'korv'] as const;

export type CircleKSeFuelProductId =
  | 'fuel-95-e10'
  | 'fuel-98'
  | 'fuel-98-plus'
  | 'fuel-diesel'
  | 'fuel-diesel-plus'
  | 'fuel-hvo100'
  | 'fuel-cng'
  | 'fuel-e85';

export type CircleKSeFuelUnit = 'l' | 'kg';

export type CircleKSeFuelObservation = {
  domain: 'fuel';
  chain: 'circle-k';
  chainId: 'circle-k';
  country: 'SE';
  productId: CircleKSeFuelProductId;
  productName: string;
  fuelGrade: '95' | '98' | '98-plus' | 'diesel' | 'diesel-plus' | 'hvo100' | 'cng' | 'e85';
  gradeLabel: string;
  customerSegment: 'business';
  sourceKind: FuelPriceSourceKind;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerUnit: number;
  pricePerLitre?: number;
  currency: 'SEK';
  unit: CircleKSeFuelUnit;
  confidence: number;
  provenance: {
    source: 'circle_k_se_business_fuel_prices';
    parserVersion: string;
    sourceUrl: string;
    contentDigest: string;
    originalProductName: string;
    originalPriceText: string;
    originalUnitText: string;
    originalEffectiveDate: string;
    originalChangeText?: string;
  };
};

export type CircleKSeConvenienceCategory = 'drink' | 'sandwich' | 'snack' | 'bakery' | 'hot_food' | 'convenience';

export type CircleKSeConvenienceProduct = {
  chain: 'circle-k';
  chainId: 'circle-k';
  country: 'SE';
  code: string;
  name: string;
  category: CircleKSeConvenienceCategory;
  categoryName?: string;
  barcode?: string;
  price?: number;
  priceText?: string;
  priceAvailability: 'published' | 'not_published';
  currency: 'SEK';
  sourceUrl: string;
  apiUrl: string;
  productUrl: string;
  imageUrl?: string;
  retrievedAt: string;
  provenance: {
    source: 'circle_k_se_foodinfo_menu';
    parserVersion: string;
    rawSnapshotRef: string;
  };
};

export type FetchCircleKSeFuelPricesOptions = {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
};

export type FetchCircleKSeConvenienceProductsOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  apiUrl?: string;
  sourceUrl?: string;
  queries?: readonly string[];
  maxRows?: number;
};

type CircleKSeFuelSpec = {
  productId: CircleKSeFuelProductId;
  fuelGrade: CircleKSeFuelObservation['fuelGrade'];
  gradeLabel: string;
};

const FUEL_SPECS: Record<string, CircleKSeFuelSpec> = {
  'miles 95': { productId: 'fuel-95-e10', fuelGrade: '95', gradeLabel: 'miles 95 / Bensin 95' },
  'miles 98': { productId: 'fuel-98', fuelGrade: '98', gradeLabel: 'miles 98 / Bensin 98' },
  'miles+ 98': { productId: 'fuel-98-plus', fuelGrade: '98-plus', gradeLabel: 'miles+ 98' },
  'miles diesel': { productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'miles diesel' },
  'miles+ diesel': { productId: 'fuel-diesel-plus', fuelGrade: 'diesel-plus', gradeLabel: 'miles+ diesel' },
  hvo100: { productId: 'fuel-hvo100', fuelGrade: 'hvo100', gradeLabel: 'HVO100' },
  fordonsgas: { productId: 'fuel-cng', fuelGrade: 'cng', gradeLabel: 'Fordonsgas' },
  e85: { productId: 'fuel-e85', fuelGrade: 'e85', gradeLabel: 'E85' }
};

function contentDigest(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .trim();
}

function textFromHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripMobileHeaderLabel(value: string): string {
  return value.replace(/^(Produktnamn|Pris|Ändringsdatum|Enhet|Ändring):\s*/i, '').trim();
}

function parseSwedishDecimal(value: string): number {
  const match = value.replace(/\s+/g, '').match(/[+-]?\d+(?:[,.]\d+)?/);
  if (!match) throw new Error(`Invalid Circle K SE number: ${value}`);
  const parsed = Number(match[0].replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Circle K SE number: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function normalizeFuelUnit(value: string): CircleKSeFuelUnit {
  const normalized = value.toLowerCase().replace(/\s+/g, '');
  if (normalized === 'kr/l') return 'l';
  if (normalized === 'kr/kg') return 'kg';
  throw new Error(`Unsupported Circle K SE fuel unit: ${value}`);
}

function observedAtForDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Circle K SE effective date: ${date}`);
  return `${date}T00:00:00.000Z`;
}

function normalizedFuelName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parseCircleKSeFuelPricePage(input: {
  html: string;
  capturedAt: string;
  sourceUrl?: string;
  parserVersion?: string;
}): CircleKSeFuelObservation[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_SE_FUEL_PRICES_URL;
  if (!new URL(sourceUrl).hostname.endsWith('circlek.se')) throw new Error('Circle K SE fuel connector only accepts circlek.se source URLs.');
  if (/captcha|access denied|logga in/i.test(textFromHtml(input.html))) throw new Error('Circle K SE fuel source returned a blocked/login page.');

  const digest = contentDigest(input.html);
  const rows: CircleKSeFuelObservation[] = [];
  for (const rowMatch of input.html.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)) {
    const rowHtml = rowMatch[0];
    const cells = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => stripMobileHeaderLabel(textFromHtml(cell[1] ?? '')));
    if (cells.length < 6) continue;
    const originalProductName = cells[1] ?? '';
    const spec = FUEL_SPECS[normalizedFuelName(originalProductName)];
    if (!spec) continue;
    const originalPriceText = cells[2] ?? '';
    const timeMatch = rowHtml.match(/<time\b[^>]*datetime=(['"])([^'"]+)\1[^>]*>([\s\S]*?)<\/time>/i);
    const originalEffectiveDate = textFromHtml(timeMatch?.[3] ?? cells[3] ?? '');
    const originalUnitText = cells[4] ?? '';
    const unit = normalizeFuelUnit(originalUnitText);
    const pricePerUnit = parseSwedishDecimal(originalPriceText);
    rows.push({
      domain: 'fuel',
      chain: 'circle-k',
      chainId: 'circle-k',
      country: 'SE',
      productId: spec.productId,
      productName: originalProductName,
      fuelGrade: spec.fuelGrade,
      gradeLabel: spec.gradeLabel,
      customerSegment: 'business',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: timeMatch?.[2] ?? observedAtForDate(originalEffectiveDate),
      capturedAt: input.capturedAt,
      effectiveFrom: originalEffectiveDate,
      pricePerUnit,
      ...(unit === 'l' ? { pricePerLitre: pricePerUnit } : {}),
      currency: 'SEK',
      unit,
      confidence: 0.9,
      provenance: {
        source: 'circle_k_se_business_fuel_prices',
        parserVersion: input.parserVersion ?? CIRCLE_K_SE_FUEL_PARSER_VERSION,
        sourceUrl,
        contentDigest: digest,
        originalProductName,
        originalPriceText,
        originalUnitText,
        originalEffectiveDate,
        ...(cells[5] ? { originalChangeText: cells[5] } : {})
      }
    });
  }

  if (rows.length === 0) throw new Error('No Circle K SE fuel price rows parsed.');
  return rows;
}

export async function fetchCircleKSeFuelPrices(options: FetchCircleKSeFuelPricesOptions = {}): Promise<CircleKSeFuelObservation[]> {
  const sourceUrl = options.sourceUrl ?? CIRCLE_K_SE_FUEL_PRICES_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 circle-k-se-fuel-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Circle K SE fuel price source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Circle K SE fuel price source failed with HTTP ${response.status}.`);
  return parseCircleKSeFuelPricePage({
    html: await response.text(),
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    sourceUrl
  });
}

function slugFor(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.round((value + Number.EPSILON) * 100) / 100;
  if (typeof value === 'string' && value.trim()) return parseSwedishDecimal(value);
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function imageUrlFor(rawPath: unknown): string | undefined {
  const path = stringValue(rawPath);
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.replace(/^\/+/, ''), 'https://media.foodis-prod.alpaque.net/').toString();
}

function productCategories(item: Record<string, unknown>): Array<{ name: string; slug: string }> {
  return arrayValue(item.category).map(asRecord).filter((entry): entry is Record<string, unknown> => entry !== undefined).map((entry) => ({
    name: stringValue(entry.name) ?? '',
    slug: stringValue(entry.slug) ?? ''
  }));
}

function convenienceCategoryFor(item: Record<string, unknown>): CircleKSeConvenienceCategory | undefined {
  const haystack = [stringValue(item.name), ...productCategories(item).flatMap((category) => [category.name, category.slug])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/kaffe|dryck|drink|juice|smoothie|latte|cappuccino|espresso/.test(haystack)) return 'drink';
  if (/baguette|smörgå|smorg|wrap|sallad|sandwich/.test(haystack)) return 'sandwich';
  if (/fika|muffin|croissant|bulle|donut|wiener|bakery|kaka|snack|bar/.test(haystack)) return 'snack';
  if (/korv|hamburg|pizza|kebab|hot|varma/.test(haystack)) return 'hot_food';
  if (/vegetarian|vego|convenience/.test(haystack)) return 'convenience';
  return undefined;
}

function productUrlFor(id: string, sourceUrl: string): string {
  return `${sourceUrl.replace(/\/$/, '')}/products/${encodeURIComponent(id)}`;
}

export function parseCircleKSeConvenienceProducts(input: {
  payload: unknown;
  retrievedAt: string;
  sourceUrl?: string;
  apiUrl?: string;
  rawSnapshotRef?: string;
  maxRows?: number;
}): CircleKSeConvenienceProduct[] {
  const sourceUrl = input.sourceUrl ?? CIRCLE_K_SE_FOODINFO_URL;
  const apiUrl = input.apiUrl ?? CIRCLE_K_SE_FOODINFO_API_URL;
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://circle-k-se-foodinfo/${contentDigest(JSON.stringify(input.payload))}`;
  const payload = asRecord(input.payload);
  const menuItems = arrayValue(payload?.menuItems);
  const rows: CircleKSeConvenienceProduct[] = [];
  const seen = new Set<string>();

  for (const rawItem of menuItems) {
    const item = asRecord(rawItem);
    if (!item) continue;
    const name = stringValue(item.name);
    if (!name) continue;
    const category = convenienceCategoryFor(item);
    if (!category) continue;
    const id = String(item.id ?? stringValue(item.slug) ?? slugFor(name));
    const code = `circle-k-se-${slugFor(id)}`;
    if (seen.has(code)) continue;
    seen.add(code);
    const price = numberValue(item.price);
    const categories = productCategories(item);
    rows.push({
      chain: 'circle-k',
      chainId: 'circle-k',
      country: 'SE',
      code,
      name,
      category,
      categoryName: categories[0]?.name || undefined,
      barcode: stringValue(item.barcode),
      ...(price !== undefined ? { price, priceText: `${price.toFixed(2)} SEK` } : {}),
      priceAvailability: price === undefined ? 'not_published' : 'published',
      currency: 'SEK',
      sourceUrl,
      apiUrl,
      productUrl: productUrlFor(id, sourceUrl),
      imageUrl: imageUrlFor(item.image_thumbnail ?? item.image),
      retrievedAt: input.retrievedAt,
      provenance: {
        source: 'circle_k_se_foodinfo_menu',
        parserVersion: CIRCLE_K_SE_CONVENIENCE_PARSER_VERSION,
        rawSnapshotRef
      }
    });
    if (input.maxRows && rows.length >= input.maxRows) break;
  }

  return rows;
}

function buildCircleKSeMenuItemsUrl(apiUrl: string, query?: string): string {
  const base = apiUrl.replace(/\/$/, '');
  return `${base}/getMenuItems/se/${query ? encodeURIComponent(query) : ''}`;
}

export async function fetchCircleKSeConvenienceProducts(
  options: FetchCircleKSeConvenienceProductsOptions = {}
): Promise<CircleKSeConvenienceProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const apiUrl = options.apiUrl ?? CIRCLE_K_SE_FOODINFO_API_URL;
  const sourceUrl = options.sourceUrl ?? CIRCLE_K_SE_FOODINFO_URL;
  const queries = options.queries && options.queries.length > 0 ? options.queries : [''];
  const rows: CircleKSeConvenienceProduct[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const url = buildCircleKSeMenuItemsUrl(apiUrl, query || undefined);
    const response = await fetchImpl(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 circle-k-se-convenience-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Circle K SE FoodInfo source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Circle K SE FoodInfo source failed with HTTP ${response.status}.`);
    const payload = await response.json();
    for (const row of parseCircleKSeConvenienceProducts({
      payload,
      retrievedAt,
      sourceUrl,
      apiUrl,
      rawSnapshotRef: `raw://circle-k-se-foodinfo/${contentDigest(JSON.stringify(payload))}`
    })) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  if (rows.length === 0) throw new Error('Circle K SE FoodInfo API had no parseable convenience SKU rows.');
  return rows;
}
