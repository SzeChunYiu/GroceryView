import { NextResponse } from 'next/server';
import { createPriceAlert, listPriceAlerts, listStalePriceWarnings } from './store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') ?? '';
    const staleAfterHours = searchParams.get('staleAfterHours') ?? undefined;
    const now = searchParams.get('now') ?? undefined;
    const alerts = await listPriceAlerts(userEmail);
    const stalePriceWarnings = await listStalePriceWarnings(userEmail, { staleAfterHours: staleAfterHours ? Number(staleAfterHours) : undefined, now });
    return NextResponse.json({ alerts, stalePriceWarnings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert request.' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const alert = await createPriceAlert(await request.json());
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert request.' },
      { status: 400 }
    );
  }
}
