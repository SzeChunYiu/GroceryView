export type MatpriskollenOffer = {
  code: string;
  name: string;
  brand: string;
  store: string;
  storeKey: string;
  storeId: string;
  category: string;
  priceText: string;
  comparePriceText: string;
  regularPriceText: string;
  packageText: string;
  condition: string;
  origin: string;
  requiresMembershipCard: boolean;
  requiresCoupon: boolean;
  validFrom: string;
  validTo: string;
  sourceUrl: string;
  productUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type MatpriskollenStore = {
  id?: unknown;
  key?: unknown;
  name?: unknown;
  offerCount?: unknown;
  imageUrl?: unknown;
  dist?: unknown;
};

type MatpriskollenOffersResponse = {
  storeName?: unknown;
  offers?: MatpriskollenApiOffer[];
};

type MatpriskollenApiOffer = {
  id?: unknown;
  key?: unknown;
  condition?: unknown;
  description?: unknown;
  price?: unknown;
  comprice?: unknown;
  regular?: unknown;
  volume?: unknown;
  requiresMembershipCard?: unknown;
  requiresCoupon?: unknown;
  imageURL?: unknown;
  imageUrl?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  store_id?: unknown;
  store_key?: unknown;
  product?: {
    name?: unknown;
    origin?: unknown;
    brand?: unknown;
    categories?: Array<{
      name?: unknown;
      parent_category?: {
        name?: unknown;
      };
    }>;
  };
  produkt_bild_urls?: {
    bildUrl?: unknown;
  } | null;
};

export const MATPRISKOLLEN_BASE_URL = 'https://matpriskollen.se';
export const DEFAULT_MATPRISKOLLEN_LAT = 55.605;
export const DEFAULT_MATPRISKOLLEN_LON = 13.0038;
export const DEFAULT_MATPRISKOLLEN_REGIONS = [
  { name: 'malmo', lat: 55.605, lon: 13.0038 },
  { name: 'stockholm', lat: 59.3293, lon: 18.0686 },
  { name: 'goteborg', lat: 57.7089, lon: 11.9746 },
  { name: 'uppsala', lat: 59.8586, lon: 17.6389 },
  { name: 'vasteras', lat: 59.6099, lon: 16.5448 },
  { name: 'orebro', lat: 59.2753, lon: 15.2134 },
  { name: 'linkoping', lat: 58.4108, lon: 15.6214 },
  { name: 'helsingborg', lat: 56.0465, lon: 12.6945 },
  { name: 'umea', lat: 63.8258, lon: 20.263 },
  { name: 'lulea', lat: 65.5848, lon: 22.1567 }
] as const;
export const DEFAULT_MATPRISKOLLEN_STORE_LIMIT = 60;
export const DEFAULT_MATPRISKOLLEN_OFFER_LIMIT_PER_STORE = 200;
export const DEFAULT_MATPRISKOLLEN_MAX_ROWS = 9000;
export const DEFAULT_MATPRISKOLLEN_GROCERY_STORE_PATTERN = /(willys|lidl|coop|ica|hemk[oö]p|city gross)/i;

export type MatpriskollenRegion = {
  name?: string;
  lat: number;
  lon: number;
};

export type FetchMatpriskollenOffersOptions = {
  fetchImpl?: typeof fetch;
  lat?: number;
  lon?: number;
  regions?: readonly MatpriskollenRegion[];
  storeLimit?: number;
  offerLimitPerStore?: number;
  storeNamePattern?: RegExp | null;
  maxRows?: number;
  retrievedAt?: string;
};

export function buildMatpriskollenStoresUrl(
  lat = DEFAULT_MATPRISKOLLEN_LAT,
  lon = DEFAULT_MATPRISKOLLEN_LON,
  limit = DEFAULT_MATPRISKOLLEN_STORE_LIMIT
): string {
  const url = new URL('/api/v1/stores', MATPRISKOLLEN_BASE_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export function buildMatpriskollenStoreOffersUrl(
  storeKey: string,
  lat = DEFAULT_MATPRISKOLLEN_LAT,
  lon = DEFAULT_MATPRISKOLLEN_LON,
  limit = DEFAULT_MATPRISKOLLEN_OFFER_LIMIT_PER_STORE
): string {
  const url = new URL(`/api/v1/stores/${encodeURIComponent(storeKey)}/offers`, MATPRISKOLLEN_BASE_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('limit', String(limit));
  return url.toString();
}

export async function fetchMatpriskollenOffers(
  options: FetchMatpriskollenOffersOptions = {}
): Promise<MatpriskollenOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const lat = options.lat ?? DEFAULT_MATPRISKOLLEN_LAT;
  const lon = options.lon ?? DEFAULT_MATPRISKOLLEN_LON;
  const storeLimit = options.storeLimit ?? DEFAULT_MATPRISKOLLEN_STORE_LIMIT;
  const offerLimitPerStore = options.offerLimitPerStore ?? DEFAULT_MATPRISKOLLEN_OFFER_LIMIT_PER_STORE;
  const storeNamePattern = options.storeNamePattern === undefined
    ? DEFAULT_MATPRISKOLLEN_GROCERY_STORE_PATTERN
    : options.storeNamePattern;
  const maxRows = options.maxRows ?? DEFAULT_MATPRISKOLLEN_MAX_ROWS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const regions = options.regions
    ?? (options.lat !== undefined || options.lon !== undefined
      ? [{ lat, lon }]
      : DEFAULT_MATPRISKOLLEN_REGIONS);
  const rows: MatpriskollenOffer[] = [];
  const seenOfferStoreKeys = new Set<string>();

  for (const region of regions) {
    const storeUrl = buildMatpriskollenStoresUrl(region.lat, region.lon, storeLimit);
    const storesResponse = await fetchImpl(storeUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!storesResponse.ok) {
      throw new Error(`Matpriskollen stores request failed: ${storesResponse.status}`);
    }

    const stores = await storesResponse.json() as MatpriskollenStore[];

    for (const store of stores) {
      const storeKey = text(store.key);
      const storeName = text(store.name);
      if (!storeKey || numberValue(store.offerCount) <= 0 || (storeNamePattern && !storeNamePattern.test(storeName))) {
        continue;
      }

      const sourceUrl = buildMatpriskollenStoreOffersUrl(storeKey, region.lat, region.lon, offerLimitPerStore);
      const offersResponse = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json',
          'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
        }
      });

      if (!offersResponse.ok) {
        continue;
      }

      const payload = await offersResponse.json() as MatpriskollenOffersResponse;
      for (const offer of payload.offers ?? []) {
        const row = normalizeMatpriskollenOffer(offer, {
          sourceUrl,
          retrievedAt,
          storeName: text(payload.storeName) || storeName,
          storeKey,
          storeId: text(store.id)
        });
        if (!row) {
          continue;
        }
        const offerStoreKey = `${row.code}:${row.storeKey}`;
        if (seenOfferStoreKeys.has(offerStoreKey)) {
          continue;
        }
        seenOfferStoreKeys.add(offerStoreKey);
        rows.push(row);
        if (rows.length >= maxRows) {
          return rows;
        }
      }
    }
  }

  return rows;
}

