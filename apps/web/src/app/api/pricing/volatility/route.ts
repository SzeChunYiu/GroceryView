import { NextResponse } from 'next/server';

const volatilityRows = [
  { productSlug: 'kaffe-mellanrost', productName: 'Kaffe mellanrost', volatilityPct: 12, windowLabel: '30d' },
  { productSlug: 'havregryn-extra-fylliga', productName: 'Havregryn extra fylliga', volatilityPct: 6, windowLabel: '30d' },
  { productSlug: 'bananer-klass-1', productName: 'Bananer klass 1', volatilityPct: 9, windowLabel: '30d' }
];

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
