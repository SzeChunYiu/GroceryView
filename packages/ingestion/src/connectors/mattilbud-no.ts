import { Buffer } from 'node:buffer';

export const MATTILBUD_NO_HOME_URL = 'https://mattilbud.no/';
export const MATTILBUD_NO_TERMS_URL = 'https://tjek.com/terms';
export const MATTILBUD_NO_PARSER_VERSION = 'mattilbud-no-tjek-v1';

export type MattilbudNoOfferAccess = 'offers_parsed' | 'not_embedded_public_homepage';

export type MattilbudNoChainCoverageRow = {
  country: 'NO';
  publicId: string;
  name: string;
  slug: string;
  chain: string;
  publicationCount: number | null;
  positiveLogotype: string;
  negativeLogotype: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: { source: 'mattilbud_no_public_app_data'; parserVersion: string; evidenceText: string };
};

export type MattilbudNoOfferRow = {
  country: 'NO';
  currency: 'NOK';
  chain: string;
  businessId: string;
  code: string;
  name: string;
  category: string;
  promotionType: 'weekly_flyer';
  price: number;
  priceText: string;
  comparePriceText: string;
  validFrom: string;
  validTo: string;
  flyerPage: number | null;
  publicationId: string;
  publicationUrl: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  canonicalProductKey: string;
  confidenceLabel: 'barcode' | 'source-id' | 'name-only';
  provenance: { source: 'mattilbud_no_tjek'; parserVersion: string; evidenceText: string };
};

export type MattilbudNoAccessReport = {
  sourceUrl: string;
  termsUrl: string;
  retrievedAt: string;
  offerAccess: MattilbudNoOfferAccess;
  coverageRows: MattilbudNoChainCoverageRow[];
  offerRows: MattilbudNoOfferRow[];
  blocker: string;
  provenance: { source: 'mattilbud_no_public_app_data'; parserVersion: string; evidenceText: string };
};

export type FetchMattilbudNoAccessReportOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export type MattilbudNoAppDataEntry = {
  key: unknown;
  payload: unknown;
};

type OfferCandidate = {
  candidate: Record<string, unknown>;
  context: Record<string, unknown>;
};

