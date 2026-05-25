import { NextResponse } from 'next/server';
import {
  clampPublicApiLimit,
  isAcceptedPublicApiKey,
  isPublicApiResource,
  publicApiCatalog,
  publicApiDisclaimers,
  publicApiRateLimit,
  publicApiRows,
  publicApiVersion
} from '@/lib/public-api';

export const runtime = 'nodejs';

function rateLimitHeaders() {
  return {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    'X-RateLimit-Limit': String(publicApiRateLimit.limit),
    'X-RateLimit-Policy': publicApiRateLimit.policy,
    'X-RateLimit-Window': publicApiRateLimit.window
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-groceryview-api-key') ?? url.searchParams.get('key');

  if (!isAcceptedPublicApiKey(apiKey)) {
    return NextResponse.json(
      {
        error: 'public_api_key_required',
        message: 'Create a key with POST /api/public/keys or use gv_public_demo for local smoke tests.',
        docs: '/developers/api',
        rateLimit: publicApiRateLimit,
        terms: publicApiDisclaimers
      },
      { status: 401, headers: rateLimitHeaders() }
    );
  }

  const resource = url.searchParams.get('resource') ?? 'products';
  if (!isPublicApiResource(resource)) {
    return NextResponse.json(
      { error: 'unsupported_public_api_resource', resources: publicApiCatalog() },
      { status: 400, headers: rateLimitHeaders() }
    );
  }

  const limit = clampPublicApiLimit(url.searchParams.get('limit'));
  const data = publicApiRows(resource, limit);

  return NextResponse.json(
    {
      version: publicApiVersion,
      resource,
      count: data.length,
      data,
      resources: publicApiCatalog(),
      rateLimit: publicApiRateLimit,
      terms: publicApiDisclaimers
    },
    { headers: rateLimitHeaders() }
  );
}
