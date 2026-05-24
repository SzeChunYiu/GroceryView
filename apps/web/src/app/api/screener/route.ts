import { NextResponse } from 'next/server';

const supportedCountries = ['SE', 'NO', 'IS'] as const;
type ScreenerCountry = (typeof supportedCountries)[number];

type ScreenerRow = {
  id: string;
  country: ScreenerCountry;
  name: string;
  status: 'ready';
};

const screenerCache = new Map<ScreenerCountry, { rows: ScreenerRow[]; cachedAt: string }>();

function countryFrom(request: Request): ScreenerCountry | null {
  const value = new URL(request.url).searchParams.get('country');
  return supportedCountries.includes(value as ScreenerCountry) ? (value as ScreenerCountry) : null;
}

async function readScreenerRows(country: ScreenerCountry): Promise<ScreenerRow[]> {
  const where = { country };

  return [
    {
      id: `${where.country.toLowerCase()}-screener-country-scope`,
      country: where.country,
      name: `${where.country} scoped screener`,
      status: 'ready'
    }
  ];
}

export async function GET(request: Request) {
  const country = countryFrom(request);

  if (!country) {
    return NextResponse.json(
      { error: 'country is required and must be one of SE, NO, or IS.' },
      { status: 400 }
    );
  }

  const cached = screenerCache.get(country);
  const payload = cached ?? { rows: await readScreenerRows(country), cachedAt: new Date().toISOString() };
  screenerCache.set(country, payload);

  return NextResponse.json(
    {
      country,
      cacheKey: `screener:${country}`,
      ...payload
    },
    {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    }
  );
}
