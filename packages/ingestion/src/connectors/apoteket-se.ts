export type ApoteketSeProductRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'apoteket';
  store_id?: string;
  product_name: string;
  price_sek: number;
  unit: string;
  observed_at: string;
  source_url: string;
};

type ApoteketSeCandidate = Record<string, unknown>;

export type FetchApoteketSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  observedAt?: string;
};

export const APOTEKET_SE_BASE_URL = 'https://www.apoteket.se';

export const DEFAULT_APOTEKET_SE_SOURCE_URLS = [
  'https://www.apoteket.se/sok/?q=vitamin',
  'https://www.apoteket.se/kategori/kosttillskott-vitaminer/',
  'https://www.apoteket.se/kategori/mat-dryck/',
  'https://www.apoteket.se/kategori/mun-tander/tandkram/',
  'https://www.apoteket.se/kategori/sol/solskydd/'
] as const;

export async function fetchApoteketSeProducts(options: FetchApoteketSeProductsOptions = {}): Promise<ApoteketSeProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const rows: ApoteketSeProductRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_APOTEKET_SE_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Apoteket request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const row of parseApoteketSeProducts(await response.text(), sourceUrl, observedAt)) {
      const key = `${row.store_id ?? ''}:${row.product_name.toLowerCase()}:${row.price_sek}:${row.unit}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseApoteketSeProducts(html: string, sourceUrl: string, observedAt: string): ApoteketSeProductRow[] {
  const rows: ApoteketSeProductRow[] = [];
  const seen = new Set<string>();

  for (const root of extractApoteketJsonRoots(html)) {
    visit(root, (value) => {
      const row = normalizeApoteketCandidate(value, sourceUrl, observedAt);
      if (!row) return;
      const key = `${row.store_id ?? ''}:${row.product_name.toLowerCase()}:${row.price_sek}:${row.unit}:${row.source_url}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    });
  }

  return rows;
}

export function normalizeApoteketCandidate(candidate: ApoteketSeCandidate, sourceUrl: string, observedAt: string): ApoteketSeProductRow | null {
  if (isPrescriptionOnly(candidate)) return null;
  const productName = firstText(candidate, ['product_name', 'productName', 'displayName', 'name', 'title']);
  const priceSek = firstNumber(candidate, ['price_sek', 'priceSek', 'currentPrice', 'salesPrice', 'salePrice', 'sellingPrice', 'price']);
  if (!productName || priceSek === null) return null;

  const currency = firstText(candidate, ['currency', 'currencyCode']) || nestedText(candidate, ['price', 'currency']) || 'SEK';
  if (currency.toUpperCase() !== 'SEK') return null;

  const unit = firstText(candidate, ['unit', 'packageUnit', 'packageSize', 'packageText', 'quantity', 'size', 'netContent']) || unitFromName(productName);
  const row: ApoteketSeProductRow = {
    country: 'SE',
    currency: 'SEK',
    chain: 'apoteket',
    product_name: productName,
    price_sek: roundMoney(priceSek),
    unit,
    observed_at: observedAt,
    source_url: absoluteUrl(firstText(candidate, ['source_url', 'sourceUrl', 'url', 'href', 'productUrl', 'canonicalUrl']), APOTEKET_SE_BASE_URL) || sourceUrl
  };
  const storeId = firstText(candidate, ['store_id', 'storeId']);
  if (storeId) row.store_id = storeId;
  return row;
}

export function extractApoteketJsonRoots(html: string): unknown[] {
  const roots: unknown[] = [];
  for (const script of scriptContents(html)) {
    const decoded = decodeHtmlEntities(script.trim());
    pushParsedJson(decoded, roots);
    for (const jsonString of jsonParseArguments(decoded)) {
      pushParsedJson(jsonString, roots);
    }
    for (const flightPayload of nextFlightPayloads(decoded)) {
      pushParsedJson(flightPayload, roots);
      for (const nested of jsonLikeSubstrings(flightPayload)) {
        pushParsedJson(nested, roots);
      }
    }
  }
  return roots;
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
    // Script contents can include Next.js flight records as well as JSON; ignore non-JSON fragments.
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

function nextFlightPayloads(script: string): string[] {
  const values: string[] = [];
  const marker = 'self.__next_f.push(';
  let searchFrom = 0;
  while (true) {
    const start = script.indexOf(marker, searchFrom);
    if (start === -1) return values;
    const payloadStart = start + marker.length;
    const end = findCallArgumentEnd(script, payloadStart);
    if (end === -1) return values;
    try {
      const payload = JSON.parse(script.slice(payloadStart, end)) as unknown;
      visit(payload, (value) => {
        for (const item of Object.values(value)) {
          if (typeof item === 'string' && (item.includes('{') || item.includes('['))) {
            values.push(item);
          }
        }
      });
      if (Array.isArray(payload)) {
        for (const item of payload) {
          if (typeof item === 'string' && (item.includes('{') || item.includes('['))) values.push(item);
        }
      }
    } catch {
      // Ignore non-JSON flight fragments.
    }
    searchFrom = end + 1;
  }
}

function jsonLikeSubstrings(value: string): string[] {
  const substrings: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '{' && char !== '[') continue;
    try {
      const end = findBalancedEnd(value, index);
      substrings.push(value.slice(index, end + 1));
      index = end;
    } catch {
      // Continue searching after unbalanced fragments.
    }
  }
  return substrings;
}

function normalizeApoteketNestedPrice(value: unknown): number | null {
  if (value && typeof value === 'object') {
    return firstNumber(value as Record<string, unknown>, ['amount', 'value', 'inclVat', 'price', 'current', 'salesPrice']);
  }
  return numberFromText(value);
}

function firstNumber(candidate: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const direct = normalizeApoteketNestedPrice(candidate[key]);
    if (direct !== null) return direct;
    const nested = nestedNumber(candidate, ['price', key]) ?? nestedNumber(candidate, ['currentPrice', key]) ?? nestedNumber(candidate, ['salesPrice', key]);
    if (nested !== null) return nested;
  }
  return null;
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

function isPrescriptionOnly(candidate: Record<string, unknown>): boolean {
  for (const key of ['isPrescriptionProduct', 'prescriptionOnly', 'requiresPrescription', 'isRx', 'rx']) {
    if (candidate[key] === true) return true;
  }
  const availability = firstText(candidate, ['availability', 'productType', 'type']).toLowerCase();
  return availability.includes('receptbel') || availability.includes('prescription');
}

function unitFromName(name: string): string {
  const match = name.match(/(\d+(?:[,.]\d+)?)\s*(ml|cl|l|g|kg|st|styck|tabletter|tablett|kapslar|kapsel|portioner|pack)\b/i);
  if (!match) return 'st';
  const amount = match[1]?.replace(',', '.') ?? '1';
  const rawUnit = (match[2] ?? 'st').toLowerCase();
  const unit = rawUnit === 'styck' ? 'st' : rawUnit;
  return `${amount} ${unit}`;
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
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
  const normalized = text(value).replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
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

function findCallArgumentEnd(value: string, start: number): number {
  let bracketDepth = 0;
  let braceDepth = 0;
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
    else if (char === '[') bracketDepth += 1;
    else if (char === ']') bracketDepth -= 1;
    else if (char === '{') braceDepth += 1;
    else if (char === '}') braceDepth -= 1;
    else if (char === ')' && bracketDepth === 0 && braceDepth === 0) return index;
  }
  return -1;
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
