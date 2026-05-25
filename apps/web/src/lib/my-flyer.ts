import { createGroceryViewApi, type FlyerOffer } from '@groceryview/api';
import { rankMyBasketPromos } from '@groceryview/core';

export const myFlyerAlgorithms = ['best_savings', 'best_unit_price', 'watchlist_first'] as const;
export const myFlyerCountries = ['se', 'no', 'dk', 'fi'] as const;

export type MyFlyerAlgorithm = (typeof myFlyerAlgorithms)[number];
export type MyFlyerCountry = (typeof myFlyerCountries)[number];

export type MyFlyerQuery = {
  userId: string;
  algorithm: MyFlyerAlgorithm;
  country: MyFlyerCountry;
  limit: number;
};

export type MyFlyerRow = {
  rank: number;
  offer: FlyerOffer;
  personalizedScore: number;
  scoreBreakdown: {
    savings: number;
    unitPrice: number | null;
    watchlist: number;
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

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function userHash(userId: string) {
  let hash = 0;
  for (const char of userId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function profileForUser(userId: string) {
  const hash = userHash(userId);
  const favoriteStores = hash % 2 === 0 ? new Set(['willys-odenplan', 'lidl-sveavagen']) : new Set(['coop-odenplan']);
  const watchedProducts = hash % 3 === 0 ? new Set(['coffee', 'butter']) : new Set(['milk', 'private-label-milk']);
  const watchedCategories = hash % 5 === 0 ? new Set(['dairy']) : new Set(['coffee']);

  const recentBasketProducts = hash % 2 === 0 ? new Set(['oat-milk', 'milk']) : new Set(['coffee', 'pasta']);

  return { favoriteStores, watchedProducts, watchedCategories, recentBasketProducts };
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

function unitEconomicsEvidence(offer: FlyerOffer, unitPrice: number | null) {
  if (unitPrice === null) return 'missing package or effective unit-price evidence';
  if (offer.packageQuantity && offer.packageUnit) return `${offer.packageQuantity}${offer.packageUnit} package evidence`;
  return `${unitPrice} SEK/${offer.effectiveUnitPriceUnit ?? 'unit'} effective unit price evidence`;
}

function expiryScoreFor(offer: FlyerOffer, asOfMs: number) {
  const validThroughMs = Date.parse(offer.validThrough);
  if (!Number.isFinite(validThroughMs)) return 0;
  const hoursRemaining = Math.max(0, (validThroughMs - asOfMs) / (60 * 60 * 1000));
  return round(Math.max(0, 12 - Math.min(hoursRemaining, 72) / 6), 1);
}

function scoreOffer(offer: FlyerOffer, query: MyFlyerQuery, asOfMs: number): Omit<MyFlyerRow, 'rank'> {
  const profile = profileForUser(query.userId);
  const unitPrice = unitPriceFor(offer);
  const savings = offer.savings;
  const unitPriceScore = unitPrice === null ? 0 : round(Math.max(0, 30 - unitPrice / 4), 2);
  const watchlist = profile.watchedProducts.has(offer.productId) || profile.watchedCategories.has(offer.category) ? 18 : 0;
  const favoriteStore = profile.favoriteStores.has(offer.storeId) ? 12 : 0;
  const confidence = round(offer.confidence * 10, 1);
  const expiry = expiryScoreFor(offer, asOfMs);
  const algorithmScore = {
    best_savings: savings * 3 + confidence + favoriteStore / 2 + watchlist / 3,
    best_unit_price: unitPriceScore * 3 + savings + confidence + favoriteStore / 2 + watchlist / 3,
    watchlist_first: watchlist * 3 + favoriteStore + savings * 1.5 + confidence + expiry
  }[query.algorithm];

  const explanation = [
    `${query.algorithm} ranker`,
    `${round(savings)} SEK savings`,
    unitEconomicsEvidence(offer, unitPrice),
    profile.favoriteStores.has(offer.storeId) ? 'favorite store boost' : 'all-store eligible',
    watchlist > 0 ? 'watchlist or category match' : 'general weekly promotion',
    offer.priceType === 'member_flyer' ? 'member flyer label retained' : 'public flyer price'
  ];

  return {
    offer,
    personalizedScore: round(algorithmScore, 2),
    scoreBreakdown: {
      savings,
      unitPrice,
      watchlist,
      favoriteStore,
      confidence,
      expiry
    },
    explanation
  };
}

function cacheKeyFor(query: MyFlyerQuery) {
  return `my-flyer:${query.userId}:${query.country}:${query.algorithm}:${query.limit}`;
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

  const myBasketPromos = rankMyBasketPromos({
    asOf,
    promos: sourceOffers.map((offer) => ({
      ...offer,
      promoId: offer.offerId,
      listingId: offer.productId,
      coveredListingIds: [offer.productId, offer.category],
      savings: offer.savings
    })),
    topN: query.limit,
    user: {
      watchlist: [...profileForUser(query.userId).watchedProducts, ...profileForUser(query.userId).watchedCategories].map((listingId) => ({ listingId })),
      recentBasketHistory: [...profileForUser(query.userId).recentBasketProducts].map((listingId) => ({ listingId, purchasedAt: asOf }))
    }
  });

  const rows = myBasketPromos
    .map((offer) => scoreOffer(offer, query, asOfMs))
    .sort((left, right) =>
      right.offer.savings - left.offer.savings ||
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
        'Best unit price ranking excludes flyer rows that lack package quantity, package unit, or effective unit-price evidence.'
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
