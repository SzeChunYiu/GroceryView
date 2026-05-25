import { NextResponse } from 'next/server';
import { buildCityPriceDropTrends } from '@/lib/trends';
import { rankTrendingDealsForHousehold } from '@/lib/personalization';

export const dynamic = 'force-static';

function normalizeFilterSlug(value: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? '';
}

function cardMatchesFilter(card: ReturnType<typeof buildCityPriceDropTrends>['cards'][number], filters: { category: string; chain: string }) {
  const categorySlug = normalizeFilterSlug(card.categoryLabel);
  const sourceSlug = normalizeFilterSlug(card.sourceLabel);
  return (!filters.category || categorySlug === filters.category)
    && (!filters.chain || sourceSlug.includes(filters.chain));
}

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
  const filters = {
    category: normalizeFilterSlug(searchParams.get('category')),
    chain: normalizeFilterSlug(searchParams.get('chain'))
  };
  const csv = (name: string) => (searchParams.get(name) ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  const feed = filters.category || filters.chain
    ? buildCityPriceDropTrends({ city, limit: 12 })
    : buildCityPriceDropTrends({ city, limit });
  const filteredCards = feed.cards.filter((card) => cardMatchesFilter(card, filters));
  const cards = rankTrendingDealsForHousehold(filteredCards, {
    householdId: searchParams.get('householdId') ?? undefined,
    favoriteBrands: csv('favoriteBrands'),
    dietaryFilters: csv('dietary'),
    nearbyChains: csv('nearbyChains'),
    clickedProductSlugs: csv('clicked'),
  }).slice(0, limit).map((card, index) => ({ ...card, rank: index + 1 }));

  return NextResponse.json({
    ...feed,
    filters,
    cards,
    personalization: {
      signals: ['favoriteBrands', 'dietary', 'nearbyChains', 'clicked', 'household category history'],
    },
  });
}
