import { NextResponse } from 'next/server';
import { getCoreWebVitalsDashboard, recordCoreWebVitalEvents } from '@/lib/core-web-vitals';

type CoreWebVitalsPayload = {
  events?: unknown;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getCoreWebVitalsDashboard());
}

export async function POST(request: Request) {
  let payload: CoreWebVitalsPayload;

  try {
    payload = await request.json() as CoreWebVitalsPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0 || events.length > 50) {
    return NextResponse.json({ error: 'Expected 1-50 Core Web Vitals events.' }, { status: 400 });
  }

  const result = recordCoreWebVitalEvents(events);
  if (result.accepted === 0) {
    return NextResponse.json({ error: 'No valid Core Web Vitals events.', result }, { status: 400 });
  }

  return NextResponse.json({
    result,
    dashboard: getCoreWebVitalsDashboard()
  });
}
