import { NextResponse } from 'next/server';
import { getProductConversionDashboard, recordProductConversionEvents } from '@/lib/analytics';
import { getSearchToSavingsFunnelDashboard, recordSearchToSavingsFunnelEvents } from '@/lib/search-to-savings-funnel';

type FunnelPayload = {
  events?: unknown;
  productConversionEvents?: unknown;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ...getSearchToSavingsFunnelDashboard(),
    productConversions: getProductConversionDashboard()
  });
}

export async function POST(request: Request) {
  let payload: FunnelPayload;

  try {
    payload = await request.json() as FunnelPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  const productConversionEvents = Array.isArray(payload.productConversionEvents) ? payload.productConversionEvents : [];
  if ((events.length === 0 && productConversionEvents.length === 0) || events.length > 50 || productConversionEvents.length > 50) {
    return NextResponse.json({ error: 'Expected 1-50 aggregate funnel events or product conversion events.' }, { status: 400 });
  }

  const funnelResult = events.length > 0
    ? recordSearchToSavingsFunnelEvents(events)
    : { accepted: 0, rejected: 0 };
  const productConversionResult = productConversionEvents.length > 0
    ? recordProductConversionEvents(productConversionEvents)
    : { accepted: 0, rejected: 0 };
  if (funnelResult.accepted === 0 && productConversionResult.accepted === 0) {
    return NextResponse.json({
      error: 'No valid aggregate funnel or product conversion events.',
      funnel: funnelResult,
      productConversions: productConversionResult
    }, { status: 400 });
  }

  return NextResponse.json({
    funnel: funnelResult,
    productConversions: productConversionResult,
    dashboard: {
      ...getSearchToSavingsFunnelDashboard(),
      productConversions: getProductConversionDashboard()
    }
  });
}
