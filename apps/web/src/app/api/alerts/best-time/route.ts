import { NextResponse } from 'next/server';

type BestTimeAlertPayload = {
  categories?: unknown;
  confidenceThreshold?: unknown;
  targetStores?: unknown;
};

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()) : [];
}

function parseConfidenceThreshold(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0.75);
  return Number.isFinite(numeric) ? Math.min(0.99, Math.max(0.5, numeric)) : 0.75;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as BestTimeAlertPayload;
  const targetStores = stringList(body.targetStores);
  const categories = stringList(body.categories);
  const confidenceThreshold = parseConfidenceThreshold(body.confidenceThreshold);

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
        notifyWhen: 'price-drop-window-detected',
        status: 'active'
      }
    },
    { status: 201 }
  );
}

export function GET() {
  return NextResponse.json({
    requiredInputs: ['targetStores', 'categories', 'confidenceThreshold'],
    confidenceThreshold: { min: 0.5, max: 0.99, default: 0.75 },
    notifyWhen: 'price-drop-window-detected'
  });
}
