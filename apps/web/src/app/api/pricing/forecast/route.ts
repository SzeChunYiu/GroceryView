import { NextResponse } from 'next/server';

import { calculateBasketForecast, type BasketForecastItem } from '@/lib/basket-forecast';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { items?: BasketForecastItem[] };
  const items = Array.isArray(body.items) ? body.items : [];

  return NextResponse.json(calculateBasketForecast(items));
}

export function GET() {
  return NextResponse.json(calculateBasketForecast([]));
}
