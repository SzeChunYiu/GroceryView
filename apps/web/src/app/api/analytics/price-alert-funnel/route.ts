import { NextResponse } from 'next/server';

const funnelSteps = new Set(['button_click', 'dialog_open', 'form_submit', 'success']);

type PriceAlertFunnelPayload = {
  events?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidPriceAlertFunnelEvent(value: unknown) {
  if (!isRecord(value)) return false;
  const targetPrice = value.targetPrice;
  return typeof value.productId === 'string'
    && typeof value.source === 'string'
    && typeof value.step === 'string'
    && funnelSteps.has(value.step)
    && typeof value.occurredAt === 'string'
    && (targetPrice === undefined || typeof targetPrice === 'number');
}

export async function POST(request: Request) {
  let payload: PriceAlertFunnelPayload;

  try {
    payload = await request.json() as PriceAlertFunnelPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0 || events.length > 20 || !events.every(isValidPriceAlertFunnelEvent)) {
    return NextResponse.json({ error: 'Invalid price alert funnel event batch.' }, { status: 400 });
  }

  return NextResponse.json({ accepted: events.length });
}
