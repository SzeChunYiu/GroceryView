import { NextResponse } from 'next/server';
import { runVolatilityPredictionJob, volatilityPredictionMethodology } from '@/lib/price-intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

function numberParam(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category')?.trim() || undefined;
  const limit = numberParam(searchParams.get('limit'));
  const minObservations = numberParam(searchParams.get('minObservations'));
  const predictions = runVolatilityPredictionJob({ category, limit, minObservations });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    itemCount: predictions.length,
    methodology: volatilityPredictionMethodology,
    predictions,
    source: 'generated.openprices-products.observations'
  });
}
