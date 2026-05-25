import { createGroceryViewApi, type FlyerOffer } from '@groceryview/api';

export const myFlyerAlgorithms = ['best_savings', 'best_unit_price', 'watchlist_first'] as const;
export const myFlyerCountries = ['se', 'no', 'dk', 'fi'] as const;

export type MyFlyerAlgorithm = (typeof myFlyerAlgorithms)[number];
export type MyFlyerCountry = (typeof myFlyerCountries)[number];

export type MyFlyerQuery = {
  userId: string;
  algorithm: MyFlyerAlgorithm;
  country: MyFlyerCountry;
  limit: number;
  userSignals?: MyFlyerUserSignals;
};

export type MyFlyerUserSignals = {
  authenticated: boolean;
  favoriteStoreIds: string[];
  watchlistProductIds: string[];
  watchlistCategories: string[];
  recentBasketProductIds: string[];
  recentBasketCategories: string[];
  source: 'session-user-preferences' | 'anonymous-empty';
};

export type MyFlyerRow = {
  rank: number;
  offer: FlyerOffer;
  personalizedScore: number;
  scoreBreakdown: {
    savings: number;
    unitPrice: number | null;
    watchlist: number;
    recentBasket: number;
    favoriteStore: number;
    confidence: number;
    expiry: number;
  };
  explanation: string[];
};

export type MyFlyerPayload = {
  userId: string;
  country: MyFlyerCountry;
  algorithm: MyFlyerAlgorithm;
  generatedAt: string;
  week: {
    startsOn: string;
    endsOn: string;
  };
  cache: {
    key: string;
    ttlSeconds: number;
  };
  source: {
    offerCount: number;
    guardrails: string[];
  };
  rows: MyFlyerRow[];
};

const api = createGroceryViewApi();
const myFlyerCache = new Map<string, { expiresAt: number; payload: MyFlyerPayload }>();
const ttlSeconds = 60 * 60;

