import { NextResponse } from 'next/server';
import { buildPredictiveDropAlerts, samplePredictiveDropAlerts } from '@/lib/alert-scheduler';
import { createPriceAlert, listPriceAlerts } from './store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alerts = await listPriceAlerts(searchParams.get('userEmail') ?? '');
    return NextResponse.json({ alerts, predictiveDropAlerts: samplePredictiveDropAlerts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert request.' },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const forecasts = Array.isArray(body?.forecasts) ? body.forecasts : Array.isArray(body?.forecastDrops) ? body.forecastDrops : null;

    if (forecasts) {
      return NextResponse.json({ predictiveDropAlerts: buildPredictiveDropAlerts(forecasts, body?.options) }, { status: 201 });
    }

    const alert = await createPriceAlert(body);
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert request.' },
      { status: 400 }
    );
  }
}
