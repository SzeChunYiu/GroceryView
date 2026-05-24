import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ClientErrorReport = {
  message: string;
  stack: string;
  route: string;
};

const MAX_FIELD_LENGTH = 8_000;

function boundedString(value: unknown, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, MAX_FIELD_LENGTH);
}

function reportFromPayload(payload: unknown): ClientErrorReport {
  const object = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  return {
    message: boundedString(object.message, 'Unhandled client error'),
    stack: boundedString(object.stack),
    route: boundedString(object.route, 'unknown')
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON error report payload.' }, { status: 400 });
  }

  const report = reportFromPayload(payload);
  if (!report.message.trim() || !report.route.trim()) {
    return NextResponse.json({ error: 'message and route are required.' }, { status: 400 });
  }

  console.error('Client error boundary report', {
    message: report.message,
    route: report.route,
    stack: report.stack
  });

  return NextResponse.json({ ok: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
