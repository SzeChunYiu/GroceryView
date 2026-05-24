import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dealOpportunityRail, watchlistAlerts } from '@/lib/demo-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FlyerAlgorithm = 'savings' | 'watchlist' | 'balanced';

type PersonalizedFlyerRow = {
  rank: number;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  currentPrice: number;
  regularPrice: number;
  savings: number;
  savingsPercent: number;
  dealScore: number;
  sourceConfidence: number;
  personalizedScore: number;
  personalizationReasons: string[];
};

type CachedFlyerPayload = {
  expiresAt: number;
  payload: MyFlyerPayload;
};

type MyFlyerPayload = {
  userId: string;
  country: string;
  algorithm: FlyerAlgorithm;
  limit: number;
  generatedAt: string;
  weekStartsOn: string;
  cacheTtlSeconds: number;
  source: string;
  rows: PersonalizedFlyerRow[];
};

const querySchema = z.object({
  algorithm: z.enum(['savings', 'watchlist', 'balanced']).default('balanced'),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()).default('SE'),
  limit: z.coerce.number().int().min(1).max(25).default(8),
  user_id: z.string().trim().min(1).max(128).default('anonymous')
});

const CACHE_TTL_MS = 60 * 60 * 1000;
const flyerCache = new Map<string, CachedFlyerPayload>();

function startOfIsoWeek(date: Date) {
  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
  return weekStart.toISOString().slice(0, 10);
}

function stableUserBoost(userId: string, productId: string) {
  const input = `${userId}:${productId}`;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return (hash % 13) / 10;
}

function buildPersonalizedFlyer(query: z.infer<typeof querySchema>, now = new Date()): MyFlyerPayload {
  const watchlistByProduct = new Map(watchlistAlerts.map((alert) => [alert.productSlug, alert]));
  const rows = dealOpportunityRail
    .filter((deal) => query.country === 'SE')
    .map((deal) => {
      const savings = Math.round((deal.regularPrice - deal.currentPrice) * 100) / 100;
      const savingsPercent = Math.round((savings / deal.regularPrice) * 1000) / 10;
      const watchlist = watchlistByProduct.get(deal.productId);
      const watchlistBoost = watchlist?.trigger === 'target met' ? 12 : watchlist ? 4 : 0;
      const algorithmBoost = query.algorithm === 'savings'
        ? savingsPercent
        : query.algorithm === 'watchlist'
          ? watchlistBoost * 1.5
          : (savingsPercent * 0.45) + watchlistBoost;
      const personalizedScore = Math.round((deal.dealScore + algorithmBoost + stableUserBoost(query.user_id, deal.productId)) * 10) / 10;
      const personalizationReasons = [
        `${savings.toFixed(2)} SEK off this week`,
        `${Math.round(deal.sourceConfidence * 100)}% source confidence`,
        ...(watchlist ? [watchlist.nextAction] : [`Ranked with ${query.algorithm} algorithm for ${query.user_id}`])
      ];
      return {
        productId: deal.productId,
        productName: deal.productName,
        storeId: deal.storeId,
        storeName: deal.storeName,
        currentPrice: deal.currentPrice,
        regularPrice: deal.regularPrice,
        savings,
        savingsPercent,
        dealScore: deal.dealScore,
        sourceConfidence: deal.sourceConfidence,
        personalizedScore,
        personalizationReasons
      };
    })
    .sort((left, right) => right.personalizedScore - left.personalizedScore || right.savings - left.savings || left.productName.localeCompare(right.productName, 'sv'))
    .slice(0, query.limit)
    .map((row, index) => ({ rank: index + 1, ...row }));

  return {
    userId: query.user_id,
    country: query.country,
    algorithm: query.algorithm,
    limit: query.limit,
    generatedAt: now.toISOString(),
    weekStartsOn: startOfIsoWeek(now),
    cacheTtlSeconds: CACHE_TTL_MS / 1000,
    source: 'visible ranked deal rows + watchlist personalization fixtures',
    rows
  };
}

function cacheKey(query: z.infer<typeof querySchema>) {
  return [query.user_id, query.country, query.algorithm, query.limit].join(':');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_my_flyer_query', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const key = cacheKey(parsed.data);
  const nowMs = Date.now();
  const cached = flyerCache.get(key);
  if (cached && cached.expiresAt > nowMs) {
    return NextResponse.json(
      { ...cached.payload, cache: { status: 'hit', key, expiresAt: new Date(cached.expiresAt).toISOString() } },
      { headers: { 'Cache-Control': 'private, max-age=3600' } }
    );
  }

  const payload = buildPersonalizedFlyer(parsed.data, new Date(nowMs));
  flyerCache.set(key, { payload, expiresAt: nowMs + CACHE_TTL_MS });
  return NextResponse.json(
    { ...payload, cache: { status: 'miss', key, expiresAt: new Date(nowMs + CACHE_TTL_MS).toISOString() } },
    { headers: { 'Cache-Control': 'private, max-age=3600' } }
  );
}