const emptyUserSignals: MyFlyerUserSignals = {
  authenticated: false,
  favoriteStoreIds: [],
  watchlistProductIds: [],
  watchlistCategories: [],
  recentBasketProductIds: [],
  recentBasketCategories: [],
  source: 'anonymous-empty'
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizedSignal(value: string) {
  return value.trim().toLowerCase();
}

function uniqueSignals(values: readonly string[] = []) {
  const seen = new Set<string>();
  const signals: string[] = [];
  for (const value of values) {
    const normalized = normalizedSignal(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    signals.push(normalized);
  }
  return signals.slice(0, 50);
}

export function buildMyFlyerUserSignals(signals: Partial<MyFlyerUserSignals> | null | undefined): MyFlyerUserSignals {
  if (!signals?.authenticated) return emptyUserSignals;

  return {
    authenticated: true,
    favoriteStoreIds: uniqueSignals(signals.favoriteStoreIds),
    watchlistProductIds: uniqueSignals(signals.watchlistProductIds),
    watchlistCategories: uniqueSignals(signals.watchlistCategories),
    recentBasketProductIds: uniqueSignals(signals.recentBasketProductIds),
    recentBasketCategories: uniqueSignals(signals.recentBasketCategories),
    source: 'session-user-preferences'
  };
}

function signalSet(values: readonly string[] = []) {
  return new Set(uniqueSignals(values));
}

function signalsForQuery(query: MyFlyerQuery) {
  return buildMyFlyerUserSignals(query.userSignals);
}

function signalFingerprint(signals: MyFlyerUserSignals) {
  if (!signals.authenticated) return 'anonymous-empty';
  return [
    signals.source,
    `stores=${signals.favoriteStoreIds.join('|')}`,
    `watch=${signals.watchlistProductIds.join('|')}`,
    `watchCat=${signals.watchlistCategories.join('|')}`,
    `basket=${signals.recentBasketProductIds.join('|')}`,
    `basketCat=${signals.recentBasketCategories.join('|')}`
  ].join(';');
}

function startOfIsoWeek(asOf: Date) {
  const date = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date;
}

function endOfIsoWeek(asOf: Date) {
  const date = startOfIsoWeek(asOf);
  date.setUTCDate(date.getUTCDate() + 6);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function comparableQuantity(offer: FlyerOffer) {
  if (!offer.packageQuantity || offer.packageQuantity <= 0 || !offer.packageUnit) return null;
  if (offer.packageUnit === 'g' || offer.packageUnit === 'ml') return offer.packageQuantity / 1000;
  return offer.packageQuantity;
}

function unitPriceFor(offer: FlyerOffer) {
  if (typeof offer.effectiveUnitPrice === 'number' && Number.isFinite(offer.effectiveUnitPrice) && offer.effectiveUnitPrice > 0) {
    return round(offer.effectiveUnitPrice);
  }
  const packageAmount = comparableQuantity(offer);
  if (!packageAmount || packageAmount <= 0) return null;
  return round(offer.offerPrice / packageAmount);
}

function expiryScoreFor(offer: FlyerOffer, asOfMs: number) {
  const validThroughMs = Date.parse(offer.validThrough);
  if (!Number.isFinite(validThroughMs)) return 0;
  const hoursRemaining = Math.max(0, (validThroughMs - asOfMs) / (60 * 60 * 1000));
  return round(Math.max(0, 12 - Math.min(hoursRemaining, 72) / 6), 1);
}

function scoreOffer(offer: FlyerOffer, query: MyFlyerQuery, asOfMs: number): Omit<MyFlyerRow, 'rank'> {
  const signals = signalsForQuery(query);
  const favoriteStores = signalSet(signals.favoriteStoreIds);
  const watchedProducts = signalSet(signals.watchlistProductIds);
  const watchedCategories = signalSet(signals.watchlistCategories);
  const recentBasketProducts = signalSet(signals.recentBasketProductIds);
  const recentBasketCategories = signalSet(signals.recentBasketCategories);
  const unitPrice = unitPriceFor(offer);
  const savings = offer.savings;
  const unitPriceScore = unitPrice === null ? 0 : round(Math.max(0, 30 - unitPrice / 4), 2);
  const watchlist = watchedProducts.has(offer.productId) || watchedCategories.has(offer.category) ? 18 : 0;
  const recentBasket = recentBasketProducts.has(offer.productId) || recentBasketCategories.has(offer.category) ? 10 : 0;
  const favoriteStore = favoriteStores.has(offer.storeId) ? 12 : 0;
  const confidence = round(offer.confidence * 10, 1);
  const expiry = expiryScoreFor(offer, asOfMs);
  const algorithmScore = {
    best_savings: savings * 3 + confidence + favoriteStore / 2 + watchlist / 3 + recentBasket / 3,
    best_unit_price: unitPriceScore * 3 + savings + confidence + favoriteStore / 2 + watchlist / 3 + recentBasket / 3,
    watchlist_first: watchlist * 3 + recentBasket * 2 + favoriteStore + savings * 1.5 + confidence + expiry
  }[query.algorithm];

  const explanation = [
    `${query.algorithm} ranker`,
    `${round(savings)} SEK savings`,
    favoriteStores.has(offer.storeId) ? 'authenticated favorite store boost' : 'all-store eligible',
    watchlist > 0 ? 'watchlist or category match' : 'general weekly promotion',
    recentBasket > 0 ? 'recent basket signal match' : 'no recent basket match',
    signals.authenticated ? 'authenticated user preference signals' : 'no authenticated user signals',
    offer.priceType === 'member_flyer' ? 'member flyer label retained' : 'public flyer price'
  ];

  return {
    offer,
    personalizedScore: round(algorithmScore, 2),
    scoreBreakdown: {
      savings,
      unitPrice,
      watchlist,
      recentBasket,
      favoriteStore,
      confidence,
      expiry
    },
    explanation
  };
}

function cacheKeyFor(query: MyFlyerQuery) {
  return `my-flyer:${query.userId}:${query.country}:${query.algorithm}:${query.limit}:${signalFingerprint(signalsForQuery(query))}`;
}

export function buildMyFlyerPayload(query: MyFlyerQuery, asOf = new Date()): MyFlyerPayload {
  const generatedAt = asOf.toISOString();
  const cacheKey = cacheKeyFor(query);

  if (query.country !== 'se') {
    return {
      userId: query.userId,
      country: query.country,
      algorithm: query.algorithm,
      generatedAt,
      week: {
        startsOn: startOfIsoWeek(asOf).toISOString(),
        endsOn: endOfIsoWeek(asOf).toISOString()
      },
      cache: { key: cacheKey, ttlSeconds },
      source: {
        offerCount: 0,
        guardrails: ['MyFlyer currently ranks source-backed Swedish weekly flyer rows only.']
      },
      rows: []
    };
  }

  const report = api.getFlyerOffers({ asOf: generatedAt });
  const asOfMs = asOf.getTime();
  const sourceOffers = query.algorithm === 'best_unit_price'
    ? report.offers.filter((offer) => unitPriceFor(offer) !== null)
    : report.offers;

  const rows = sourceOffers
    .map((offer) => scoreOffer(offer, query, asOfMs))
    .sort((left, right) =>
      right.personalizedScore - left.personalizedScore ||
      right.offer.confidence - left.offer.confidence ||
      Date.parse(left.offer.validThrough) - Date.parse(right.offer.validThrough) ||
      left.offer.chain.localeCompare(right.offer.chain) ||
      left.offer.storeName.localeCompare(right.offer.storeName) ||
      left.offer.productName.localeCompare(right.offer.productName) ||
      left.offer.offerId.localeCompare(right.offer.offerId)
    )
    .slice(0, query.limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    userId: query.userId,
    country: query.country,
    algorithm: query.algorithm,
    generatedAt,
    week: {
      startsOn: startOfIsoWeek(asOf).toISOString(),
      endsOn: endOfIsoWeek(asOf).toISOString()
    },
    cache: { key: cacheKey, ttlSeconds },
    source: {
      offerCount: report.offerCount,
      guardrails: [
        ...report.guardrails,
        'Best unit price ranking excludes flyer rows that lack package quantity, package unit, or effective unit-price evidence.',
        'Authenticated favorite stores, watchlist, and recent basket signals are used only when supplied by the session/user-preference source; MyFlyer does not derive a deterministic profile from user_id.'
      ]
    },
    rows
  };
}

export function getCachedMyFlyerPayload(query: MyFlyerQuery, now = Date.now()) {
  const key = cacheKeyFor(query);
  const cached = myFlyerCache.get(key);
  if (cached && cached.expiresAt > now) {
    return { payload: cached.payload, cacheStatus: 'HIT' as const };
  }

  const payload = buildMyFlyerPayload(query, new Date(now));
  myFlyerCache.set(key, { payload, expiresAt: now + ttlSeconds * 1000 });
  return { payload, cacheStatus: 'MISS' as const };
}

export function clearMyFlyerCache() {
  myFlyerCache.clear();
}
