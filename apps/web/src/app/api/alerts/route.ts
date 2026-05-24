import { NextResponse } from 'next/server';
import { createPriceAlert, listPriceAlerts } from './store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PriceDropAlertBody = Record<string, unknown>;

function numberFrom(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function textFrom(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function pushEndpointFrom(body: PriceDropAlertBody) {
  const pushSubscription = body.pushSubscription;
  if (pushSubscription && typeof pushSubscription === 'object' && 'endpoint' in pushSubscription) {
    return textFrom((pushSubscription as { endpoint?: unknown }).endpoint);
  }
  return textFrom(body.pushEndpoint);
}

function buildImmediatePriceDropPush(body: PriceDropAlertBody) {
  const previousPrice = numberFrom(body.previousPrice ?? body.lastSeenPrice);
  const currentPrice = numberFrom(body.currentPrice ?? body.latestPrice);
  const thresholdPercent = numberFrom(body.thresholdPercent ?? body.dropThresholdPercent) ?? 10;

  if (!previousPrice || currentPrice === null || currentPrice >= previousPrice) {
    return null;
  }

  const dropPercent = ((previousPrice - currentPrice) / previousPrice) * 100;
  if (dropPercent < thresholdPercent) {
    return null;
  }

  const productName = textFrom(body.productName) ?? 'Watchlist item';
  const storeName = textFrom(body.storeName) ?? 'a watched store';

  return {
    channel: 'push',
    status: pushEndpointFrom(body) ? 'queued' : 'ready_for_subscription',
    sendAt: 'immediate',
    priority: 'urgent',
    title: `${productName} dropped ${dropPercent.toFixed(1)}%`,
    body: `${productName} is ${currentPrice} SEK at ${storeName}, beating the ${thresholdPercent}% alert threshold.`,
    dropPercent: Number(dropPercent.toFixed(1)),
    thresholdPercent
  };
}

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
    const body = await request.json();
    const alert = await createPriceAlert(body);
    const immediatePush = buildImmediatePriceDropPush(body);
    return NextResponse.json(immediatePush ? { alert, immediatePush } : alert, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid alert request.' },
      { status: 400 }
    );
  }
}
