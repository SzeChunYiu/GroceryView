import { NextResponse } from 'next/server';
import { buildRecommendedDealsFeed, shapeAccountRecommendationPreferences } from '@/lib/feed-recommendations';
import { buildCityPriceDropTrends } from '@/lib/trends';

export const dynamic = 'force-dynamic';

function parseLimit(value: string | null) {
  if (!value) return 6;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 6;
  return Math.max(1, Math.min(parsed, 12));
}

function readAccountPreferences(request: Request) {
  const raw = request.headers.get('x-groceryview-account-preferences');
  if (!raw) return null;

  try {
    return shapeAccountRecommendationPreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') ?? 'stockholm';
  const limit = parseLimit(searchParams.get('limit'));
  const trendFeed = buildCityPriceDropTrends({ city, limit: 12 });
  const recommended = buildRecommendedDealsFeed(trendFeed.cards, readAccountPreferences(request), limit);

  return NextResponse.json({
    city: trendFeed.city,
    generatedAt: trendFeed.generatedAt,
    source: trendFeed.source,
    ...recommended
  });
}
