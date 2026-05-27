export const imagesRoutes = {
  controllerPath: 'api/images',
  description: 'Edge-cacheable product image CDN proxy. Fetches verified product image URLs server-side, keeps product pages off retailer hotlinks, and keys cache variants by requested width and quality.',
  sourceQueryParam: 'src',
  legacySourceQueryParam: 'url',
  widthQueryParam: 'w',
  qualityQueryParam: 'q',
  defaultQuality: 78,
  maxWidth: 1280,
  cacheHeader: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  cdnCacheHeader: 'public, max-age=604800, stale-while-revalidate=86400',
  responseHeaders: ['cache-control', 'cdn-cache-control', 'content-type', 'vary', 'x-groceryview-image-proxy'],
  guardrails: [
    'Only http and https upstream image URLs are proxied.',
    'Loopback, private-network, and local hostnames are rejected before fetch.',
    'Non-image upstream responses are not streamed to shoppers.'
  ]
} as const;
