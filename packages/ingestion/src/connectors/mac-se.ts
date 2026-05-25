export type MacSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'mac-se';
  code: string;
  name: string;
  brand: string;
  category: 'beauty';
  price: number;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  stockStatus: string;
  sourceUrl: string;
  retrievedAt: string;
};

type MacSeCandidate = Record<string, unknown>;

export type FetchMacSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const MAC_SE_BASE_URL = 'https://www.maccosmetics.se';

export const DEFAULT_MAC_SE_SOURCE_URLS = [
  `${MAC_SE_BASE_URL}/products/13854/Products/Makeup/Lips/Lipstick`,
  `${MAC_SE_BASE_URL}/products/13847/Products/Makeup/Face/Foundation`,
  `${MAC_SE_BASE_URL}/products/13842/Products/Makeup/Eyes/Mascara`,
  `${MAC_SE_BASE_URL}/products/13849/Products/Makeup/Eyes/Eyeshadow`
] as const;

export async function fetchMacSeProducts(options: FetchMacSeProductsOptions = {}): Promise<MacSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MacSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_MAC_SE_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`MAC SE request failed for ${sourceUrl}: ${response.status}`);
    }
    addRows(rows, seen, parseMacSeProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) {
      return rows;
    }
  }

  return rows;
}

export function parseMacSeProducts(html: string, sourceUrl: string, retrievedAt: string): MacSeProduct[] {
  if (isBlockedPage(html)) return [];

  const rows: MacSeProduct[] = [];
  const seen = new Set<string>();

  for (const root of extractMacSeJsonRoots(html)) {
    visit(root, (value) => {
      const row = normalizeMacSeCandidate(value, sourceUrl, retrievedAt);
      if (!row) return;
      addRows(rows, seen, [row]);
    });
  }

  addRows(rows, seen, parseMacSeProductCards(html, sourceUrl, retrievedAt));
  return rows;
}

export function normalizeMacSeCandidate(candidate: MacSeCandidate, sourceUrl: string, retrievedAt: string): MacSeProduct | null {
  if (!looksLikeProductCandidate(candidate)) return null;

  const name = firstText(candidate, ['name', 'productName', 'displayName', 'title']);
  const price = firstNumber(candidate, ['price', 'salesPrice', 'salePrice', 'currentPrice', 'priceValue']);
  if (!name || price === null) return null;

  const currency =
    firstText(candidate, ['currency', 'currencyCode', 'priceCurrency']) ||
    nestedText(candidate, ['offers', 'priceCurrency']) ||
    nestedText(candidate, ['price', 'currency']) ||
    nestedText(candidate, ['currentPrice', 'currency']) ||
    nestedText(candidate, ['salesPrice', 'currency']) ||
    nestedText(candidate, ['salePrice', 'currency']) ||
    'SEK';
  if (currency.toUpperCase() !== 'SEK') return null;

  const productUrl =
    absoluteUrl(firstText(candidate, ['productUrl', 'url', 'href', 'canonicalUrl', '@id']), MAC_SE_BASE_URL) || sourceUrl;
  const imageUrl = imageFromCandidate(candidate);
  const code = firstText(candidate, ['code', 'sku', 'productId', 'product_id', 'id', 'productCode', 'shadeId']) || stableCode(name, productUrl);
  const brand = brandFromCandidate(candidate) || 'MAC';
  const stockStatus = stockStatusFromCandidate(candidate);

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'mac-se',
    code,
    name,
    brand,
    category: 'beauty',
    price: roundMoney(price),
    priceText: priceTextFromCandidate(candidate, price),
    productUrl,
    imageUrl,
    stockStatus,
    sourceUrl,
    retrievedAt
  };
}

export function extractMacSeJsonRoots(html: string): unknown[] {
  const roots: unknown[] = [];
  for (const script of scriptContents(html)) {
    const decoded = decodeHtmlEntities(script.trim());
    pushParsedJson(decoded, roots);

    for (const jsonString of jsonParseArguments(decoded)) {
      pushParsedJson(jsonString, roots);
    }
    for (const assignedJson of assignedJsonValues(decoded)) {
      pushParsedJson(assignedJson, roots);
    }
  }
  return roots;
}

