export type EdgeCacheSurface =
  | 'public-market-page'
  | 'public-product-page'
  | 'public-api-read'
  | 'public-image'
  | 'source-metadata'
  | 'private-account';

export type EdgeCachePolicy = {
  surface: EdgeCacheSurface;
  cacheControl: string;
  revalidateSeconds?: number;
};

export const publicCatalogueRevalidateSeconds = 300;
export const publicCatalogueStaleWhileRevalidateSeconds = publicCatalogueRevalidateSeconds * 3;
export const publicCatalogueCacheControl = `public, s-maxage=${publicCatalogueRevalidateSeconds}, stale-while-revalidate=${publicCatalogueStaleWhileRevalidateSeconds}`;

export const publicMarketPageCacheControl = publicCatalogueCacheControl;
export const publicProductPageCacheControl = publicCatalogueCacheControl;
export const publicApiReadCacheControl = 'public, s-maxage=120, stale-while-revalidate=300';
export const publicImageCacheControl = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800, immutable';
export const sourceMetadataCacheControl = 'public, s-maxage=600, stale-while-revalidate=1800';
export const privateAccountCacheControl = 'private, no-store';
export const noStoreCacheControl = 'no-store';

const localePrefixPattern = /^\/(?:sv|en|ar|so)(?=\/|$)/;

const publicMarketPagePaths = new Set([
  '/',
  '/basket-ideas',
  '/basket',
  '/billigaste',
  '/catalogue-savings',
  '/categories',
  '/chain-coverage',
  '/chain-index',
  '/compare',
  '/compare-items',
  '/coverage',
  '/deals',
  '/expiry-deals',
  '/fuel',
  '/heatmap',
  '/index',
  '/map',
  '/meal-cost',
  '/new-arrivals',
  '/nutrition-value',
  '/openprices-depth',
  '/pharmacy',
  '/pricing',
  '/prisjamforelse',
  '/products',
  '/search',
  '/seasonal-calendar',
  '/stores',
  '/store-coverage',
  '/trending',
  '/weekly-basket',
  '/widgets/grocery-index-ticker'
]);

const publicProductPagePrefixes = ['/items/', '/product/', '/products/'];
const sourceMetadataPaths = new Set(['/data-sources', '/developers/api', '/index-methodology', '/methodology-changelog']);

const privateAccountPrefixes = [
  '/account',
  '/admin',
  '/alerts',
  '/analytics',
  '/favorites',
  '/favourites',
  '/household',
  '/login',
  '/my-flyer',
  '/pantry-inventory',
  '/pantry-planner',
  '/savings-dashboard',
  '/scanner',
  '/settings',
  '/shopping-trips',
  '/unit-price-alerts',
  '/watchlist',
  '/api/account',
  '/api/alerts',
  '/api/corrections',
  '/api/digest',
  '/api/errors',
  '/api/export',
  '/api/my-flyer',
  '/api/notification-alert-rules',
  '/api/notifications',
  '/api/saved-searches',
  '/api/webhooks'
];

const publicImageExtensionPattern = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i;

export function cacheResponseHeaders(policy: EdgeCachePolicy) {
  return {
    'Cache-Control': policy.cacheControl,
    'CDN-Cache-Control': policy.cacheControl,
    'Vercel-CDN-Cache-Control': policy.cacheControl,
    'x-groceryview-cache-control': policy.cacheControl,
    'x-groceryview-edge-cache-control': policy.cacheControl,
    'x-groceryview-cache-surface': policy.surface,
    ...(policy.revalidateSeconds ? { 'x-groceryview-revalidate-seconds': String(policy.revalidateSeconds) } : {})
  };
}

export function normalizedCachePath(pathname: string) {
  const path = pathname.replace(/\/$/, '') || '/';
  return path.replace(localePrefixPattern, '') || '/';
}

function pathStartsWith(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function edgeCachePolicyForPath(pathname: string): EdgeCachePolicy | null {
  const path = normalizedCachePath(pathname);

  if (privateAccountPrefixes.some((prefix) => pathStartsWith(path, prefix))) {
    return {
      surface: 'private-account',
      cacheControl: privateAccountCacheControl
    };
  }

  if (path === '/_next/image' || publicImageExtensionPattern.test(path)) {
    return {
      surface: 'public-image',
      cacheControl: publicImageCacheControl
    };
  }

  if (sourceMetadataPaths.has(path)) {
    return {
      surface: 'source-metadata',
      cacheControl: sourceMetadataCacheControl,
      revalidateSeconds: 600
    };
  }

  if (publicProductPagePrefixes.some((prefix) => path.startsWith(prefix))) {
    return {
      surface: 'public-product-page',
      cacheControl: publicProductPageCacheControl,
      revalidateSeconds: publicCatalogueRevalidateSeconds
    };
  }

  if (publicMarketPagePaths.has(path) || [...publicMarketPagePaths].some((prefix) => prefix !== '/' && pathStartsWith(path, prefix))) {
    return {
      surface: 'public-market-page',
      cacheControl: publicMarketPageCacheControl,
      revalidateSeconds: publicCatalogueRevalidateSeconds
    };
  }

  return null;
}
