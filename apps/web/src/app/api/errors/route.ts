import { NextResponse } from 'next/server';

const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 4_000;
const MAX_ROUTE_LENGTH = 300;

function boundedString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_error_report_payload' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_error_report_payload' }, { status: 400 });
  }

  const report = body as Record<string, unknown>;
  const message = boundedString(report.message, MAX_MESSAGE_LENGTH);
  const route = boundedString(report.route, MAX_ROUTE_LENGTH);
  const stack = boundedString(report.stack, MAX_STACK_LENGTH);

  if (!message) {
    return NextResponse.json({ error: 'error_message_required' }, { status: 400 });
  }

  console.error('Client global error reported', {
    message,
    route: route || 'unknown',
    hasStack: stack.length > 0
  });

  return NextResponse.json({ status: 'accepted' }, { status: 202 });
}
