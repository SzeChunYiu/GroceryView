import { NextResponse } from 'next/server';
import { buildTrendingDiscoveryFeed } from '@/lib/trends';

export const dynamic = 'force-static';

function parseLimit(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 12)) : fallback;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighborhood = searchParams.get('neighborhood')?.trim() || 'Södermalm';
  const region = searchParams.get('region')?.trim() || searchParams.get('city')?.trim() || 'stockholm';
  const categoryLimit = parseLimit(searchParams.get('categoryLimit'), 4);
  const productLimit = parseLimit(searchParams.get('productLimit'), 6);
  const feed = buildTrendingDiscoveryFeed({ city: region, categoryLimit, productLimit });

  return NextResponse.json({
    ...feed,
    neighborhood,
    region: feed.city,
    scopeLabel: `${neighborhood} · ${feed.city}`,
    privacyNote: 'Neighborhood trends are aggregated discovery signals; no household address, identity, or private basket is returned.',
  });
}
