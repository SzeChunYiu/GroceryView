import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const webRoot = resolve(new URL('..', import.meta.url).pathname);
const cachePolicy = readFileSync(resolve(webRoot, 'src/lib/cache-policy.ts'), 'utf8');
const middleware = readFileSync(resolve(webRoot, 'src/middleware.ts'), 'utf8');
const myFlyerRoute = readFileSync(resolve(webRoot, 'src/app/api/my-flyer/route.ts'), 'utf8');
const productApiRoute = readFileSync(resolve(webRoot, 'src/app/api/products/route.ts'), 'utf8');
const searchApiRoute = readFileSync(resolve(webRoot, 'src/app/api/search/route.ts'), 'utf8');
const indexApiRoute = readFileSync(resolve(webRoot, 'src/app/api/index/route.ts'), 'utf8');

describe('edge cache policy headers', () => {
  it('defines public stale-while-revalidate policies for catalogue, API reads, images, and source metadata', () => {
    assert.match(cachePolicy, /publicMarketPageCacheControl = publicCatalogueCacheControl/);
    assert.match(cachePolicy, /publicProductPageCacheControl = publicCatalogueCacheControl/);
    assert.match(cachePolicy, /publicApiReadCacheControl = 'public, s-maxage=120, stale-while-revalidate=300'/);
    assert.match(cachePolicy, /publicImageCacheControl = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800, immutable'/);
    assert.match(cachePolicy, /sourceMetadataCacheControl = 'public, s-maxage=600, stale-while-revalidate=1800'/);
  });

  it('applies edge CDN headers through middleware route classification', () => {
    assert.match(middleware, /edgeCachePolicyForPath\(request\.nextUrl\.pathname\)/);
    assert.match(middleware, /cacheResponseHeaders\(cachePolicy\)/);
    assert.match(cachePolicy, /'CDN-Cache-Control': policy\.cacheControl/);
    assert.match(cachePolicy, /'Vercel-CDN-Cache-Control': policy\.cacheControl/);
    assert.match(cachePolicy, /'\/_next\/image'/);
    assert.match(cachePolicy, /'\/data-sources'/);
  });

  it('sets public API read cache headers on successful read responses', () => {
    for (const route of [productApiRoute, searchApiRoute, indexApiRoute]) {
      assert.match(route, /publicApiReadCacheControl/);
      assert.match(route, /headers: publicApiReadHeaders/);
    }
  });

  it('keeps account and user-specific routes out of edge caches', () => {
    assert.match(cachePolicy, /privateAccountCacheControl = 'private, no-store'/);
    for (const privateRoute of ['/account', '/settings', '/api/alerts', '/api/my-flyer', '/api/saved-searches', '/api/notifications']) {
      assert.match(cachePolicy, new RegExp(`'${privateRoute.replaceAll('/', '\\/')}'`));
    }
    assert.match(myFlyerRoute, /'Cache-Control': privateAccountCacheControl/);
  });
});
