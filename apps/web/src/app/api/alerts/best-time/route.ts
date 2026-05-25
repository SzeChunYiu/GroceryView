import { NextResponse } from 'next/server';
import { buildBestTimeAlertExplanationTimeline } from '@/lib/alert-scheduler';
import { buildBestTimeToBuyAlert, type FlyerWindow, type PriceForecastObservation } from '@/lib/price-intelligence';

type BestTimeAlertPayload = {
  accountId?: unknown;
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
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
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
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const candidate = entry as Record<string, unknown>;
      const storeName = typeof candidate.storeName === 'string' ? candidate.storeName.trim() : '';
      const categoryLabel = typeof candidate.categoryLabel === 'string' ? candidate.categoryLabel.trim() : '';
      const startsAt = typeof candidate.startsAt === 'string' ? candidate.startsAt : '';
      const endsAt = typeof candidate.endsAt === 'string' ? candidate.endsAt : '';
      const expectedDiscountPct = candidate.expectedDiscountPct === undefined || candidate.expectedDiscountPct === null
        ? null
        : Number(candidate.expectedDiscountPct);
      if (!storeName || !categoryLabel || !startsAt || !endsAt) return null;
      const expectedDiscount = expectedDiscountPct === null || !Number.isFinite(expectedDiscountPct) ? null : expectedDiscountPct;
      return {
        storeName,
        categoryLabel,
        startsAt,
        endsAt,
        expectedDiscountPct: expectedDiscount
      };
    })
    .filter((entry): entry is FlyerWindow => entry !== null);
}

async function readBestTimeAlertPayload(request: Request): Promise<BestTimeAlertPayload> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    return Object.fromEntries(await request.formData()) as BestTimeAlertPayload;
  }
  return (await request.json().catch(() => ({}))) as BestTimeAlertPayload;
}

function hasRecommendationInputs(body: BestTimeAlertPayload) {
  return body.productId !== undefined
    || body.productName !== undefined
    || body.currentPrice !== undefined
    || body.currentStoreName !== undefined
    || body.priceHistory !== undefined
    || body.upcomingFlyerWindows !== undefined;
}

export async function POST(request: Request) {
  try {
    const body = await readBestTimeAlertPayload(request);
    const targetStores = stringList(body.targetStores);
    const categories = stringList(body.categories);
    const confidenceThreshold = parseConfidenceThreshold(body.confidenceThreshold);

    if (targetStores.length === 0 || categories.length === 0) {
      return NextResponse.json({ error: 'targetStores and categories are required to create a best-time-to-buy alert rule.' }, { status: 400 });
    }

    const recommendation = hasRecommendationInputs(body)
      ? buildBestTimeToBuyAlert({
        productId: requiredString(body.productId, 'productId'),
        productName: requiredString(body.productName, 'productName'),
        currentPrice: requiredPositiveNumber(body.currentPrice, 'currentPrice'),
        currentStoreName: requiredString(body.currentStoreName, 'currentStoreName'),
        priceHistory: parsePriceHistory(body.priceHistory),
        upcomingFlyerWindows: parseFlyerWindows(body.upcomingFlyerWindows)
      })
      : null;
    const explanationTimeline = recommendation
      ? buildBestTimeAlertExplanationTimeline({
        productName: recommendation.productName,
        categoryLabel: categories.join(', '),
        decisionLabel: recommendation.decisionLabel,
        flyerWindowLabel: recommendation.upcomingFlyerWindow ? recommendation.flyerWindowLabel : undefined,
        observedPriceCount: recommendation.observedPriceCount,
        observedRangeLabel: recommendation.observedRangeLabel,
        volatilityScore: recommendation.volatilityScore
      })
      : buildBestTimeAlertExplanationTimeline({
        productName: 'Watched category rule',
        categoryLabel: categories.join(', '),
        seasonalityLabel: `Rule applies only to ${categories.join(', ')} at ${targetStores.join(', ')} when confidence clears ${(confidenceThreshold * 100).toFixed(0)}%.`,
        volatilityScore: null
      });

    return NextResponse.json(
      {
        rule: {
          id: `best-time-${targetStores.join('-').toLowerCase()}-${categories.join('-').toLowerCase()}`.replace(/[^a-z0-9-]/g, '-'),
          accountId: typeof body.accountId === 'string' && body.accountId.trim() ? body.accountId.trim() : 'signed-in-user',
          targetStores,
          categories,
          confidenceThreshold,
          notifyWhen: 'buy-now-or-wait-decision',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        recommendation: recommendation ? { ...recommendation, explanationTimeline } : null,
        explanationTimeline
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
    formAction: '/api/alerts/best-time',
    requiredInputs: ['productId', 'productName', 'currentPrice', 'currentStoreName', 'priceHistory', 'upcomingFlyerWindows', 'targetStores', 'categories', 'confidenceThreshold'],
    ruleInputs: ['accountId', 'targetStores', 'categories', 'confidenceThreshold'],
    confidenceThreshold: { min: 0.5, max: 0.99, default: 0.75 },
    notifyWhen: 'buy-now-or-wait-decision',
    decisionInputs: ['seasonality', 'historical volatility', 'current price vs historical average', 'upcoming flyer windows'],
    explanationTimeline: buildBestTimeAlertExplanationTimeline({
      productName: 'Best-time alert',
      categoryLabel: 'requested categories',
      flyerWindowLabel: 'Known upcoming flyer windows are evaluated when supplied.',
      observedRangeLabel: 'historical price range from provided priceHistory',
      seasonalityLabel: 'Requested categories are preserved so clients can show the seasonal context behind the alert.',
      volatilityScore: null
    })
  });
}
