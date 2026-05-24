import { NextResponse } from 'next/server';

type ImpressionPayload = {
  events?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidImpression(value: unknown) {
  if (!isRecord(value)) return false;
  return typeof value.itemId === 'string'
    && value.itemId.length > 0
    && typeof value.itemName === 'string'
    && typeof value.listId === 'string'
    && typeof value.listIndex === 'number'
    && Number.isInteger(value.listIndex)
    && value.listIndex >= 0
    && typeof value.compareMode === 'string'
    && typeof value.observedAt === 'string';
}

export async function POST(request: Request) {
  let payload: ImpressionPayload;

  try {
    payload = await request.json() as ImpressionPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0 || events.length > 20 || !events.every(isValidImpression)) {
    return NextResponse.json({ error: 'Invalid item card impression batch.' }, { status: 400 });
  }

  return NextResponse.json({ accepted: events.length });
}
