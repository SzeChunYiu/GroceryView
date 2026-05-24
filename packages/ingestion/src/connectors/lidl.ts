export type LidlStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  url: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type LidlOffer = {
  code: string;
  name: string;
  brand: string;
  channel: 'store';
  packageText: string;
  category: string;
  price: number;
  regularPrice: number | null;
  priceText: string;
  unitPriceText: string;
  promotionText: string;
  memberOnly: boolean;
  is_member_price: boolean;
  is_coupon_price: boolean;
  multi_buy: LidlMultiBuyPromotion | null;
  regions: string[];
  validFrom: string;
  validTo: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type LidlMultiBuyPromotion = {
  price: number;
  priceText: string;
  quantity: number;
  text: string;
};

export type LidlStoreOffer = LidlOffer & {
  storeId: string;
  storeName: string;
  city: string;
};

type LidlGridData = {
  title?: unknown;
  fullTitle?: unknown;
  productId?: unknown;
  canonicalUrl?: unknown;
  brand?: { name?: unknown } | unknown;
  imageList_V1?: Array<{ image?: unknown }>;
  image?: unknown;
  regions?: unknown;
  regionsPrices?: Record<string, LidlRegionPrice>;
  currentLidlPlusPrice?: unknown;
  price?: LidlPrice;
  packaging?: { text?: unknown };
  keyfacts?: { title?: unknown };
};

type LidlRegionPrice = {
  currentPrice?: LidlPrice;
  currentLidlPlusPrice?: {
    price?: LidlPrice;
    lidlPlusText?: unknown;
    highlightText?: unknown;
  };
};

type LidlPrice = {
  price?: unknown;
  oldPrice?: unknown;
  currencyCode?: unknown;
  basePrice?: { text?: unknown };
  packaging?: { text?: unknown };
  startDate?: unknown;
  endDate?: unknown;
  discount?: {
    discountText?: unknown;
    deletedPrice?: unknown;
  };
};

export const LIDL_BASE_URL = 'https://www.lidl.se';
export const LIDL_STORES_PATH = '/s/sv-SE/butiker/';
export const DEFAULT_LIDL_OFFER_PATHS = [
  '/c/veckans-frukt-groent/a10094676',
  '/c/lidl-plus-erbjudanden/a10094682',
  '/c/veckans-blommor/a10094398',
  '/c/bjud-pa-spaennande-smaker/a10094681',
  '/c/fira-matriket-tre-ar-med-oss/a10094679',
  '/c/mandag-soendag/a10094677',
  '/c/torsdag-soendag/a10094678',
  '/c/superklipp-fran-torsdag/a10094683',
  '/c/xxl/a10094680',
  '/c/med-smak-av-alperna/a10094785',
  '/c/veckans-frukt-groent/a10094782',
  '/c/lidl-plus-erbjudanden/a10094788'
] as const;

export type FetchLidlStoresOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export type FetchLidlOffersOptions = {
  fetchImpl?: typeof fetch;
  offerPaths?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export type FetchLidlOffersForAllStoresOptions = FetchLidlOffersOptions & {
  maxStores?: number;
};

export function buildLidlStoresUrl(baseUrl = LIDL_BASE_URL): string {
  return new URL(LIDL_STORES_PATH, baseUrl).toString();
}

export function buildLidlStoreDetailPayloadUrl(storePath: string, baseUrl = LIDL_BASE_URL): string {
  return new URL(storePath, baseUrl).toString();
}

export function buildLidlOfferPageUrl(path: string, baseUrl = LIDL_BASE_URL): string {
  return new URL(path, baseUrl).toString();
}

export async function fetchLidlStores(options: FetchLidlStoresOptions = {}): Promise<LidlStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildLidlStoresUrl(options.baseUrl);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Lidl store directory request failed: ${response.status}`);
  const html = await response.text();
  const paths = extractLidlStorePaths(html);
  const rows: LidlStore[] = [];
  const seen = new Set<string>();
  for (const path of paths) {
    const detailUrl = buildLidlStoreDetailPayloadUrl(path, options.baseUrl);
    const detailResponse = await fetchImpl(detailUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!detailResponse.ok) throw new Error(`Lidl store detail request failed for ${path}: ${detailResponse.status}`);
    const row = normalizeLidlStore(path, await detailResponse.text(), detailUrl, retrievedAt, options.baseUrl);
    if (!row || seen.has(row.storeId)) continue;
    seen.add(row.storeId);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }
  if (rows.length === 0) throw new Error('Lidl store directory had no usable stores.');
  return rows;
}

export async function fetchLidlOffers(options: FetchLidlOffersOptions = {}): Promise<LidlOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const offerPaths = options.offerPaths ?? DEFAULT_LIDL_OFFER_PATHS;
  const maxRows = options.maxRows ?? 500;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: LidlOffer[] = [];
  const seen = new Set<string>();
  for (const path of offerPaths) {
    const sourceUrl = buildLidlOfferPageUrl(path, options.baseUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Lidl offer page request failed for ${path}: ${response.status}`);
    for (const payload of extractLidlGridData(await response.text())) {
      const row = normalizeLidlOffer(payload, sourceUrl, retrievedAt, options.baseUrl);
      if (!row) continue;
      const key = `${row.code}:${row.sourceUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }
  return rows;
}

export async function fetchLidlOffersForAllStores(options: FetchLidlOffersForAllStoresOptions = {}): Promise<LidlStoreOffer[]> {
  const stores = await fetchLidlStores({
    fetchImpl: options.fetchImpl,
    maxRows: options.maxStores,
    retrievedAt: options.retrievedAt,
    baseUrl: options.baseUrl
  });
  const offers = await fetchLidlOffers({
    fetchImpl: options.fetchImpl,
    offerPaths: options.offerPaths,
    maxRows: options.maxRows,
    retrievedAt: options.retrievedAt,
    baseUrl: options.baseUrl
  });
  const rows: LidlStoreOffer[] = [];
  for (const store of stores) {
    rows.push(...offers.map((offer) => ({
      ...offer,
      storeId: store.storeId,
      storeName: store.name,
      city: store.city
    })));
  }
  return rows;
}

export function extractLidlStorePaths(html: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/href=["']([^"']*\/s\/sv-SE\/butiker\/[^"']+)["']/g)) {
    const raw = htmlDecode(match[1]);
    const path = raw.startsWith('http') ? new URL(raw).pathname : raw;
    if (!path.startsWith('/s/sv-SE/butiker/') || path === LIDL_STORES_PATH) continue;
    if (seen.has(path)) continue;
    seen.add(path);
    paths.push(path);
  }
  return paths;
}

export function normalizeLidlStore(
  storePath: string,
  html: string,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = LIDL_BASE_URL
): LidlStore | null {
  const storeId = storePath.replace(/^\/s\/sv-SE\/butiker\//, '').replace(/\/$/, '');
  const description = htmlDecode(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '');
  const addressMatch = description.match(/vid\s+(.+?),\s+(\d{3}\s?\d{2})\s+(.+?)\s+Se öppettider/i);
  const address = addressMatch?.[1]?.trim() ?? '';
  const postalCode = addressMatch?.[2]?.trim() ?? '';
  const city = addressMatch?.[3]?.trim() ?? cityFromStoreId(storeId);
  if (!storeId || !address || !city) return null;
  const coordinateMatch = html.match(/rtp=~pos\.(-?\d+(?:\.\d+)?)_(-?\d+(?:\.\d+)?)/);
  return {
    storeId,
    name: `Lidl ${city} ${address}`,
    address,
    city,
    postalCode,
    countryCode: 'SE',
    latitude: coordinateMatch ? Number(coordinateMatch[1]) : null,
    longitude: coordinateMatch ? Number(coordinateMatch[2]) : null,
    url: new URL(storePath, baseUrl).toString(),
    sourceUrl,
    retrievedAt
  };
}

export function extractLidlGridData(html: string): LidlGridData[] {
  const rows: LidlGridData[] = [];
  for (const match of html.matchAll(/data-grid-data="([^"]+)"/g)) {
    try {
      const parsed = JSON.parse(htmlDecode(match[1])) as LidlGridData;
      rows.push(parsed);
    } catch {
      continue;
    }
  }
  return rows;
}

export function normalizeLidlOffer(
  payload: LidlGridData,
  sourceUrl: string,
  retrievedAt: string,
  baseUrl = LIDL_BASE_URL
): LidlOffer | null {
  const code = text(payload.productId);
  const name = text(payload.fullTitle) || text(payload.title) || text(payload.keyfacts?.title);
  const regionEntry = firstRegionPrice(payload.regionsPrices);
  const lidlPlusPrice = regionEntry?.currentLidlPlusPrice?.price;
  const currentPrice = lidlPlusPrice ?? regionEntry?.currentPrice ?? payload.price;
  const price = numberOrNull(currentPrice?.price);
  if (!code || !name || price === null) return null;
  const currencyCode = text(currentPrice?.currencyCode) || 'SEK';
  const regularPrice = numberOrNull(currentPrice?.oldPrice) ?? numberOrNull(currentPrice?.discount?.deletedPrice);
  const basePriceText = text(currentPrice?.basePrice?.text) || text(payload.price?.basePrice?.text);
  const packageText = text(currentPrice?.packaging?.text) || text(payload.packaging?.text) || basePriceText;
  const promotionText = text(currentPrice?.discount?.discountText)
    || text(regionEntry?.currentLidlPlusPrice?.highlightText)
    || text(regionEntry?.currentLidlPlusPrice?.lidlPlusText);
  const priceText = `${price.toFixed(2)} ${currencyCode}`;
  const memberOnly = Boolean(regionEntry?.currentLidlPlusPrice || payload.currentLidlPlusPrice);
  return {
    code,
    name,
    brand: typeof payload.brand === 'object' && payload.brand !== null ? text((payload.brand as { name?: unknown }).name) : text(payload.brand),
    channel: 'store',
    packageText,
    category: 'lidl-public-offers',
    price,
    regularPrice,
    priceText,
    unitPriceText: basePriceText,
    promotionText,
    memberOnly,
    is_member_price: memberOnly,
    is_coupon_price: /kupong/i.test(promotionText),
    multi_buy: parseLidlMultiBuyPromotion(promotionText, price, priceText),
    regions: Array.isArray(payload.regions) ? payload.regions.map((region) => text(region) || String(region)).filter(Boolean) : Object.keys(payload.regionsPrices ?? {}),
    validFrom: text(currentPrice?.startDate),
    validTo: text(currentPrice?.endDate),
    productUrl: text(payload.canonicalUrl) ? new URL(text(payload.canonicalUrl), baseUrl).toString() : '',
    imageUrl: text(payload.image) || text(payload.imageList_V1?.[0]?.image),
    sourceUrl,
    retrievedAt
  };
}

export function parseLidlMultiBuyPromotion(textValue: string, price: number, priceText: string): LidlMultiBuyPromotion | null {
  const quantity = Number(textValue.match(/(\d+)\s*f[öo]r/i)?.[1]);
  return Number.isFinite(quantity) && quantity > 1
    ? { price, priceText, quantity, text: textValue }
    : null;
}

function firstRegionPrice(value: Record<string, LidlRegionPrice> | undefined): LidlRegionPrice | undefined {
  if (!value) return undefined;
  const firstKey = Object.keys(value).sort()[0];
  return firstKey ? value[firstKey] : undefined;
}

function cityFromStoreId(storeId: string): string {
  const first = storeId.split('/')[0] ?? '';
  return first.split('-').map((part) => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
}

function htmlDecode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'");
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
