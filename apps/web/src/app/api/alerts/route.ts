import { NextResponse } from 'next/server';
import { createPriceAlert, listPriceAlerts } from './store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return NextResponse.json({ alerts: await listPriceAlerts(searchParams.get('userEmail') ?? '') });
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
