import { NextResponse } from 'next/server';
import { buildCityPriceDropTrends } from '@/lib/trends';

export const dynamic = 'force-static';
export const revalidate = 300;

const trendingFeedCacheHeaders = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
};

function parseLimit(value: string | null) {
  if (!value) return 6;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 6;
  return Math.max(1, Math.min(parsed, 12));
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') ?? 'stockholm';
  const limit = parseLimit(searchParams.get('limit'));

  return NextResponse.json(
    buildCityPriceDropTrends({ city, limit }),
    { headers: trendingFeedCacheHeaders }
  );
}
