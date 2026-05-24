import { NextResponse } from 'next/server';
import { calculateRollingThresholdTuning, type AlertThresholdPreference, type PriceHistoryPoint } from '@/lib/alert-engine';

export const dynamic = 'force-dynamic';

type StoredAlertPreference = AlertThresholdPreference & {
  createdAt: string;
  updatedAt: string;
};

const preferences = new Map<string, StoredAlertPreference>();

function keyFor(userEmail: string, productId: string) {
  return `${userEmail.trim().toLowerCase()}:${productId.trim()}`;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string' || !value.includes('@')) throw new Error('userEmail must be an email address.');
  return value.trim().toLowerCase();
}

function normalizeProductId(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('productId is required.');
  return value.trim();
}

function optionalNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return undefined;
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (typeof numberValue !== 'number' || !Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${field} must be a non-negative number.`);
  }
  return numberValue;
}

function normalizeHistory(value: unknown): PriceHistoryPoint[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('history must be an array.');
  return value.map((point) => {
    if (!point || typeof point !== 'object') throw new Error('history entries must be objects.');
    const candidate = point as Record<string, unknown>;
    const price = optionalNumber(candidate.price, 'history.price');
    if (price === undefined) throw new Error('history.price is required.');
    return { price, observedAt: typeof candidate.observedAt === 'string' ? candidate.observedAt : undefined };
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = normalizeEmail(searchParams.get('userEmail'));
    const productId = normalizeProductId(searchParams.get('productId'));
    return NextResponse.json({ preference: preferences.get(keyFor(userEmail, productId)) ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid alert preference request.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const userEmail = normalizeEmail(body.userEmail);
    const productId = normalizeProductId(body.productId);
    const now = new Date().toISOString();
    const existing = preferences.get(keyFor(userEmail, productId));
    const preference: StoredAlertPreference = {
      userEmail,
      productId,
      baseThresholdPercent: optionalNumber(body.baseThresholdPercent, 'baseThresholdPercent'),
      windowDays: optionalNumber(body.windowDays, 'windowDays'),
      minimumSamples: optionalNumber(body.minimumSamples, 'minimumSamples'),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    preferences.set(keyFor(userEmail, productId), preference);

    const tuning = calculateRollingThresholdTuning(normalizeHistory(body.history), preference);
    return NextResponse.json({ preference, tuning });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid alert preference request.' }, { status: 400 });
  }
}
