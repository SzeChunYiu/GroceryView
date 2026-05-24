import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CommunityPriceReviewPayload = {
  productSlug?: unknown;
  productName?: unknown;
  storeName?: unknown;
  observedPrice?: unknown;
  confidenceScore?: unknown;
  observedAt?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CommunityPriceReviewPayload;
  const productSlug = cleanText(body.productSlug);
  const productName = cleanText(body.productName);
  const storeName = cleanText(body.storeName);
  const observedAt = cleanText(body.observedAt);
  const observedPrice = Number(body.observedPrice);
  const confidenceScore = Number(body.confidenceScore);

  if (!productSlug || !storeName || !Number.isFinite(observedPrice) || observedPrice <= 0) {
    return NextResponse.json({ error: 'invalid_price_review' }, { status: 400 });
  }

  if (!Number.isInteger(confidenceScore) || confidenceScore < 1 || confidenceScore > 5) {
    return NextResponse.json({ error: 'invalid_confidence_score' }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(observedAt)) {
    return NextResponse.json({ error: 'invalid_observed_at' }, { status: 400 });
  }

  return NextResponse.json({
    review: {
      id: crypto.randomUUID(),
      status: 'queued_for_human_review',
      productSlug,
      productName,
      storeName,
      observedPrice,
      confidenceScore,
      observedAt,
      submittedAt: new Date().toISOString()
    }
  }, { status: 202 });
}
