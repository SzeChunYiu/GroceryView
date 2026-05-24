import { createHash } from 'node:crypto';
import { createGroceryViewApi } from '@groceryview/api';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const cacheControlHeader = 'public, s-maxage=300, stale-while-revalidate=60';
const defaultIndexId = 'stockholm-grocery-index';

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
  const { searchParams } = new URL(request.url);
  const indexId = searchParams.get('id')?.trim() || defaultIndexId;
  const index = createGroceryViewApi().getIndex(indexId);

  if (!index) {
    return NextResponse.json({ error: 'index_not_found', indexId }, { status: 404 });
  }

  const body = JSON.stringify({ index });
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
