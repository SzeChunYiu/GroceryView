export type DocmorrisSeProductRow = {
  chain: 'docmorris';
  requested_market: 'SE';
  fulfillment_market: 'DE';
  channel: 'online';
  currency: 'EUR';
  product_name: string;
  price_eur: number;
  unit: string;
  source_url: string;
  observed_at: string;
  list_price_eur?: number;
  base_price_text?: string;
  discount_percent?: number;
  promotion_tags: string[];
  is_coupon_listing: boolean;
  is_bundle: boolean;
  loyalty_points_base: number;
  loyalty_points_app: number;
};

type DocmorrisCandidate = Record<string, unknown>;

export type FetchDocmorrisSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  observedAt?: string;
};

export const DOCMORRIS_SE_DISCOVERY_URL = 'http://docmorris.se/';
export const DOCMORRIS_DE_BASE_URL = 'https://www.docmorris.de';

export const DEFAULT_DOCMORRIS_SE_SOURCE_URLS = [
  'https://www.docmorris.de/angebote',
  'https://www.docmorris.de/angebote/couponartikel',
  'https://www.docmorris.de/angebote/sparsets'
] as const;

export async function fetchDocmorrisSeProducts(options: FetchDocmorrisSeProductsOptions = {}): Promise<DocmorrisSeProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const rows: DocmorrisSeProductRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_DOCMORRIS_SE_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`DocMorris request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const row of parseDocmorrisSeProducts(await response.text(), sourceUrl, observedAt)) {
      const key = `${row.product_name.toLowerCase()}:${row.price_eur}:${row.unit}:${row.source_url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseDocmorrisSeProducts(html: string, sourceUrl: string, observedAt: string): DocmorrisSeProductRow[] {
  const rows: DocmorrisSeProductRow[] = [];
  const seen = new Set<string>();

  for (const root of extractJsonRoots(html)) {
    visit(root, (value) => {
      const row = normalizeDocmorrisCandidate(value, sourceUrl, observedAt);
      if (!row) return;
      const key = `${row.product_name.toLowerCase()}:${row.price_eur}:${row.unit}:${row.source_url}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(row);
    });
  }

  for (const card of extractListingCards(html, sourceUrl)) {
    const row = normalizeDocmorrisCard(card, sourceUrl, observedAt);
    if (!row) continue;
    const key = `${row.product_name.toLowerCase()}:${row.price_eur}:${row.unit}:${row.source_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }

  return rows;
}

export function normalizeDocmorrisCandidate(
  candidate: DocmorrisCandidate,
  sourceUrl: string,
  observedAt: string
): DocmorrisSeProductRow | null {
  const productName = firstText(candidate, ['product_name', 'productName', 'displayName', 'name', 'title']);
  const priceEur = firstNumber(candidate, ['price_eur', 'priceEur', 'salePrice', 'sellingPrice', 'currentPrice', 'price']);
  if (!productName || priceEur === null) return null;

  const currency = firstText(candidate, ['currency', 'currencyCode'])
    || nestedText(candidate, ['price', 'currency'])
    || nestedText(candidate, ['currentPrice', 'currency'])
    || 'EUR';
  if (currency.toUpperCase() !== 'EUR') return null;

  const listPriceEur = firstNumber(candidate, ['list_price_eur', 'listPriceEur', 'strikePrice', 'oldPrice', 'originalPrice', 'rrp']);
  const basePriceText = firstText(candidate, ['base_price_text', 'basePriceText', 'basePrice', 'pricePerUnit', 'unitPrice']);
  const discountPercent = firstPercent(candidate, ['discount_percent', 'discountPercent', 'discount', 'badge', 'discountLabel']);
  const source = absoluteUrl(firstText(candidate, ['source_url', 'sourceUrl', 'url', 'href', 'productUrl', 'canonicalUrl']), DOCMORRIS_DE_BASE_URL) || sourceUrl;
  const unit = firstText(candidate, ['unit', 'packageUnit', 'packageSize', 'packageText', 'quantity', 'size', 'netContent']) || unitFromName(productName);
  const promotionTags = promotionTagsFrom(candidate, sourceUrl, productName);
  const isBundle = booleanFrom(candidate, ['is_bundle', 'isBundle', 'bundle']) ?? looksLikeBundle(`${productName} ${unit}`, sourceUrl);

  return withDerivedFields(
    {
      chain: 'docmorris',
      requested_market: 'SE',
      fulfillment_market: 'DE',
      channel: 'online',
      currency: 'EUR',
      product_name: productName,
      price_eur: roundMoney(priceEur),
      unit,
      source_url: source,
      observed_at: observedAt,
      promotion_tags: promotionTags,
      is_coupon_listing: isCouponSource(sourceUrl) || promotionTags.some((tag) => /coupon/i.test(tag)),
      is_bundle: isBundle,
      loyalty_points_base: 0,
      loyalty_points_app: 0
    },
    listPriceEur,
    basePriceText,
    discountPercent
  );
}

type ListingCard = {
  href: string;
  text: string;
};

function normalizeDocmorrisCard(card: ListingCard, sourceUrl: string, observedAt: string): DocmorrisSeProductRow | null {
  if (!/Verkaufspreis\s*:/i.test(card.text) || !/€/.test(card.text)) return null;
  const priceEur = numberAfter(card.text, /Verkaufspreis\s*:\s*/i);
  if (priceEur === null) return null;

  const listPriceEur = numberBefore(card.text, /€\s*\*\s*Verkaufspreis/i);
  const name = extractNameFromCardText(card.text, listPriceEur);
  if (!name) return null;

  const unit = unitFromName(name);
  const basePriceText = firstMatch(card.text, /Grundpreis\s*:\s*([^+]+?\/(?:kg|l|St|ml|g))\b/i);
  const discountPercent = integerFrom(firstMatch(card.text, /Rabattstempel\s*-\s*(\d+)\s*%/i));
  const promotionTags = discountPercent === null ? [] : [`Rabattstempel -${discountPercent}%`];
  if (isCouponSource(sourceUrl)) promotionTags.push('Couponartikel');
  if (isBundleSource(sourceUrl)) promotionTags.push('Sparset');

  return withDerivedFields(
    {
      chain: 'docmorris',
      requested_market: 'SE',
      fulfillment_market: 'DE',
      channel: 'online',
      currency: 'EUR',
      product_name: name,
      price_eur: roundMoney(priceEur),
      unit,
      source_url: absoluteUrl(card.href, DOCMORRIS_DE_BASE_URL) || sourceUrl,
      observed_at: observedAt,
      promotion_tags,
      is_coupon_listing: isCouponSource(sourceUrl),
      is_bundle: looksLikeBundle(name, sourceUrl),
      loyalty_points_base: 0,
      loyalty_points_app: 0
    },
    listPriceEur,
    basePriceText,
    discountPercent
  );
}

function withDerivedFields(
  row: DocmorrisSeProductRow,
  listPriceEur: number | null,
  basePriceText: string,
  discountPercent: number | null
): DocmorrisSeProductRow {
  const next = { ...row };
  next.loyalty_points_base = Math.floor(next.price_eur * 10);
  next.loyalty_points_app = Math.floor(next.price_eur * 15);
  if (listPriceEur !== null) next.list_price_eur = roundMoney(listPriceEur);
  if (basePriceText) next.base_price_text = basePriceText.replace(/\s+/g, ' ').trim();
  if (discountPercent !== null) next.discount_percent = discountPercent;
  return next;
}

function extractJsonRoots(html: string): unknown[] {
  const roots: unknown[] = [];
  const pattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const script = decodeHtml(match[1] ?? '').trim();
    pushParsedJson(script, roots);
    for (const jsonString of jsonParseArguments(script)) pushParsedJson(jsonString, roots);
  }
  return roots;
}

function pushParsedJson(value: string, roots: unknown[]): void {
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return;
  try {
    roots.push(JSON.parse(trimmed) as unknown);
  } catch {
    // Ignore scripts that are not standalone JSON.
  }
}

function jsonParseArguments(script: string): string[] {
  const values: string[] = [];
  const pattern = /JSON\.parse\((['"])((?:\\.|(?!\1)[\s\S])*)\1\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(script)) !== null) {
    values.push(decodeJsString(match[2] ?? ''));
  }
  return values;
}

function extractListingCards(html: string, sourceUrl: string): ListingCard[] {
  const cards: ListingCard[] = [];
  const pattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const text = decodeHtml(stripTags(match[2] ?? ''));
    if (!/Verkaufspreis\s*:/i.test(text)) continue;
    cards.push({ href: absoluteUrl(match[1] ?? '', sourceUrl), text });
  }
  return cards;
}

function visit(value: unknown, callback: (value: DocmorrisCandidate) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as DocmorrisCandidate;
  callback(record);
  for (const nested of Object.values(record)) visit(nested, callback);
}

function firstText(candidate: DocmorrisCandidate, keys: readonly string[]): string {
  for (const key of keys) {
    const value = textFromUnknown(candidate[key]);
    if (value) return value;
    const nested = nestedText(candidate, ['price', key]) || nestedText(candidate, ['product', key]);
    if (nested) return nested;
  }
  return '';
}

function nestedText(candidate: DocmorrisCandidate, path: readonly string[]): string {
  let value: unknown = candidate;
  for (const key of path) {
    if (!value || typeof value !== 'object') return '';
    value = (value as DocmorrisCandidate)[key];
  }
  return textFromUnknown(value);
}

function textFromUnknown(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function firstNumber(candidate: DocmorrisCandidate, keys: readonly string[]): number | null {
  for (const key of keys) {
    const direct = numberFromUnknown(candidate[key]);
    if (direct !== null) return direct;
    const nested = nestedNumber(candidate, ['price', key])
      ?? nestedNumber(candidate, ['currentPrice', key])
      ?? nestedNumber(candidate, ['salePrice', key]);
    if (nested !== null) return nested;
  }
  return null;
}

function nestedNumber(candidate: DocmorrisCandidate, path: readonly string[]): number | null {
  let value: unknown = candidate;
  for (const key of path) {
    if (!value || typeof value !== 'object') return null;
    value = (value as DocmorrisCandidate)[key];
  }
  return numberFromUnknown(value);
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') return numberFromText(value);
  if (value && typeof value === 'object') {
    return firstNumber(value as DocmorrisCandidate, ['amount', 'value', 'inclVat', 'current', 'price', 'gross']);
  }
  return null;
}

function firstPercent(candidate: DocmorrisCandidate, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'number' && Number.isFinite(value)) return Math.abs(Math.trunc(value));
    const text = textFromUnknown(value);
    const percent = integerFrom(firstMatch(text, /-?\s*(\d+)\s*%/));
    if (percent !== null) return percent;
  }
  return null;
}

function promotionTagsFrom(candidate: DocmorrisCandidate, sourceUrl: string, name: string): string[] {
  const values = [candidate.promotions, candidate.promotionTags, candidate.badges, candidate.labels].flatMap((value) => {
    if (Array.isArray(value)) return value.map(textFromUnknown).filter(Boolean);
    const text = textFromUnknown(value);
    return text ? [text] : [];
  });
  if (isCouponSource(sourceUrl)) values.push('Couponartikel');
  if (looksLikeBundle(name, sourceUrl)) values.push('Sparset');
  return Array.from(new Set(values));
}

function booleanFrom(candidate: DocmorrisCandidate, keys: readonly string[]): boolean | null {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (/^(true|yes|1)$/i.test(value)) return true;
      if (/^(false|no|0)$/i.test(value)) return false;
    }
  }
  return null;
}

function numberAfter(text: string, marker: RegExp): number | null {
  const start = text.search(marker);
  if (start === -1) return null;
  return numberFromText(text.slice(start).replace(marker, ''));
}

function numberBefore(text: string, marker: RegExp): number | null {
  const index = text.search(marker);
  if (index === -1) return null;
  const prefix = text.slice(0, index);
  const matches = [...prefix.matchAll(/\d{1,3}(?:[.,]\d{2})/g)];
  const last = matches.at(-1)?.[0];
  return last ? numberFromText(last) : null;
}

function extractNameFromCardText(text: string, listPriceEur: number | null): string {
  const marker = listPriceEur === null ? /\s+Verkaufspreis\s*:/i : new RegExp(`\\s+${escapeRegExp(formatGermanMoney(listPriceEur))}\\s*€\\s*\\*\\s*Verkaufspreis`, 'i');
  return text.split(marker)[0]?.replace(/\s+/g, ' ').trim() ?? '';
}

function firstMatch(value: string, pattern: RegExp): string {
  return pattern.exec(value)?.[1]?.trim() ?? '';
}

function integerFrom(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberFromText(value: string): number | null {
  const match = /\d+(?:[.,]\d+)?/.exec(value.replace(/\s/g, ''));
  if (!match) return null;
  const raw = match[0];
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function unitFromName(name: string): string {
  const match = /(?:^|\s)((?:\d+\s*[xX]\s*)?\d+(?:[,.]\d+)?\s*(?:ml|l|g|kg|St|St\.|Stück|Kapseln|Tabletten|Filmtabletten|Beutel))\b/i.exec(name);
  return match?.[1]?.replace(/\s+/g, ' ').trim() ?? '1 St';
}

function isCouponSource(sourceUrl: string): boolean {
  return /couponartikel/i.test(sourceUrl);
}

function isBundleSource(sourceUrl: string): boolean {
  return /sparsets/i.test(sourceUrl);
}

function looksLikeBundle(value: string, sourceUrl: string): boolean {
  return isBundleSource(sourceUrl) || /\b(?:\d+\s*[xX]\s*\d+|Doppelpack|Spar-Angebot|Sparset|Set)\b/i.test(value);
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeJsString(value: string): string {
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return value.replace(/\\([\\'"/bfnrt])/g, '$1');
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatGermanMoney(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'accept-language': 'de-DE,de;q=0.9,en;q=0.5',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}
