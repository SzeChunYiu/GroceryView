import { NextResponse } from 'next/server';
import { classifyPriceVolatilityBadge } from '@/lib/price-intelligence';

const volatilityRows = [
  {
    productSlug: 'kaffe-mellanrost',
    productName: 'Kaffe mellanrost',
    windowLabel: '30d',
    observations: [
      { observedAt: '2026-05-01T00:00:00.000Z', price: 54.9 },
      { observedAt: '2026-05-15T00:00:00.000Z', price: 57.9 },
      { observedAt: '2026-05-24T00:00:00.000Z', price: 62.9 }
    ]
  },
  {
    productSlug: 'havregryn-extra-fylliga',
    productName: 'Havregryn extra fylliga',
    windowLabel: '30d',
    observations: [
      { observedAt: '2026-05-01T00:00:00.000Z', price: 18.9 },
      { observedAt: '2026-05-15T00:00:00.000Z', price: 18.5 },
      { observedAt: '2026-05-24T00:00:00.000Z', price: 18.9 }
    ]
  },
  {
    productSlug: 'bananer-klass-1',
    productName: 'Bananer klass 1',
    windowLabel: '30d',
    observations: [
      { observedAt: '2026-05-01T00:00:00.000Z', price: 28.9 },
      { observedAt: '2026-05-10T00:00:00.000Z', price: 19.9 },
      { observedAt: '2026-05-24T00:00:00.000Z', price: 26.9 }
    ]
  }
].map((row) => {
  const badge = classifyPriceVolatilityBadge(row.observations);
  return {
    productSlug: row.productSlug,
    productName: row.productName,
    volatilityPct: badge.volatilityPercent,
    windowLabel: row.windowLabel,
    badgeKind: badge.kind,
    badgeLabel: badge.label,
    badgeDescription: badge.description,
    observationCount: badge.observationCount
  };
});

const volatilityEtag = '"pricing-volatility-30d-v1"';
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