export async function fetchMattilbudNoAccessReport(options: FetchMattilbudNoAccessReportOptions = {}): Promise<MattilbudNoAccessReport> {
  const sourceUrl = options.sourceUrl ?? MATTILBUD_NO_HOME_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 mattilbud-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Mattilbud NO source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Mattilbud NO source failed with HTTP ${response.status}.`);
  return parseMattilbudNoAccessReport(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString(), options.maxRows);
}

export function parseMattilbudNoAccessReport(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): MattilbudNoAccessReport {
  if (!/mattilbud\.no/i.test(sourceUrl)) throw new Error('Mattilbud NO connector only accepts mattilbud.no source URLs.');
  if (/captcha|access denied|cloudflare|logg inn|login required/i.test(html)) {
    throw new Error('Mattilbud NO source returned a blocked/login page.');
  }

  const appData = extractMattilbudNoAppData(html);
  const coverageRows = parseMattilbudNoChainCoverage(appData, sourceUrl, retrievedAt);
  const offerRows = parseMattilbudNoOffers(appData.map((entry) => entry.payload), sourceUrl, retrievedAt, maxRows);
  const blocker = offerRows.length > 0
    ? ''
    : 'Mattilbud public homepage app-data exposes Norwegian chain coverage, but no offer/publication payloads; Tjek advertises API/feed access as an integration product and Mattilbud links Tjek terms.';

  return {
    sourceUrl,
    termsUrl: MATTILBUD_NO_TERMS_URL,
    retrievedAt,
    offerAccess: offerRows.length > 0 ? 'offers_parsed' : 'not_embedded_public_homepage',
    coverageRows,
    offerRows,
    blocker,
    provenance: {
      source: 'mattilbud_no_public_app_data',
      parserVersion: MATTILBUD_NO_PARSER_VERSION,
      evidenceText: appData.map((entry) => appDataKeyName(entry.key)).filter(Boolean).join(', ').slice(0, 240)
    }
  };
}

export function extractMattilbudNoAppData(html: string): MattilbudNoAppDataEntry[] {
  const entries: MattilbudNoAppDataEntry[] = [];
  for (const match of html.matchAll(/<app-data\b([^>]*)>([\s\S]*?)<\/app-data>/gi)) {
    const attrs = match[1] ?? '';
    const body = decodeHtml(match[2] ?? '').trim();
    const dataKey = firstMatch(attrs, [/data-key=["']([^"']+)["']/i]);
    const key = parseAppDataKey(dataKey);
    const payload = parseJson(body);
    if (payload !== null) entries.push({ key, payload });
  }
  return entries;
}

export function parseMattilbudNoChainCoverage(entries: MattilbudNoAppDataEntry[] | unknown, sourceUrl: string, retrievedAt: string): MattilbudNoChainCoverageRow[] {
  const payloads = Array.isArray(entries) && entries.every((entry) => isRecord(entry) && 'payload' in entry)
    ? entries.map((entry) => (entry as MattilbudNoAppDataEntry).payload)
    : [entries];
  const rows: MattilbudNoChainCoverageRow[] = [];
  const seen = new Set<string>();

  for (const candidate of collectRecords(payloads)) {
    const publicId = firstText(candidate, ['public_id', 'publicId', 'id', 'business_id', 'businessId']);
    const name = firstText(candidate, ['name', 'title', 'displayName']);
    const slug = firstText(candidate, ['slug', 'key']) || slugFor(name);
    if (!name || (!publicId && !slug) || !looksLikeBusiness(candidate)) continue;
    const key = publicId || slug;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      country: 'NO',
      publicId: publicId || slug,
      name,
      slug,
      chain: mattilbudNoChainSlug(slug || name),
      publicationCount: numberOrNull(firstDefined(candidate, ['publication_count', 'publicationCount', 'publications_count'])),
      positiveLogotype: absoluteUrl(firstNestedText(candidate, ['positive_logotype', 'positiveLogotype', 'logo', 'logotype'], ['url', 'src']), sourceUrl),
      negativeLogotype: absoluteUrl(firstNestedText(candidate, ['negative_logotype', 'negativeLogotype'], ['url', 'src']), sourceUrl),
      sourceUrl,
      retrievedAt,
      provenance: {
        source: 'mattilbud_no_public_app_data',
        parserVersion: MATTILBUD_NO_PARSER_VERSION,
        evidenceText: JSON.stringify(candidate).slice(0, 240)
      }
    });
  }
  return rows;
}

export function parseMattilbudNoOffers(payload: unknown, sourceUrl: string, retrievedAt: string, maxRows?: number): MattilbudNoOfferRow[] {
  const rows: MattilbudNoOfferRow[] = [];
  const seen = new Set<string>();

  for (const { candidate, context } of collectOfferCandidates([payload])) {
    const row = offerRowFromCandidate({ ...context, ...candidate }, sourceUrl, retrievedAt);
    if (!row) continue;
    const key = `${row.businessId}:${row.publicationId}:${row.code}:${row.price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    if (maxRows && rows.length >= maxRows) return rows;
  }
  return rows;
}

export function mattilbudNoChainSlug(value: string): string {
  const slug = slugFor(value);
  const known: Record<string, string> = {
    bunnpris: 'bunnpris-no',
    'coop-marked': 'coop-marked-no',
    'coop-mega': 'coop-mega-no',
    'coop-prix': 'coop-prix-no',
    eurospar: 'spar-no',
    europris: 'europris-no',
    extra: 'extra-no',
    gigaboks: 'gigaboks-no',
    holdbart: 'holdbart-no',
    jacobs: 'jacobs-no',
    joker: 'joker-no',
    kiwi: 'kiwi-no',
    matkroken: 'matkroken-no',
    meny: 'meny-no',
    'naerbutikken': 'naerbutikken-no',
    narbutikken: 'naerbutikken-no',
    obs: 'obs-no',
    'rema-1000': 'rema-1000-no',
    spar: 'spar-no'
  };
  return known[slug] ?? `${slug}-no`;
}

