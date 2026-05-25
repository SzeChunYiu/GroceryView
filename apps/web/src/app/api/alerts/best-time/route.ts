import { NextResponse } from 'next/server';
import { buildBestTimeToBuyAlert, type FlyerWindow, type PriceForecastObservation } from '@/lib/price-intelligence';

type BestTimeAlertPayload = {
  categories?: unknown;
  confidenceThreshold?: unknown;
  currentPrice?: unknown;
  currentStoreName?: unknown;
  priceHistory?: unknown;
  productId?: unknown;
  productName?: unknown;
  targetStores?: unknown;
  upcomingFlyerWindows?: unknown;
};

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : [];
}

function parseConfidenceThreshold(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0.75);
  return Number.isFinite(numeric) ? Math.min(0.99, Math.max(0.5, numeric)) : 0.75;
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value.trim();
}

function requiredPositiveNumber(value: unknown, field: string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`${field} must be a positive number.`);
  }
  return numeric;
}

function parsePriceHistory(value: unknown): PriceForecastObservation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as Record<string, unknown>;
      const observedAt = typeof candidate.observedAt === 'string' ? candidate.observedAt : '';
      const price = typeof candidate.price === 'number' ? candidate.price : Number(candidate.price);
      return observedAt && Number.isFinite(price) && price > 0 ? { observedAt, price } : null;
    })
    .filter((entry): entry is PriceForecastObservation => entry !== null);
}

function parseFlyerWindows(value: unknown): FlyerWindow[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const candidate = entry as Record<string, unknown>;
      const storeName = typeof candidate.storeName === 'string' ? candidate.storeName.trim() : '';
      const categoryLabel = typeof candidate.categoryLabel === 'string' ? candidate.categoryLabel.trim() : '';
      const startsAt = typeof candidate.startsAt === 'string' ? candidate.startsAt : '';
      const endsAt = typeof candidate.endsAt === 'string' ? candidate.endsAt : '';
      const expectedDiscountPct = candidate.expectedDiscountPct === undefined || candidate.expectedDiscountPct === null
        ? null
        : Number(candidate.expectedDiscountPct);
      if (!storeName || !categoryLabel || !startsAt || !endsAt) return [];
      const expectedDiscount = expectedDiscountPct === null || !Number.isFinite(expectedDiscountPct) ? null : expectedDiscountPct;
      return [{
        storeName,
        categoryLabel,
        startsAt,
        endsAt,
        expectedDiscountPct: expectedDiscount
      }];
    });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as BestTimeAlertPayload;
    const targetStores = stringList(body.targetStores);
    const categories = stringList(body.categories);
    const confidenceThreshold = parseConfidenceThreshold(body.confidenceThreshold);
    const recommendation = buildBestTimeToBuyAlert({
      productId: requiredString(body.productId, 'productId'),
      productName: requiredString(body.productName, 'productName'),
      currentPrice: requiredPositiveNumber(body.currentPrice, 'currentPrice'),
      currentStoreName: requiredString(body.currentStoreName, 'currentStoreName'),
      priceHistory: parsePriceHistory(body.priceHistory),
      upcomingFlyerWindows: parseFlyerWindows(body.upcomingFlyerWindows)
    });

    if (targetStores.length === 0 || categories.length === 0) {
      return NextResponse.json({ error: 'targetStores and categories are required to create a best-time-to-buy alert rule.' }, { status: 400 });
    }

    return NextResponse.json(
      {
        rule: {
          id: `best-time-${targetStores.join('-').toLowerCase()}-${categories.join('-').toLowerCase()}`.replace(/[^a-z0-9-]/g, '-'),
          targetStores,
          categories,
          confidenceThreshold,
          notifyWhen: 'buy-now-or-wait-decision',
          status: 'active'
        },
        recommendation
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid best-time-to-buy alert request.' },
      { status: 400 }
    );
  }
}

export function GET() {
  return NextResponse.json({
    requiredInputs: ['productId', 'productName', 'currentPrice', 'currentStoreName', 'priceHistory', 'upcomingFlyerWindows', 'targetStores', 'categories', 'confidenceThreshold'],
    confidenceThreshold: { min: 0.5, max: 0.99, default: 0.75 },
    notifyWhen: 'buy-now-or-wait-decision',
    decisionInputs: ['historical volatility', 'current price vs historical average', 'upcoming flyer windows']
  });
}
