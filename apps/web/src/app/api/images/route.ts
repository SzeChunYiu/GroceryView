import { NextResponse } from 'next/server';
import { productImageCdnRoute } from '@/lib/imageCdn';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const cacheControl = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';
const cdnCacheControl = 'public, max-age=604800, stale-while-revalidate=86400';

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function boundedQueryInteger(value: string | null, min: number, max: number) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(min, Math.min(max, parsed));
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (['localhost', '0.0.0.0', '127.0.0.1', '::1'].includes(normalized)) return true;
  if (normalized.endsWith('.local') || normalized.endsWith('.localhost')) return true;
  if (/^10\./.test(normalized)) return true;
  if (/^127\./.test(normalized)) return true;
  if (/^169\.254\./.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (/^192\.168\./.test(normalized)) return true;
  return false;
}

function parseSourceUrl(request: Request) {
  const requestUrl = new URL(request.url);
  const rawSource = requestUrl.searchParams.get('src') ?? requestUrl.searchParams.get('url');
  if (!rawSource) return { error: 'missing_image_src' } as const;

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(rawSource);
  } catch {
    return { error: 'invalid_image_src' } as const;
  }

  if (sourceUrl.protocol !== 'https:' && sourceUrl.protocol !== 'http:') return { error: 'unsupported_image_protocol' } as const;
  if (isBlockedHostname(sourceUrl.hostname)) return { error: 'blocked_image_host' } as const;
  if (sourceUrl.pathname.startsWith(productImageCdnRoute)) return { error: 'recursive_image_proxy' } as const;

  return {
    sourceUrl,
    width: boundedQueryInteger(requestUrl.searchParams.get('w'), 32, 1280),
    quality: boundedQueryInteger(requestUrl.searchParams.get('q'), 35, 95)
  } as const;
}

function proxiedHeaders(upstream: Response, width: number | null, quality: number | null) {
  const headers = new Headers();
  headers.set('cache-control', cacheControl);
  headers.set('cdn-cache-control', cdnCacheControl);
  headers.set('content-type', upstream.headers.get('content-type') ?? 'image/jpeg');
  headers.set('vary', 'accept');
  headers.set('x-groceryview-image-proxy', 'edge');
  if (width) headers.set('x-groceryview-image-width', String(width));
  if (quality) headers.set('x-groceryview-image-quality', String(quality));
  const etag = upstream.headers.get('etag');
  const lastModified = upstream.headers.get('last-modified');
  if (etag) headers.set('etag', etag);
  if (lastModified) headers.set('last-modified', lastModified);
  return headers;
}

export async function GET(request: Request) {
  const parsed = parseSourceUrl(request);
  if ('error' in parsed) return errorResponse(parsed.error ?? 'invalid_image_src', 400);

  const upstream = await fetch(parsed.sourceUrl, {
    headers: {
      accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      'user-agent': 'GroceryView image CDN proxy'
    },
    redirect: 'follow'
  });

  if (!upstream.ok) return errorResponse('image_upstream_unavailable', upstream.status >= 400 && upstream.status < 500 ? 404 : 502);

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/')) return errorResponse('image_upstream_not_image', 502);

  return new Response(upstream.body, {
    headers: proxiedHeaders(upstream, parsed.width, parsed.quality),
    status: 200
  });
}
