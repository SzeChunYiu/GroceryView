import { NextResponse } from 'next/server';
import { buildCityPriceDropTrends } from '@/lib/trends';
import { rankTrendingDealsForHousehold } from '@/lib/personalization';

export const dynamic = 'force-static';

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
  const csv = (name: string) => (searchParams.get(name) ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  const feed = buildCityPriceDropTrends({ city, limit });

  return NextResponse.json({
    ...feed,
    cards: rankTrendingDealsForHousehold(feed.cards, {
      householdId: searchParams.get('householdId') ?? undefined,
      favoriteBrands: csv('favoriteBrands'),
      dietaryFilters: csv('dietary'),
      nearbyChains: csv('nearbyChains'),
      clickedProductSlugs: csv('clicked'),
    }),
    personalization: {
      signals: ['favoriteBrands', 'dietary', 'nearbyChains', 'clicked', 'household category history'],
    },
  });
}
