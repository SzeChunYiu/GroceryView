export type BootsNoProductRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'boots-no';
  store_id?: string;
  product_name: string;
  price_nok: number;
  unit: string;
  observed_at: string;
  source_url: string;
  channel?: 'online' | 'store';
  is_member_price?: boolean;
  is_coupon_price?: boolean;
  multi_buy?: string;
};

type BootsNoCandidate = Record<string, unknown>;

export type FetchBootsNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  observedAt?: string;
};

export const BOOTS_NO_BASE_URL = 'https://www.boots.no';
export const DEFAULT_BOOTS_NO_SOURCE_URLS = [
  'https://www.boots.no/produkter/kosttilskudd',
  'https://www.boots.no/produkter/kosttilskudd/vitaminer',
  'https://www.boots.no/produkter/kosttilskudd/mineraler',
  'https://www.boots.no/drikke',
  'https://www.boots.no/mat'
] as const;

export async function fetchBootsNoProducts(options: FetchBootsNoProductsOptions = {}): Promise<BootsNoProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const rows: BootsNoProductRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_BOOTS_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Boots NO source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Boots NO request failed for ${sourceUrl}: ${response.status}`);
    for (const row of parseBootsNoProducts(await response.text(), sourceUrl, observedAt)) {
      const key = `${row.store_id ?? ''}:${row.product_name.toLowerCase()}:${row.price_nok}:${row.unit}:${row.source_url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseBootsNoProducts(html: string, sourceUrl: string, observedAt: string): BootsNoProductRow[] {
  if (/captcha|access denied|cloudflare|logg inn/i.test(textFromHtml(html))) throw new Error('Boots NO source returned a blocked/login page.');
  const rows: BootsNoProductRow[] = [];
  const seen = new Set<string>();

  for (const root of extractBootsNoJsonRoots(html)) {
    visit(root, (value) => {
      const row = normalizeBootsNoCandidate(value, sourceUrl, observedAt);
      if (!row) return;
      const key = `${row.store_id ?? ''}:${row.product_name.toLowerCase()}:${row.price_nok}:${row.unit}:${row.source_url}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    });
  }

  for (const row of parseBootsNoProductCards(html, sourceUrl, observedAt)) {
    const key = `${row.store_id ?? ''}:${row.product_name.toLowerCase()}:${row.price_nok}:${row.unit}:${row.source_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }

  return rows;
}

export function normalizeBootsNoCandidate(candidate: BootsNoCandidate, sourceUrl: string, observedAt: string): BootsNoProductRow | null {
  if (isPrescriptionOnly(candidate)) return null;
  const productName = firstText(candidate, ['product_name', 'productName', 'displayName', 'name', 'title']);
  const priceNok = firstNumber(candidate, ['price_nok', 'priceNok', 'currentPrice', 'salesPrice', 'salePrice', 'sellingPrice', 'price']);
  if (!productName || priceNok === null) return null;

  const currency = firstText(candidate, ['currency', 'currencyCode']) || nestedText(candidate, ['price', 'currency']) || 'NOK';
  if (currency.toUpperCase() !== 'NOK') return null;

  const row: BootsNoProductRow = {
    country: 'NO',
    currency: 'NOK',
    chain: 'boots-no',
    product_name: productName,
    price_nok: roundMoney(priceNok),
    unit: firstText(candidate, ['unit', 'packageUnit', 'packageSize', 'packageText', 'quantity', 'size', 'netContent']) || unitFromName(productName),
    observed_at: observedAt,
    source_url: absoluteUrl(firstText(candidate, ['source_url', 'sourceUrl', 'url', 'href', 'productUrl', 'canonicalUrl']), BOOTS_NO_BASE_URL) || sourceUrl
  };
  const storeId = firstText(candidate, ['store_id', 'storeId']);
  if (storeId) row.store_id = storeId;
  applyPricingFlags(row, candidate);
  return row;
}

export function extractBootsNoJsonRoots(html: string): unknown[] {
  const roots: unknown[] = [];
  for (const script of scriptContents(html)) {
    const decoded = decodeHtmlEntities(script.trim());
    pushParsedJson(decoded, roots);
    for (const jsonString of jsonParseArguments(decoded)) pushParsedJson(jsonString, roots);
  }
  return roots;
}

function parseBootsNoProductCards(html: string, sourceUrl: string, observedAt: string): BootsNoProductRow[] {
  const rows: BootsNoProductRow[] = [];
  const cards = html.match(/<(?:article|li|div)\b[^>]*(?:product|produkt|item|card)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi) ?? [];
  for (const card of cards) {
    const productName = textFromHtml(firstMatch(card, [/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i, /data-name=["']([^"']+)["']/i]));
    const priceText = textFromHtml(firstMatch(card, [/class=["'][^"']*(?:price|pris)[^"']*["'][^>]*>([\s\S]*?)</i, /data-price=["']([^"']+)["']/i]));
    const priceNok = numberFromNorwegianPrice(priceText);
    if (!productName || priceNok === null || /resept|recept|prescription/i.test(card)) continue;
    rows.push({
      country: 'NO',
      currency: 'NOK',
      chain: 'boots-no',
      product_name: productName,
      price_nok: priceNok,
      unit: unitFromName(productName),
      observed_at: observedAt,
      source_url: absoluteUrl(firstMatch(card, [/href=["']([^"']+)["']/i]), sourceUrl) || sourceUrl,
      channel: 'online'
    });
  }
  return rows;
}

function scriptContents(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1] ?? '');
}

function pushParsedJson(value: string, roots: unknown[]): void {
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return;
  try { roots.push(JSON.parse(trimmed) as unknown); } catch { /* ignore non-JSON scripts */ }
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

function visit(value: unknown, callback: (candidate: BootsNoCandidate) => void): void {
  if (!value || typeof value !== 'object') return;
  if (!Array.isArray(value)) callback(value as BootsNoCandidate);
  for (const child of Array.isArray(value) ? value : Object.values(value)) visit(child, callback);
}

function firstText(candidate: BootsNoCandidate, keys: string[]): string {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim()) return decodeHtmlEntities(value.trim());
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function nestedText(candidate: BootsNoCandidate, path: string[]): string {
  let value: unknown = candidate;
  for (const key of path) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === 'string' ? value : '';
}

function firstNumber(candidate: BootsNoCandidate, keys: string[]): number | null {
  for (const key of keys) {
    const value = candidate[key];
    const parsed = normalizeNestedPrice(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function normalizeNestedPrice(value: unknown): number | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return firstNumber(value as BootsNoCandidate, ['amount', 'value', 'inclVat', 'price', 'current', 'salesPrice']);
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  return numberFromNorwegianPrice(value);
}

function numberFromNorwegianPrice(value: string): number | null {
  const match = textFromHtml(value).replace(/\s/g, '').match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (!match) return null;
  const parsed = Number(match[1]!.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? roundMoney(parsed) : null;
}

function isPrescriptionOnly(candidate: BootsNoCandidate): boolean {
  return /resept|recept|prescription|rx|legemiddel på resept/i.test(Object.values(candidate).filter((value) => typeof value === 'string').join(' '));
}

function applyPricingFlags(row: BootsNoProductRow, candidate: BootsNoCandidate): void {
  const campaign = firstText(candidate, ['campaignLabel', 'promotionText', 'offerText', 'badgeText']);
  const member = firstText(candidate, ['memberPriceLabel', 'clubPriceLabel']);
  if (/medlem|club|kundeklubb/i.test(`${campaign} ${member}`)) row.is_member_price = true;
  if (/kode|kupong|coupon/i.test(campaign)) row.is_coupon_price = true;
  if (/\d+\s*for|[0-9]+\s*\/\s*[0-9]+|multi/i.test(campaign)) row.multi_buy = campaign;
  const channel = firstText(candidate, ['channel']);
  if (channel === 'online' || channel === 'store') row.channel = channel;
}

function unitFromName(productName: string): string {
  return productName.match(/(\d+(?:[,.]\d+)?\s*(?:ml|l|g|kg|stk|tabletter|kapsler|st))/i)?.[0] ?? 'each';
}

function firstMatch(value: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

function textFromHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try { return new URL(decodeHtmlEntities(value), baseUrl).toString(); } catch { return ''; }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'user-agent': 'GroceryView/0.1 boots-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function firstQuoteAfter(value: string, start: number): number {
  const single = value.indexOf("'", start);
  const double = value.indexOf('"', start);
  if (single === -1) return double;
  if (double === -1) return single;
  return Math.min(single, double);
}

function findStringEnd(value: string, start: number, quote: string): number {
  for (let index = start + 1; index < value.length; index += 1) {
    if (value[index] === '\\') {
      index += 1;
      continue;
    }
    if (value[index] === quote) return index;
  }
  return -1;
}

function decodeJsString(value: string): string {
  try { return JSON.parse(`"${value.replace(/"/g, '\\"')}"`) as string; } catch { return value; }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&oslash;/g, 'ø')
    .replace(/&aring;/g, 'å')
    .replace(/&aelig;/g, 'æ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}