function offerRowFromCandidate(candidate: Record<string, unknown>, sourceUrl: string, retrievedAt: string): MattilbudNoOfferRow | null {
  const name = firstNestedText(candidate, ['name', 'title', 'displayName', 'heading', 'productName', 'product'], ['name', 'title', 'displayName']);
  const priceValue = firstDefined(candidate, ['offer_price', 'offerPrice', 'campaignPrice', 'currentPrice', 'price', 'salesPrice']);
  const price = priceNumber(priceValue);
  if (!name || price === null) return null;

  const businessId = firstNestedText(candidate, ['business_id', 'businessId', 'businessPublicId', 'retailerId', 'chainId', 'business', 'retailer', 'chain'], ['public_id', 'publicId', 'id', 'slug']);
  const chainText = firstNestedText(candidate, ['chain', 'retailer', 'business', 'businessName'], ['slug', 'name', 'title']);
  const chain = businessId ? mattilbudNoChainSlug(chainText || businessId) : mattilbudNoChainSlug(chainText || 'mattilbud');
  const sourceId = firstNestedText(candidate, ['sku', 'code', 'offerId', 'offer_id', 'id'], ['sku', 'id']);
  const publicationId = firstNestedText(candidate, ['publication_id', 'publicationId', 'flyerId', 'catalogueId', 'catalogId'], ['id', 'public_id', 'publicId']);
  const page = numberOrNull(firstDefined(candidate, ['page', 'pageNumber', 'flyerPage', 'publicationPage']));
  const productUrl = absoluteUrl(firstNestedText(candidate, ['productUrl', 'product_url', 'url', 'href', 'product'], ['url', 'href']), sourceUrl);
  const publicationUrl = absoluteUrl(firstNestedText(candidate, ['publicationUrl', 'publication_url', 'catalogueUrl', 'catalogUrl'], ['url', 'href']), sourceUrl);
  const barcode = firstNestedText(candidate, ['ean', 'gtin', 'barcode', 'product'], ['ean', 'gtin', 'barcode']);
  const code = barcode || sourceId || `mattilbud-no-${slugFor(`${chain}-${name}-${page ?? ''}`)}`;
  const imageUrl = firstImage(candidate) || (isRecord(candidate.product) ? firstImage(candidate.product) : '');

  return {
    country: 'NO',
    currency: 'NOK',
    chain,
    businessId,
    code,
    name,
    category: firstNestedText(candidate, ['category', 'categoryName', 'campaignName', 'product'], ['category', 'categoryName']) || 'weekly-flyer',
    promotionType: 'weekly_flyer',
    price,
    priceText: priceText(priceValue) || `${price.toLocaleString('nb-NO')} kr`,
    comparePriceText: firstNestedText(candidate, ['comparePriceText', 'unitPriceText', 'unitPrice', 'pricePerUnit'], ['text', 'label']),
    validFrom: firstNestedText(candidate, ['validFrom', 'valid_from', 'startDate', 'startsAt', 'from'], ['validFrom', 'startDate']),
    validTo: firstNestedText(candidate, ['validTo', 'valid_to', 'endDate', 'endsAt', 'to'], ['validTo', 'endDate']),
    flyerPage: page,
    publicationId,
    publicationUrl: publicationUrl || sourceUrl,
    productUrl: productUrl || publicationUrl || sourceUrl,
    imageUrl: absoluteUrl(imageUrl, sourceUrl),
    sourceUrl,
    retrievedAt,
    canonicalProductKey: barcode || sourceId || slugFor(name),
    confidenceLabel: barcode ? 'barcode' : sourceId ? 'source-id' : 'name-only',
    provenance: {
      source: 'mattilbud_no_tjek',
      parserVersion: MATTILBUD_NO_PARSER_VERSION,
      evidenceText: JSON.stringify(candidate).slice(0, 240)
    }
  };
}

function collectRecords(payloads: unknown[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const seenObjects = new Set<object>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value) || seenObjects.has(value)) return;
    seenObjects.add(value);
    rows.push(value);
    for (const child of Object.values(value)) visit(child);
  };
  payloads.forEach(visit);
  return rows;
}

