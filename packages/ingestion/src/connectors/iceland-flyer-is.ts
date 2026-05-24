export type IcelandFlyerOffer = {
  country: 'IS';
  currency: 'ISK';
  chain: 'iceland-group';
  retailerGroup: 'samkaup';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  regularPriceText: string;
  validFrom: string;
  validTo: string;
  storeBanner: string;
  sourceUrl: string;
  flyerUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type IcelandFlyerCandidate = {
  id?: unknown;
  sku?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  category?: unknown;
  price?: unknown;
  priceText?: unknown;
  regularPrice?: unknown;
  regularPriceText?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  url?: unknown;
  storeBanner?: unknown;
};

export type FetchIcelandFlyerOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const ICELAND_FLYER_BASE_URL = 'https://samkaup.is';
export const DEFAULT_ICELAND_FLYER_SOURCE_URLS = [
  'https://samkaup.is/tilbod',
  'https://netto.is/tilbod',
  'https://kjorbudin.is/tilbod',
  'https://krambudin.is/tilbod'
] as const;

export async function fetchIcelandFlyerOffers(options: FetchIcelandFlyerOffersOptions = {}): Promise<IcelandFlyerOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 500;
  const rows: IcelandFlyerOffer[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_ICELAND_FLYER_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/json',
        'user-agent': 'GroceryViewBot/1.0 (+https://groceryview.se)'
      }
    });

    if (!response.ok) {
      throw new Error(`Iceland flyer request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const offer of parseIcelandFlyerOffers(await response.text(), { sourceUrl, retrievedAt, maxRows: maxRows - rows.length })) {
      const key = `${offer.storeBanner}:${offer.code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(offer);
      if (rows.length >= maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export function parseIcelandFlyerOffers(
  payload: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): IcelandFlyerOffer[] {
  const rows: IcelandFlyerOffer[] = [];
  const seenCodes = new Set<string>();

  for (const candidate of extractOfferCandidates(payload)) {
    const row = normalizeIcelandFlyerOffer(candidate, context);
    if (!row || seenCodes.has(row.code)) continue;
    seenCodes.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 150)) {
      return rows;
    }
  }

  return rows;
}

export function normalizeIcelandFlyerOffer(
  offer: IcelandFlyerCandidate,
  context: { sourceUrl: string; retrievedAt: string }
): IcelandFlyerOffer | null {
  const name = text(offer.name) || text(offer.title);
  const price = numberFromText(offer.price ?? offer.priceText);
  const code = text(offer.id) || text(offer.sku) || slugFor(name);

  if (!name || !code || price === null) {
    return null;
  }

  return {
    country: 'IS',
    currency: 'ISK',
    chain: 'iceland-group',
    retailerGroup: 'samkaup',
    code,
    name,
    brand: text(offer.brand),
    category: text(offer.category),
    price,
    priceText: text(offer.priceText) || `${Math.round(price).toLocaleString('is-IS')} kr.`,
    regularPriceText: text(offer.regularPriceText) || priceTextFrom(offer.regularPrice),
    validFrom: text(offer.validFrom),
    validTo: text(offer.validTo),
    storeBanner: text(offer.storeBanner) || bannerFromUrl(context.sourceUrl),
    sourceUrl: context.sourceUrl,
    flyerUrl: absoluteUrl(offer.url, context.sourceUrl),
    imageUrl: absoluteUrl(offer.imageUrl ?? offer.image, context.sourceUrl),
    retrievedAt: context.retrievedAt
  };
}

function extractOfferCandidates(payload: string): IcelandFlyerCandidate[] {
  const parsed = parseJson(payload);
  const candidates: IcelandFlyerCandidate[] = [];

  if (parsed) {
    visit(parsed, (value) => {
      const candidate = value as IcelandFlyerCandidate;
      if ((candidate.name || candidate.title) && (candidate.price || candidate.priceText)) {
        candidates.push(candidate);
      }
    });
  }

  const nextData = payload.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  const nextParsed = parseJson(nextData?.[1]);
  if (nextParsed) {
    visit(nextParsed, (value) => {
      const candidate = value as IcelandFlyerCandidate;
      if ((candidate.name || candidate.title) && (candidate.price || candidate.priceText)) {
        candidates.push(candidate);
      }
    });
  }

  return candidates;
}

function visit(value: unknown, visitor: (value: unknown) => void) {
  visitor(value);
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, visitor));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => visit(item, visitor));
  }
}

function parseJson(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberFromText(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\./g, '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!normalized) return null;
  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function priceTextFrom(value: unknown) {
  const price = numberFromText(value);
  return price === null ? '' : `${Math.round(price).toLocaleString('is-IS')} kr.`;
}

function slugFor(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function bannerFromUrl(sourceUrl: string) {
  const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
  if (host.includes('netto')) return 'Netto';
  if (host.includes('kjorbudin')) return 'Kjörbúðin';
  if (host.includes('krambudin')) return 'Krambúðin';
  return 'Samkaup';
}

function absoluteUrl(value: unknown, baseUrl: string) {
  const path = text(value);
  if (!path) return '';
  return new URL(path, baseUrl).toString();
}
