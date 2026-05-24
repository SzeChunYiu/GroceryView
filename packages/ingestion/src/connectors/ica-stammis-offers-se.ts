export type IcaStammisPromotionKind = 'member';
export type IcaStammisDayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type IcaStammisPromotionRow = {
  code: string;
  kind: IcaStammisPromotionKind;
  name: string;
  brand: string;
  priceText: string;
  regularPriceText: string;
  storeId: string;
  storeName: string;
  sourceUrl: string;
  imageUrl: string;
  retrievedAt: string;
  isMemberPrice: true;
  requiresIcaStammis: true;
  channel: 'app';
  validFrom: string;
  validTo: string;
  dowRestriction: IcaStammisDayOfWeek[];
};

type IcaStammisApiOffer = {
  id?: unknown;
  code?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  priceText?: unknown;
  mechanicInfo?: unknown;
  regularPriceText?: unknown;
  storeId?: unknown;
  storeName?: unknown;
  imageUrl?: unknown;
  image?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  daysOfWeek?: unknown;
  dowRestriction?: unknown;
};

export type FetchIcaStammisOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const ICA_STAMMIS_OFFERS_URL = 'https://www.ica.se/stammis/erbjudanden/';

const DAY_ALIASES: Record<string, IcaStammisDayOfWeek> = {
  monday: 'monday',
  måndag: 'monday',
  mon: 'monday',
  tisdag: 'tuesday',
  tuesday: 'tuesday',
  tue: 'tuesday',
  onsdag: 'wednesday',
  wednesday: 'wednesday',
  wed: 'wednesday',
  torsdag: 'thursday',
  thursday: 'thursday',
  thu: 'thursday',
  fredag: 'friday',
  friday: 'friday',
  fri: 'friday',
  lördag: 'saturday',
  lordag: 'saturday',
  saturday: 'saturday',
  sat: 'saturday',
  söndag: 'sunday',
  sondag: 'sunday',
  sunday: 'sunday',
  sun: 'sunday'
};

export async function fetchIcaStammisOffers(options: FetchIcaStammisOffersOptions = {}): Promise<IcaStammisPromotionRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? ICA_STAMMIS_OFFERS_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`ICA Stammis offers request failed: ${response.status}`);
  return parseIcaStammisOffers(await response.text(), { sourceUrl, retrievedAt, maxRows: options.maxRows });
}

export function parseIcaStammisOffers(
  payload: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): IcaStammisPromotionRow[] {
  return extractOfferArray(payload)
    .map((offer) => promotionRouter(offer, context))
    .filter((row): row is IcaStammisPromotionRow => row !== null)
    .slice(0, context.maxRows ?? 200);
}

export function promotionRouter(
  offer: IcaStammisApiOffer,
  context: { sourceUrl: string; retrievedAt: string }
): IcaStammisPromotionRow | null {
  const code = text(offer.id) || text(offer.code);
  const name = text(offer.name) || text(offer.title);
  const priceText = text(offer.priceText) || text(offer.mechanicInfo);
  if (!code || !name || !priceText) return null;

  return {
    code,
    kind: 'member',
    name,
    brand: text(offer.brand),
    priceText,
    regularPriceText: text(offer.regularPriceText),
    storeId: text(offer.storeId),
    storeName: text(offer.storeName),
    sourceUrl: context.sourceUrl,
    imageUrl: text(offer.imageUrl) || text(offer.image),
    retrievedAt: context.retrievedAt,
    isMemberPrice: true,
    requiresIcaStammis: true,
    channel: 'app',
    validFrom: text(offer.validFrom),
    validTo: text(offer.validTo),
    dowRestriction: normalizeDowRestriction(offer.dowRestriction ?? offer.daysOfWeek ?? priceText)
  };
}

export function normalizeDowRestriction(value: unknown): IcaStammisDayOfWeek[] {
  const parts = Array.isArray(value) ? value : String(value ?? '').split(/[,/| ]+/);
  const days = new Set<IcaStammisDayOfWeek>();
  for (const part of parts) {
    const day = DAY_ALIASES[String(part).trim().toLowerCase()];
    if (day) days.add(day);
  }
  return [...days];
}

function extractOfferArray(payload: string): IcaStammisApiOffer[] {
  const trimmed = payload.trim();
  if (trimmed.startsWith('[')) return JSON.parse(trimmed) as IcaStammisApiOffer[];
  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as { offers?: IcaStammisApiOffer[]; stammisOffers?: IcaStammisApiOffer[] };
    return parsed.stammisOffers ?? parsed.offers ?? [];
  }

  for (const marker of ['"stammisOffers":', '"personalOffers":', '"offers":']) {
    const markerIndex = payload.indexOf(marker);
    if (markerIndex < 0) continue;
    const arrayStart = payload.indexOf('[', markerIndex);
    const arrayEnd = findMatchingBracket(payload, arrayStart);
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(payload.slice(arrayStart, arrayEnd).replace(/\bundefined\b/g, 'null')) as IcaStammisApiOffer[];
    }
  }

  return [];
}

function findMatchingBracket(value: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') inString = true;
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
