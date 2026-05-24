const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=900';

const volatilitySnapshot = {
  generatedAt: '2026-05-24T00:00:00.000Z',
  windowDays: 30,
  products: [
    { productId: 'coffee', label: 'Coffee', volatilityPct: 8.4 },
    { productId: 'oats', label: 'Oats', volatilityPct: 3.1 },
    { productId: 'milk', label: 'Milk', volatilityPct: 1.7 }
  ]
};

const BODY = JSON.stringify(volatilitySnapshot);
const ETAG = `"pricing-volatility-v1-${BODY.length}"`;

function responseHeaders() {
  return {
    'Cache-Control': CACHE_CONTROL,
    ETag: ETAG
  };
}

function hasMatchingEtag(request: Request) {
  return request.headers
    .get('if-none-match')
    ?.split(',')
    .map((value) => value.trim())
    .includes(ETAG) ?? false;
}

export async function GET(request: Request) {
  if (hasMatchingEtag(request)) {
    return new Response(null, {
      status: 304,
      headers: responseHeaders()
    });
  }

  return new Response(BODY, {
    status: 200,
    headers: {
      ...responseHeaders(),
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
