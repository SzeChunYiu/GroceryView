import { NextResponse } from 'next/server';
import { getSearchToSavingsFunnelDashboard, recordSearchToSavingsFunnelEvents } from '@/lib/search-to-savings-funnel';

type FunnelPayload = {
  events?: unknown;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getSearchToSavingsFunnelDashboard());
}

export async function POST(request: Request) {
  let payload: FunnelPayload;

  try {
    payload = await request.json() as FunnelPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0 || events.length > 50) {
    return NextResponse.json({ error: 'Expected 1-50 aggregate funnel events.' }, { status: 400 });
  }

  const result = recordSearchToSavingsFunnelEvents(events);
  if (result.accepted === 0) {
    return NextResponse.json({ error: 'No valid aggregate funnel events.', ...result }, { status: 400 });
  }

  return NextResponse.json({
    ...result,
    dashboard: getSearchToSavingsFunnelDashboard()
  });
}
