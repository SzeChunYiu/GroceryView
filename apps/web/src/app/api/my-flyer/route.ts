import { NextResponse } from 'next/server';
import { z } from 'zod';
import { categoryDealLeaders, digitalCatalogueOfferBoard, snapshot } from '@/lib/verified-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_CONTROL = 'private, max-age=3600';

const myFlyerQuerySchema = z.object({
  algorithm: z.enum(['best-deals', 'ending-soon', 'nearby-savings']).default('best-deals'),
  country: z.enum(['SE', 'NO', 'IS']).default('SE'),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  user_id: z.string().trim().min(1).max(120).default('guest')
});

type MyFlyerQuery = z.infer<typeof myFlyerQuerySchema>;
type MyFlyerPayload = ReturnType<typeof buildMyFlyerPayload>;

const responseCache = new Map<string, { expiresAt: number; payload: MyFlyerPayload }>();

type FlyerPromoRow = {
  id: string;
  productName: string;
  categoryLabel: string;
  storeName: string;
  priceText: string;
  validTo: string;
  sourceUrl: string;
  flyerUrl?: string;
  flyerPdfUrl?: string;
  rankScore: number;
  rankReason: string;
  evidenceLabel: string;
};

function queryObject(searchParams: URLSearchParams) {
  return {
    algorithm: searchParams.get('algorithm') ?? undefined,
    country: searchParams.get('country') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    user_id: searchParams.get('user_id') ?? undefined
  };
}

function cacheKey(query: MyFlyerQuery) {
  return [query.user_id, query.country, query.algorithm, query.limit].join(':');
}

function offerRows(): FlyerPromoRow[] {
  const catalogueRows = digitalCatalogueOfferBoard.sampleOffers.map((offer, index) => ({
    id: `catalogue-${offer.code}`,
    productName: offer.productName,
    categoryLabel: offer.category,
    storeName: offer.storeName,
    priceText: offer.priceText,
    validTo: offer.validTo,
    sourceUrl: offer.sourceUrl,
    flyerUrl: offer.flyerUrl,
    flyerPdfUrl: offer.flyerPdfUrl,
    rankScore: 70 - index,
    rankReason: 'ICA public weekly catalogue row with flyer source evidence',
    evidenceLabel: offer.evidenceLabel
  }));

  const dealLeaderRows = categoryDealLeaders.map((leader, index) => ({
    id: `deal-leader-${leader.productSlug}`,
    productName: leader.productName,
    categoryLabel: leader.categoryLabel,
    storeName: leader.storeName,
    priceText: new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(leader.price),
    validTo: snapshot.retrievedLabel,
    sourceUrl: `/products/${leader.productSlug}`,
    rankScore: leader.dealScore - index / 100,
    rankReason: 'category deal score from verified cross-chain prices',
    evidenceLabel: leader.evidenceLabel
  }));

  return [...catalogueRows, ...dealLeaderRows];
}

function rankRows(rows: FlyerPromoRow[], algorithm: MyFlyerQuery['algorithm']) {
  if (algorithm === 'ending-soon') {
    return [...rows].sort((left, right) => left.validTo.localeCompare(right.validTo) || right.rankScore - left.rankScore);
  }
  if (algorithm === 'nearby-savings') {
    return [...rows].sort((left, right) => left.storeName.localeCompare(right.storeName, 'sv') || right.rankScore - left.rankScore);
  }
  return [...rows].sort((left, right) => right.rankScore - left.rankScore || left.productName.localeCompare(right.productName, 'sv'));
}

function buildMyFlyerPayload(query: MyFlyerQuery) {
  if (query.country !== 'SE') {
    return {
      status: 'ok',
      country: query.country,
      algorithm: query.algorithm,
      userId: query.user_id,
      cachedForSeconds: 3600,
      generatedAt: new Date().toISOString(),
      source: 'verified flyer payload: fail-closed country gate',
      sections: [],
      rows: [],
      guardrails: [
        `No ${query.country} flyer rows are emitted until verified country-scoped flyer sources exist.`,
        'The endpoint does not mix SEK flyer rows into Norway or Iceland payloads.'
      ]
    };
  }

  const rows = rankRows(offerRows(), query.algorithm).slice(0, query.limit);
  return {
    status: 'ok',
    country: query.country,
    algorithm: query.algorithm,
    userId: query.user_id,
    cachedForSeconds: 3600,
    generatedAt: new Date().toISOString(),
    source: digitalCatalogueOfferBoard.sourceLabel,
    sections: [
      {
        id: query.algorithm,
        title: query.algorithm === 'ending-soon' ? 'Quick wins ending soon' : query.algorithm === 'nearby-savings' ? 'Nearby savings by store' : 'Best verified flyer deals',
        rowIds: rows.map((row) => row.id)
      }
    ],
    rows,
    guardrails: [
      'Rows are ranked from verified catalogue offers and category deal leaders only.',
      'The user_id is used only as the cache partition; no private basket, location, or profile data is read in this static endpoint.',
      'Cache entries expire after one hour per user_id, country, algorithm, and limit.'
    ]
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = myFlyerQuerySchema.safeParse(queryObject(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_my_flyer_query', issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const query = parsed.data;
  const key = cacheKey(query);
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.payload, cache: 'hit' }, { headers: { 'Cache-Control': CACHE_CONTROL } });
  }

  const payload = buildMyFlyerPayload(query);
  responseCache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
  return NextResponse.json({ ...payload, cache: 'miss' }, { headers: { 'Cache-Control': CACHE_CONTROL } });
}
