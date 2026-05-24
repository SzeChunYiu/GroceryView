import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { basketCostHeatmap } from '@/lib/map-basket-cost-heatmap';

export const runtime = 'nodejs';

const cacheControlHeader = 'public, s-maxage=300, stale-while-revalidate=60';

type HeatmapPayload = typeof basketCostHeatmap & {
  generatedFrom: 'weekly-basket-optimizer-input';
};

function buildPayload(): HeatmapPayload {
  return {
    ...basketCostHeatmap,
    generatedFrom: 'weekly-basket-optimizer-input'
  };
}

function etagForBody(body: string) {
  return `"${createHash('sha256').update(body).digest('base64url')}"`;
}

function requestHasMatchingEtag(ifNoneMatch: string | null, etag: string) {
  if (!ifNoneMatch) return false;

  return ifNoneMatch
    .split(',')
    .map((value) => value.trim())
    .some((value) => value === etag || value === `W/${etag}`);
}

function responseHeaders(etag: string) {
  return {
    'Cache-Control': cacheControlHeader,
    ETag: etag
  };
}

export async function GET(request: Request) {
  const body = JSON.stringify(buildPayload());
  const etag = etagForBody(body);
  const headers = responseHeaders(etag);

  if (requestHasMatchingEtag(request.headers.get('if-none-match'), etag)) {
    return new NextResponse(null, { status: 304, headers });
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
