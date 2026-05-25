import { NextResponse } from 'next/server';

import { priceTrendPredictionConfidence } from '@/lib/price-intelligence';

const volatilityRows = [
  { productSlug: 'kaffe-mellanrost', productName: 'Kaffe mellanrost', volatilityPct: 12, trendSlopePct: -4.4, observationCount: 18, latestObservedAt: '2026-05-23', windowLabel: '30d' },
  { productSlug: 'havregryn-extra-fylliga', productName: 'Havregryn extra fylliga', volatilityPct: 6, trendSlopePct: 1.1, observationCount: 14, latestObservedAt: '2026-05-22', windowLabel: '30d' },
  { productSlug: 'bananer-klass-1', productName: 'Bananer klass 1', volatilityPct: 9, trendSlopePct: 3.2, observationCount: 11, latestObservedAt: '2026-05-21', windowLabel: '30d' }
].map((row) => ({
  ...row,
  predictionConfidence: priceTrendPredictionConfidence({
    trendSlopePercent: row.trendSlopePct,
    volatilityPercent: row.volatilityPct,
    observationCount: row.observationCount,
    latestObservedAt: row.latestObservedAt,
    referenceDate: new Date('2026-05-24T00:00:00.000Z')
  })
}));

const volatilityEtag = '"pricing-volatility-30d-v2"';
const cacheControl = 'public, max-age=300, stale-while-revalidate=600';

function responseHeaders() {
  return {
    'Cache-Control': cacheControl,
    ETag: volatilityEtag
  };
}

export function GET(request: Request) {
  if (request.headers.get('if-none-match') === volatilityEtag) {
    return new Response(null, { status: 304, headers: responseHeaders() });
  }

  return NextResponse.json(
    {
      generatedAt: '2026-05-24T00:00:00.000Z',
      rows: volatilityRows
    },
    { headers: responseHeaders() }
  );
}
