export type HagkaupFlyerOffer = {
  code: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  regularPrice: number | null;
  priceText: string;
  regularPriceText: string;
  pricingFormat: 'premium_flyer';
  country: 'IS';
  currency: 'ISK';
  imageUrl: string;
  sourceUrl: string;
  validFrom: string;
  validTo: string;
  retrievedAt: string;
};

export type FetchHagkaupFlyerOffersOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrl?: string;
};

type HagkaupOfferCandidate = {
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  id?: unknown;
  image?: unknown;
  name?: unknown;
  offers?: unknown;
  price?: unknown;
  priceText?: unknown;
  regularPrice?: unknown;
  regularPriceText?: unknown;
  sku?: unknown;
  validFrom?: unknown;
  validThrough?: unknown;
  validTo?: unknown;
};

export const HAGKAUP_FLYER_IS_URL = 'https://www.hagkaup.is/tilbod';

export async function fetchHagkaupFlyerOffers(options: FetchHagkaupFlyerOffersOptions = {}): Promise<HagkaupFlyerOffer[]> {
  const sourceUrl = options.sourceUrl ?? HAGKAUP_FLYER_IS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'accept-language': 'is,en;q=0.8',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Hagkaup flyer request failed for ${sourceUrl}: ${response.status}`);
  }

  return parseHagkaupFlyerOffers(await response.text(), {
    maxRows: options.maxRows,
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    sourceUrl
  });
}

export function parseHagkaupFlyerOffers(
  html: string,
  context: { maxRows?: number; retrievedAt: string; sourceUrl: string }
): HagkaupFlyerOffer[] {
  const rows: HagkaupFlyerOffer[] = [];
  const seen = new Set<string>();

  for (const candidate of extractStructuredCandidates(html)) {
    const row = normalizeHagkaupFlyerOffer(candidate, context);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 200)) return rows;
  }

  if (rows.length === 0) {
    for (const row of parseHtmlPriceCards(html, context)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= (context.maxRows ?? 200)) return rows;
    }
  }

  return rows;
}

export function normalizeHagkaupFlyerOffer(
  candidate: HagkaupOfferCandidate,
  context: { retrievedAt: string; sourceUrl: string }
): HagkaupFlyerOffer | null {
  const name = text(candidate.name);
  const offer = firstObject(candidate.offers);
  const priceSpecification = firstObject(offer?.priceSpecification);
  const priceText = text(candidate.priceText) || text(priceSpecification?.price) || text(offer?.price) || text(candidate.price);
  const price = parseIskPrice(priceText);

  if (!name || price === null) {
    return null;
  }

  const regularPriceText = text(candidate.regularPriceText) || text(candidate.regularPrice) || text(offer?.highPrice);
  const code = text(candidate.sku) || text(candidate.id) || slugify(`${name}-${priceText}`);

  return {
    code,
    name,
    description: text(candidate.description),
    brand: text(candidate.brand),
    category: text(candidate.category),
    price,
    regularPrice: parseIskPrice(regularPriceText),
    priceText: formatIskPrice(price, priceText),
    regularPriceText,
    pricingFormat: 'premium_flyer',
    country: 'IS',
    currency: 'ISK',
    imageUrl: imageUrl(candidate.image),
    sourceUrl: context.sourceUrl,
    validFrom: text(candidate.validFrom) || text(offer?.validFrom),
    validTo: text(candidate.validTo) || text(candidate.validThrough) || text(offer?.priceValidUntil),
    retrievedAt: context.retrievedAt
  };
}

export function parseIskPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  const normalized = text(value)
    .replace(/kr\.?/gi, '')
    .replace(/isk/gi, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function formatIskPrice(price: number, _originalText = ''): string {
  return `${new Intl.NumberFormat('is-IS', { maximumFractionDigits: 0 }).format(price)} kr.`;
}

function extractStructuredCandidates(html: string): HagkaupOfferCandidate[] {
  const candidates: HagkaupOfferCandidate[] = [];

  for (const jsonText of extractJsonScriptBodies(html)) {
    try {
      collectOfferCandidates(JSON.parse(jsonText), candidates);
    } catch {
      // Ignore unrelated script payloads.
    }
  }

  return candidates;
}

function extractJsonScriptBodies(html: string): string[] {
  const scripts: string[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    scripts.push(decodeHtml(match[1] ?? '').trim());
  }

  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) scripts.push(decodeHtml(nextData).trim());

  return scripts;
}

function collectOfferCandidates(value: unknown, candidates: HagkaupOfferCandidate[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectOfferCandidates(item, candidates));
    return;
  }

  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const type = text(record['@type'] ?? record.type).toLowerCase();
  const hasPrice = record.price !== undefined || record.priceText !== undefined || (record.offers && typeof record.offers === 'object');
  if ((type.includes('product') || record.name) && hasPrice) {
    candidates.push(record as HagkaupOfferCandidate);
  }

  for (const child of Object.values(record)) {
    if (child && typeof child === 'object') collectOfferCandidates(child, candidates);
  }
}

function parseHtmlPriceCards(html: string, context: { retrievedAt: string; sourceUrl: string }): HagkaupFlyerOffer[] {
  const rows: HagkaupFlyerOffer[] = [];
  const pricePattern = /(?:^|>)([^<>{}]{2,80}?)\s+(\d{1,3}(?:[.\s]\d{3})*|\d+)\s*kr\.?/gi;

  for (const match of html.matchAll(pricePattern)) {
    const name = stripTags(match[1] ?? '').trim();
    const priceText = `${match[2]} kr.`;
    const row = normalizeHagkaupFlyerOffer({ name, priceText }, context);
    if (row) rows.push(row);
  }

  return rows;
}

function firstObject(value: unknown): Record<string, unknown> | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first && typeof first === 'object' ? first as Record<string, unknown> : undefined;
}

function imageUrl(value: unknown): string {
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value).trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
