import type { ApohemProduct, PharmacyProductCategory } from './apohem.js';

export type KronansApotekProduct = ApohemProduct & { chain: 'kronans-apotek-se' };

export type FetchKronansApotekProductsOptions = {
  fetchImpl?: typeof fetch;
  urls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

type JsonRecord = Record<string, unknown>;

export const KRONANS_APOTEK_BASE_URL = 'https://www.kronansapotek.se';
export const DEFAULT_KRONANS_APOTEK_SEARCH_URLS = [
  'https://www.kronansapotek.se/hitta-produkter/?q=alvedon',
  'https://www.kronansapotek.se/hitta-produkter/?q=vitamin',
  'https://www.kronansapotek.se/hitta-produkter/?q=solskydd',
  'https://www.kronansapotek.se/hitta-produkter/?q=tandkr%C3%A4m',
  'https://www.kronansapotek.se/hitta-produkter/?q=la%20roche'
] as const;

export async function fetchKronansApotekProducts(
  options: FetchKronansApotekProductsOptions = {}
): Promise<KronansApotekProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: KronansApotekProduct[] = [];
  const seen = new Set<string>();

  for (const url of options.urls ?? DEFAULT_KRONANS_APOTEK_SEARCH_URLS) {
    const sourceUrl = absoluteUrl(url, KRONANS_APOTEK_BASE_URL);
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Kronans Apotek request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const product of parseKronansApotekProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = `${product.chain}:${product.ean}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseKronansApotekProducts(html: string, sourceUrl: string, retrievedAt: string): KronansApotekProduct[] {
  const products: JsonRecord[] = [];
  for (const data of extractScriptJsonValues(html)) {
    visit(data, (value) => {
      if (looksLikeProduct(value)) products.push(value);
    });
  }

  return products
    .map((product) => normalizeKronansApotekProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is KronansApotekProduct => product !== null);
}

export function normalizeKronansApotekProduct(
  product: JsonRecord,
  sourceUrl: string,
  retrievedAt: string
): KronansApotekProduct | null {
  if (isPrescriptionOnly(product)) return null;

  const ean = eanText(firstValue(product, ['ean', 'gtin', 'gtin13', 'barcode', 'barCode', 'eanCode', 'globalTradeItemNumber']));
  const name = text(firstValue(product, ['name', 'title', 'productName', 'displayName']));
  const price = numberFromPrice(firstValue(product, ['price', 'currentPrice', 'salesPrice', 'sellPrice', 'unitPrice', 'offerPrice']));
  if (!ean || !name || price === null) return null;

  const originalPrice = numberFromPrice(firstValue(product, ['originalPrice', 'ordinaryPrice', 'regularPrice', 'previousPrice', 'wasPrice', 'listPrice']));
  const category = kronansCategory(product, sourceUrl);
  return {
    chain: 'kronans-apotek-se',
    code: text(firstValue(product, ['sku', 'code', 'id', 'productId', 'articleNumber', 'variantCode'])) || ean,
    ean,
    name,
    brand: text(firstValue(product, ['brand', 'brandName', 'manufacturer'])) || text(nestedValue(product, ['brand', 'name'])),
    category,
    price,
    priceText: `${price.toFixed(2)} SEK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} SEK`,
    vatPercent: numberFromPrice(firstValue(product, ['vatPercent', 'vat', 'taxRate'])) ?? numberFromPrice(nestedValue(product, ['price', 'vatPercent'])),
    stockStatus: text(firstValue(product, ['stockStatus', 'availability', 'availabilityStatus', 'inventoryStatus']))
      || text(nestedValue(product, ['stock', 'status']))
      || text(nestedValue(product, ['offers', 'availability'])),
    productUrl: absoluteUrl(firstValue(product, ['url', 'href', 'canonicalUrl', 'slug']), KRONANS_APOTEK_BASE_URL),
    imageUrl: absoluteUrl(firstValue(product, ['imageUrl', 'image', 'thumbnail', 'thumbnailUrl']), KRONANS_APOTEK_BASE_URL),
    isOtc: booleanFromUnknown(firstValue(product, ['isOtc', 'isOTC', 'isOtcMedicine', 'otc'])) ?? category === 'otc',
    sourceUrl,
    retrievedAt
  };
}

function looksLikeProduct(value: JsonRecord): boolean {
  return text(firstValue(value, ['name', 'title', 'productName', 'displayName'])).length > 0
    && eanText(firstValue(value, ['ean', 'gtin', 'gtin13', 'barcode', 'barCode', 'eanCode', 'globalTradeItemNumber'])).length > 0
    && numberFromPrice(firstValue(value, ['price', 'currentPrice', 'salesPrice', 'sellPrice', 'unitPrice', 'offerPrice'])) !== null;
}

function isPrescriptionOnly(product: JsonRecord): boolean {
  for (const field of ['isPrescription', 'prescriptionOnly', 'prescriptionRequired', 'requiresPrescription', 'isRx', 'rx']) {
    if (booleanFromUnknown(product[field]) === true) return true;
  }
  const type = text(firstValue(product, ['productType', 'medicineType', 'assortmentType'])).toLowerCase();
  return type === 'rx' || type.includes('receptbelagd') || type.includes('prescription');
}

function kronansCategory(product: JsonRecord, sourceUrl: string): PharmacyProductCategory {
  const categoryText = [
    text(firstValue(product, ['category', 'categoryName', 'breadcrumb', 'breadcrumbs'])),
    text(nestedValue(product, ['tracking', 'category'])),
    sourceUrl
  ].join(' ').toLowerCase();
  if (booleanFromUnknown(firstValue(product, ['isOtc', 'isOTC', 'isOtcMedicine', 'otc'])) === true
    || categoryText.includes('receptfri')
    || categoryText.includes('värk')
    || categoryText.includes('lakemedel')
    || categoryText.includes('läkemedel')) {
    return 'otc';
  }
  if (categoryText.includes('hud') || categoryText.includes('skönhet') || categoryText.includes('beauty') || categoryText.includes('solskydd') || categoryText.includes('la roche')) {
    return 'beauty';
  }
  return 'supplement';
}

function extractScriptJsonValues(html: string): unknown[] {
  const values: unknown[] = [];
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    const script = decodeHtmlEntities(match[1] ?? '').trim();
    addParsedJson(values, script);
    for (const json of extractAssignedJson(script)) addParsedJson(values, json);
    for (const json of extractJsonParseStrings(script)) addParsedJson(values, json);
  }
  return values;
}

function extractAssignedJson(script: string): string[] {
  const values: string[] = [];
  for (const match of script.matchAll(/(?:window\.)?[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\s*=\s*[{[]/g)) {
    const start = (match.index ?? 0) + match[0].length - 1;
    try {
      values.push(script.slice(start, findBalancedEnd(script, start) + 1));
    } catch {
      // Ignore non-JSON JavaScript initializers.
    }
  }
  return values;
}

function extractJsonParseStrings(script: string): string[] {
  const values: string[] = [];
  let searchAt = 0;
  while (searchAt < script.length) {
    const start = script.indexOf('JSON.parse(', searchAt);
    if (start === -1) break;
    const quoteIndex = start + 'JSON.parse('.length;
    const quote = script[quoteIndex];
    if (quote !== "'" && quote !== '"') {
      searchAt = quoteIndex + 1;
      continue;
    }
    const end = findQuotedStringEnd(script, quoteIndex);
    values.push(decodeJsString(script.slice(quoteIndex + 1, end)));
    searchAt = end + 1;
  }
  return values;
}

function addParsedJson(values: unknown[], json: string): void {
  const trimmed = json.trim();
  if (trimmed[0] !== '{' && trimmed[0] !== '[') return;
  try {
    values.push(JSON.parse(trimmed));
  } catch {
    // Ignore scripts that are JavaScript rather than JSON.
  }
}

function findBalancedEnd(value: string, start: number): number {
  const stack = [value[start] === '[' ? ']' : '}'];
  let quote = '';
  let escaped = false;
  for (let index = start + 1; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{') stack.push('}');
    else if (char === '[') stack.push(']');
    else if (char === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return index;
    }
  }
  throw new Error('Could not find balanced JSON end');
}

function findQuotedStringEnd(value: string, startQuoteIndex: number): number {
  const quote = value[startQuoteIndex];
  let escaped = false;
  for (let index = startQuoteIndex + 1; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) return index;
  }
  throw new Error('Could not find quoted string end');
}

function visit(value: unknown, onObject: (value: JsonRecord) => void): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) visit(item, onObject);
    return;
  }
  onObject(value as JsonRecord);
  for (const item of Object.values(value)) visit(item, onObject);
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function firstValue(record: JsonRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function nestedValue(record: JsonRecord, path: readonly string[]): unknown {
  let value: unknown = record;
  for (const key of path) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    value = (value as JsonRecord)[key];
  }
  return value;
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const url = Array.isArray(value)
    ? text(value[0])
    : value && typeof value === 'object'
      ? text(firstValue(value as JsonRecord, ['url', 'src']))
      : text(value);
  if (!url || url.startsWith('data:')) return '';
  return url.startsWith('https://') ? url : new URL(url, baseUrl).toString();
}

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => text(item)).filter(Boolean).join(' > ');
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function eanText(value: unknown): string {
  const ean = text(value).replace(/\D/g, '');
  return ean.length >= 8 && ean.length <= 14 ? ean : '';
}

function numberFromPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = numberFromPrice(item);
      if (parsed !== null) return parsed;
    }
  }
  if (value && typeof value === 'object') {
    return numberFromPrice(firstValue(value as JsonRecord, ['inclVat', 'amount', 'value', 'price', 'current', 'currentPrice', 'salesPrice']));
  }
  return null;
}

function booleanFromUnknown(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const normalized = text(value).toLowerCase();
  if (['true', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'no', '0'].includes(normalized)) return false;
  return undefined;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function decodeJsString(value: string): string {
  return value
    .replace(/\\u([\da-f]{4})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([\da-f]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\(['"\\])/g, '$1');
}