function collectOfferCandidates(payloads: unknown[]): OfferCandidate[] {
  const rows: OfferCandidate[] = [];
  const seenObjects = new Set<object>();
  const visit = (value: unknown, context: Record<string, unknown>): void => {
    if (Array.isArray(value)) {
      value.forEach((child) => visit(child, context));
      return;
    }
    if (!isRecord(value) || seenObjects.has(value)) return;
    seenObjects.add(value);
    const nextContext = { ...context, ...offerContext(value) };
    rows.push({ candidate: value, context: nextContext });
    for (const child of Object.values(value)) visit(child, nextContext);
  };
  payloads.forEach((payload) => visit(payload, {}));
  return rows;
}

function offerContext(value: Record<string, unknown>): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const key of ['business', 'chain', 'retailer']) {
    if (value[key] !== undefined) context[key] = value[key];
  }
  for (const key of ['validFrom', 'valid_from', 'startDate', 'startsAt', 'from', 'validTo', 'valid_to', 'endDate', 'endsAt', 'to', 'publicationUrl', 'publication_url', 'catalogueUrl', 'catalogUrl']) {
    if (value[key] !== undefined) context[key] = value[key];
  }
  const publicationId = firstText(value, ['publication_id', 'publicationId', 'flyerId', 'catalogueId', 'catalogId']);
  if (publicationId) context.publicationId = publicationId;
  if (!publicationId && looksLikePublication(value)) {
    const id = firstText(value, ['id', 'public_id', 'publicId']);
    if (id) context.publicationId = id;
  }
  return context;
}

function looksLikePublication(value: Record<string, unknown>): boolean {
  return Array.isArray(value.offers) || Array.isArray(value.products) || Array.isArray(value.pages) || Array.isArray(value.publications);
}

function parseAppDataKey(value: string): unknown {
  if (!value) return '';
  const decoded = Buffer.from(value, 'base64').toString('utf8');
  return parseJson(decoded) ?? decoded;
}

function appDataKeyName(value: unknown): string {
  if (Array.isArray(value)) return value.map((part) => (typeof part === 'string' ? part : '')).filter(Boolean).join(':');
  return typeof value === 'string' ? value : '';
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(decodeHtml(value.trim()));
  } catch {
    return null;
  }
}

function looksLikeBusiness(value: Record<string, unknown>): boolean {
  return firstDefined(value, ['publication_count', 'publicationCount', 'publications_count', 'positive_logotype', 'negative_logotype']) !== undefined
    || firstText(value, ['country_code', 'countryCode']) === 'NO';
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) if (record[key] !== undefined && record[key] !== null) return record[key];
  return undefined;
}

function firstText(record: unknown, keys: string[]): string {
  if (!isRecord(record)) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstNestedText(record: Record<string, unknown>, directKeys: string[], nestedKeys: string[]): string {
  const direct = firstText(record, directKeys);
  if (direct) return direct;
  for (const key of directKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        const text = firstText(child, nestedKeys);
        if (text) return text;
      }
    } else {
      const text = firstText(value, nestedKeys);
      if (text) return text;
    }
  }
  return '';
}

function firstImage(record: Record<string, unknown>): string {
  const direct = firstNestedText(record, ['image', 'imageUrl', 'image_url', 'thumbnail', 'thumbnailUrl', 'photo'], ['url', 'src', 'href']);
  if (direct) return direct;
  if (Array.isArray(record.images)) {
    for (const candidate of record.images) {
      const imageUrl = firstText(candidate, ['url', 'src', 'href']);
      if (imageUrl) return imageUrl;
    }
  }
  return '';
}

function firstMatch(value: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return '';
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function priceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round((value + Number.EPSILON) * 100) / 100;
  if (isRecord(value)) return priceNumber(firstDefined(value, ['amount', 'value', 'price', 'formatted', 'display', 'text']));
  if (typeof value !== 'string') return null;
  const normalized = textFromHtml(value).replace(/\s/g, '').replace(/kr|nok/gi, '').replace(',', '.').match(/\d+(?:\.\d+)?/u)?.[0];
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function priceText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return `${value.toFixed(2)} kr`;
  if (isRecord(value)) return firstText(value, ['formatted', 'display', 'text', 'label']) || priceText(firstDefined(value, ['amount', 'value', 'price']));
  return '';
}

function textFromHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  try { return new URL(decodeHtml(value), sourceUrl).toString(); } catch { return ''; }
}

function slugFor(value: string): string {
  return value.toLowerCase().replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