export function normalizeMatpriskollenOffer(
  offer: MatpriskollenApiOffer,
  context: {
    sourceUrl: string;
    retrievedAt: string;
    storeName: string;
    storeKey: string;
    storeId: string;
  }
): MatpriskollenOffer | null {
  const code = text(offer.key ?? offer.id);
  const name = text(offer.product?.name ?? offer.description);
  const priceText = text(offer.price);
  if (!code || !name || !priceText) {
    return null;
  }

  const parentCategory = text(offer.product?.categories?.[0]?.parent_category?.name);
  const category = parentCategory || text(offer.product?.categories?.[0]?.name);
  return {
    code,
    name,
    brand: text(offer.product?.brand),
    store: context.storeName,
    storeKey: text(offer.store_key) || context.storeKey,
    storeId: text(offer.store_id) || context.storeId,
    category,
    priceText,
    comparePriceText: text(offer.comprice),
    regularPriceText: text(offer.regular),
    packageText: text(offer.volume),
    condition: text(offer.condition),
    origin: text(offer.product?.origin),
    requiresMembershipCard: Boolean(offer.requiresMembershipCard),
    requiresCoupon: Boolean(offer.requiresCoupon),
    validFrom: unixSecondsToIso(offer.validFrom),
    validTo: unixSecondsToIso(offer.validTo),
    sourceUrl: context.sourceUrl,
    productUrl: new URL(`/deal/${code}`, MATPRISKOLLEN_BASE_URL).toString(),
    imageUrl: text(offer.produkt_bild_urls?.bildUrl ?? offer.imageURL ?? offer.imageUrl),
    retrievedAt: context.retrievedAt
  };
}

function unixSecondsToIso(value: unknown): string {
  const seconds = numberValue(value);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : '';
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(text(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
