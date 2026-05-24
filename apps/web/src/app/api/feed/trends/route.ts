import { NextResponse } from 'next/server';

type TrendSeed = {
  item: string;
  neighborhood: string;
  region: string;
  liftPct: number;
  signal: string;
};

const trendSeeds: TrendSeed[] = [
  { item: 'Oat milk', neighborhood: 'Möllevången', region: 'Skåne', liftPct: 18, signal: 'breakfast baskets' },
  { item: 'Fresh coriander', neighborhood: 'Möllevången', region: 'Skåne', liftPct: 14, signal: 'weeknight tacos' },
  { item: 'Rye crispbread', neighborhood: 'Södermalm', region: 'Stockholm', liftPct: 16, signal: 'pantry restocks' },
  { item: 'Frozen blueberries', neighborhood: 'Södermalm', region: 'Stockholm', liftPct: 11, signal: 'smoothie baskets' },
  { item: 'Halloumi', neighborhood: 'Linné', region: 'Västra Götaland', liftPct: 13, signal: 'grill lists' },
  { item: 'Baby spinach', neighborhood: 'Linné', region: 'Västra Götaland', liftPct: 9, signal: 'lunch salads' }
];

function normalize(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighborhood = normalize(searchParams.get('neighborhood'), 'Möllevången');
  const region = normalize(searchParams.get('region'), 'Skåne');
  const exactRows = trendSeeds.filter((trend) => trend.neighborhood.toLowerCase() === neighborhood.toLowerCase() && trend.region.toLowerCase() === region.toLowerCase());
  const regionalRows = trendSeeds.filter((trend) => trend.region.toLowerCase() === region.toLowerCase() && !exactRows.includes(trend));
  const fallbackRows = trendSeeds.filter((trend) => !exactRows.includes(trend) && !regionalRows.includes(trend));

  return NextResponse.json({
    scope: 'neighborhood_region',
    countryWide: false,
    neighborhood,
    region,
    rows: [...exactRows, ...regionalRows, ...fallbackRows].slice(0, 4).map((trend, index) => ({
      ...trend,
      rank: index + 1,
      scope: trend.neighborhood.toLowerCase() === neighborhood.toLowerCase() && trend.region.toLowerCase() === region.toLowerCase() ? 'neighborhood' : trend.region.toLowerCase() === region.toLowerCase() ? 'region' : 'nearby signal'
    }))
  });
}
