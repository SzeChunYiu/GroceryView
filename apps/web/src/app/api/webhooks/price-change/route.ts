import { NextResponse } from 'next/server';
import { dispatchPriceChangeWebhook } from './store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const result = await dispatchPriceChangeWebhook(await request.json());
    return NextResponse.json(result, { status: result.skippedReason ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid price change webhook request.';
    const status = message === 'webhook_database_unconfigured' ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