function parseMacSeProductCards(html: string, sourceUrl: string, retrievedAt: string): MacSeProduct[] {
  const rows: MacSeProduct[] = [];
  const cardPattern =
    /<(article|li|div)\b(?=[^>]*(?:data-product-id|data-product-code|class=["'][^"']*(?:product|product-brief)[^"']*["']))[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(html)) !== null) {
    const openingTag = match[0]?.slice(0, match[0].indexOf('>') + 1) ?? '';
    const body = match[2] ?? '';
    const attrs = attributes(openingTag);
    const name =
      attr(attrs, ['data-product-name', 'aria-label']) ||
      textFromClass(body, ['product__name', 'product-name', 'product_name', 'product-title', 'product_brief__name']) ||
      stripTags(firstTag(body, ['h2', 'h3', 'a']));
    const priceText =
      attr(attrs, ['data-price']) ||
      textFromClass(body, ['product__price', 'product-price', 'price', 'product_brief__price']) ||
      stripTags(firstTag(body, ['span']));
    const price = numberFromText(priceText);
    if (!name || price === null) continue;

    const currency = attr(attrs, ['data-currency']) || (/\b(EUR|NOK|DKK|ISK)\b/i.exec(priceText)?.[1] ?? 'SEK');
    if (currency.toUpperCase() !== 'SEK') continue;

    const href = attr(attrs, ['data-url', 'data-product-url']) || firstHref(body);
    const productUrl = absoluteUrl(href, MAC_SE_BASE_URL) || sourceUrl;
    rows.push({
      country: 'SE',
      currency: 'SEK',
      chain: 'mac-se',
      code: attr(attrs, ['data-product-id', 'data-product-code', 'data-sku']) || stableCode(name, productUrl),
      name: decodeHtmlEntities(name),
      brand: attr(attrs, ['data-brand']) || 'MAC',
      category: 'beauty',
      price: roundMoney(price),
      priceText: normalizePriceText(priceText, price),
      productUrl,
      imageUrl: absoluteUrl(attr(attrs, ['data-image-url']) || firstImage(body), MAC_SE_BASE_URL),
      stockStatus: stockStatusFromText(body) || 'unknown',
      sourceUrl,
      retrievedAt
    });
  }
  return rows;
}

function addRows(rows: MacSeProduct[], seen: Set<string>, candidates: readonly MacSeProduct[], maxRows?: number): void {
  for (const row of candidates) {
    const key = row.code || `${row.name.toLowerCase()}:${row.price}:${row.productUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    if (maxRows && rows.length >= maxRows) return;
  }
}

function looksLikeProductCandidate(candidate: MacSeCandidate): boolean {
  const type = firstText(candidate, ['@type', 'type']).toLowerCase();
  if (type === 'product' || type.includes('product')) return true;
  return Boolean(
    firstText(candidate, ['sku', 'productId', 'product_id', 'productCode']) &&
      firstText(candidate, ['name', 'productName', 'displayName', 'title'])
  );
}

function priceTextFromCandidate(candidate: MacSeCandidate, price: number): string {
  const explicit =
    firstText(candidate, ['priceText', 'formattedPrice', 'currentPriceText']) ||
    nestedText(candidate, ['price', 'formatted']) ||
    nestedText(candidate, ['offers', 'priceText']);
  return normalizePriceText(explicit, price);
}

function normalizePriceText(value: string, price: number): string {
  const clean = decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
  if (clean) return clean;
  return `${roundMoney(price).toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} kr`;
}

function brandFromCandidate(candidate: MacSeCandidate): string {
  const direct = text(candidate.brand);
  if (direct) return direct;
  if (candidate.brand && typeof candidate.brand === 'object') {
    return firstText(candidate.brand as Record<string, unknown>, ['name', 'displayName']);
  }
  return firstText(candidate, ['brandName', 'manufacturer']);
}

function imageFromCandidate(candidate: MacSeCandidate): string {
  const direct = firstText(candidate, ['imageUrl', 'image_url', 'image', 'thumbnail', 'smallImage']);
  if (direct) return absoluteUrl(direct, MAC_SE_BASE_URL);
  const image = candidate.image;
  if (Array.isArray(image)) {
    return absoluteUrl(image.find((value) => text(value)), MAC_SE_BASE_URL);
  }
  if (image && typeof image === 'object') {
    return absoluteUrl(firstText(image as Record<string, unknown>, ['url', 'src']), MAC_SE_BASE_URL);
  }
  return '';
}

function stockStatusFromCandidate(candidate: MacSeCandidate): string {
  const availability =
    firstText(candidate, ['availability', 'stockStatus', 'inventoryStatus']) || nestedText(candidate, ['offers', 'availability']);
  if (!availability) return 'unknown';
  return availability.split('/').pop()?.trim().toLowerCase() || availability.toLowerCase();
}

function stockStatusFromText(value: string): string {
  const stripped = stripTags(value).toLowerCase();
  if (stripped.includes('out of stock') || stripped.includes('slut i lager')) return 'out_of_stock';
  if (stripped.includes('in stock') || stripped.includes('i lager')) return 'in_stock';
  return '';
}

function scriptContents(html: string): string[] {
  const scripts: string[] = [];
  const pattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    scripts.push(match[1] ?? '');
  }
  return scripts;
}

function pushParsedJson(value: string, roots: unknown[]): void {
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return;
  try {
    roots.push(JSON.parse(trimmed) as unknown);
  } catch {
    // Ignore scripts that are not standalone JSON payloads.
  }
}

function jsonParseArguments(script: string): string[] {
  const values: string[] = [];
  const marker = 'JSON.parse(';
  let searchFrom = 0;
  while (true) {
    const start = script.indexOf(marker, searchFrom);
    if (start === -1) return values;
    const quoteStart = firstQuoteAfter(script, start + marker.length);
    if (quoteStart === -1) return values;
    const quote = script[quoteStart] ?? "'";
    const quoteEnd = findStringEnd(script, quoteStart, quote);
    if (quoteEnd === -1) return values;
    values.push(decodeJsString(script.slice(quoteStart + 1, quoteEnd)));
    searchFrom = quoteEnd + 1;
  }
}

function assignedJsonValues(script: string): string[] {
  const values: string[] = [];
  const assignmentPattern = /(?:window\.)?__[A-Z0-9_]*MAC[A-Z0-9_]*__\s*=\s*([{[])/gi;
  let match: RegExpExecArray | null;
  while ((match = assignmentPattern.exec(script)) !== null) {
    const start = (match.index ?? 0) + (match[0]?.lastIndexOf(match[1] ?? '') ?? 0);
    try {
      const end = findBalancedEnd(script, start);
      values.push(script.slice(start, end + 1));
      assignmentPattern.lastIndex = end + 1;
    } catch {
      assignmentPattern.lastIndex = start + 1;
    }
  }
  return values;
}

function firstNumber(candidate: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const direct = normalizeNestedPrice(candidate[key]);
    if (direct !== null) return direct;
    const nested = nestedNumber(candidate, ['offers', key]) ?? nestedNumber(candidate, ['price', key]);
    if (nested !== null) return nested;
  }
  return null;
}

function normalizeNestedPrice(value: unknown): number | null {
  if (value && typeof value === 'object') {
    return firstNumber(value as Record<string, unknown>, ['amount', 'value', 'inclVat', 'current', 'price']);
  }
  return numberFromText(value);
}

function nestedNumber(candidate: Record<string, unknown>, path: readonly string[]): number | null {
  let value: unknown = candidate;
  for (const key of path) {
    if (!value || typeof value !== 'object') return null;
    value = (value as Record<string, unknown>)[key];
  }
  return numberFromText(value);
}

function firstText(candidate: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = text(candidate[key]);
    if (value) return value;
    const nested = nestedText(candidate, ['offers', key]) || nestedText(candidate, ['price', key]);
    if (nested) return nested;
  }
  return '';
}

function nestedText(candidate: Record<string, unknown>, path: readonly string[]): string {
  let value: unknown = candidate;
  for (const key of path) {
    if (!value || typeof value !== 'object') return '';
    value = (value as Record<string, unknown>)[key];
  }
  return text(value);
}

function visit(value: unknown, onObject: (value: Record<string, unknown>) => void): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) visit(item, onObject);
    return;
  }
  onObject(value as Record<string, unknown>);
  for (const item of Object.values(value)) visit(item, onObject);
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'sv-SE,sv;q=0.9,en;q=0.7',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function attributes(openingTag: string): Record<string, string> {
  const result: Record<string, string> = {};
  const attrPattern = /([:\w-]+)\s*=\s*(['"])(.*?)\2/g;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(openingTag)) !== null) {
    if (match[1]) result[match[1].toLowerCase()] = decodeHtmlEntities(match[3] ?? '');
  }
  return result;
}

function attr(attrs: Record<string, string>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = attrs[key.toLowerCase()];
    if (value) return value.trim();
  }
  return '';
}

function textFromClass(html: string, classes: readonly string[]): string {
  for (const className of classes) {
    const escaped = className.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`<[^>]+class=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
    const value = stripTags(pattern.exec(html)?.[1] ?? '');
    if (value) return value;
  }
  return '';
}

function firstTag(html: string, tags: readonly string[]): string {
  for (const tag of tags) {
    const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(html);
    const value = match?.[1] ?? '';
    if (value) return value;
  }
  return '';
}

function firstHref(html: string): string {
  const match = /<a\b[^>]*href=(["'])(.*?)\1/i.exec(html);
  return decodeHtmlEntities(match?.[2] ?? '');
}

function firstImage(html: string): string {
  const match = /<img\b[^>]*\bsrc=(["'])(.*?)\1/i.exec(html);
  return decodeHtmlEntities(match?.[2] ?? '');
}

function stripTags(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const url = text(value);
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : new URL(url, baseUrl).toString();
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = text(value)
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function stableCode(name: string, productUrl: string): string {
  return `${name}:${productUrl}`
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isBlockedPage(html: string): boolean {
  const text = stripTags(html).toLowerCase();
  return text.includes('captcha') || text.includes('access denied') || text.includes('request blocked');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function firstQuoteAfter(value: string, start: number): number {
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (char === "'" || char === '"') return index;
    if (char && !/\s/.test(char)) return -1;
  }
  return -1;
}

function findStringEnd(value: string, quoteStart: number, quote = "'"): number {
  let escaped = false;
  for (let index = quoteStart + 1; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === quote) {
      return index;
    }
  }
  return -1;
}

function decodeJsString(value: string): string {
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      decoded += char;
      continue;
    }
    index += 1;
    const escaped = value[index];
    if (escaped === undefined) decoded += '\\';
    else if (escaped === 'n') decoded += '\n';
    else if (escaped === 'r') decoded += '\r';
    else if (escaped === 't') decoded += '\t';
    else if (escaped === 'b') decoded += '\b';
    else if (escaped === 'f') decoded += '\f';
    else if (escaped === 'u') {
      const hex = value.slice(index + 1, index + 5);
      decoded += /^[\da-f]{4}$/i.test(hex) ? String.fromCharCode(Number.parseInt(hex, 16)) : `\\u${hex}`;
      index += 4;
    } else if (escaped === 'x') {
      const hex = value.slice(index + 1, index + 3);
      decoded += /^[\da-f]{2}$/i.test(hex) ? String.fromCharCode(Number.parseInt(hex, 16)) : `\\x${hex}`;
      index += 2;
    } else {
      decoded += escaped;
    }
  }
  return decoded;
}

function findBalancedEnd(value: string, start: number): number {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Could not find balanced JSON fragment end');
}
