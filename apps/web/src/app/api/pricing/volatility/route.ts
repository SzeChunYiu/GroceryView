import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  describeVolatilityInputWindow,
  normalizedVolatilityOptions,
  runVolatilityPredictionJob,
  volatilityPredictionMethodology
} from '@/lib/price-intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const CACHE_MAX_AGE_SECONDS = 300;
const CACHE_STALE_WHILE_REVALIDATE_SECONDS = 3600;

function numberParam(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function etagForPayload(payload: unknown) {
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
  return `W/"volatility-${digest}"`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const options = normalizedVolatilityOptions({
    category: searchParams.get('category')?.trim() || undefined,
    limit: numberParam(searchParams.get('limit')),
    minObservations: numberParam(searchParams.get('minObservations'))
  });
  const predictions = runVolatilityPredictionJob(options);
  const inputWindow = describeVolatilityInputWindow(predictions, options.minObservations);
  const generatedAt = inputWindow.latestObservedAt ? `${inputWindow.latestObservedAt}T00:00:00.000Z` : new Date(0).toISOString();
  const etag = etagForPayload({ inputWindow, options, predictions });
  const cacheControl = `public, max-age=${CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${CACHE_STALE_WHILE_REVALIDATE_SECONDS}`;

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'Cache-Control': cacheControl,
        ETag: etag
      }
    });
  }

  return NextResponse.json({
    cache: {
      etag,
      maxAgeSeconds: CACHE_MAX_AGE_SECONDS,
      staleWhileRevalidateSeconds: CACHE_STALE_WHILE_REVALIDATE_SECONDS
    },
    generatedAt,
    inputWindow,
    itemCount: predictions.length,
    methodology: volatilityPredictionMethodology,
    predictions,
    request: options,
    source: 'generated.openprices-products.observations'
  }, {
    headers: {
      'Cache-Control': cacheControl,
      ETag: etag
    }
  });
}
