import { NextRequest, NextResponse } from 'next/server';
import {
  databaseTrendingFeedPayload,
  normalizeTrendingCity,
  staticTrendingFeedPayload,
  trendingWindow
} from '@/lib/trends';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const window = trendingWindow();
  const city = normalizeTrendingCity(request.nextUrl.searchParams.get('city'));
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      staticTrendingFeedPayload(window, city, city ? 'trending_database_unconfigured' : undefined),
      { status: city ? 503 : 200 }
    );
  }

  try {
    return NextResponse.json(await databaseTrendingFeedPayload(databaseUrl, window, city));
  } catch (error) {
    console.error('Trending feed query failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json(
      staticTrendingFeedPayload(window, city, 'trending_query_failed'),
      { status: 500 }
    );
  }
}
