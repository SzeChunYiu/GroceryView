type SearchRouteParams = {
  q?: string;
  category?: string;
  chain?: string;
  type?: string;
  region?: string;
};

type MapRouteParams = {
  layer?: string;
  region?: string;
  category?: string;
  chain?: string;
};

type DealsRouteParams = {
  tab?: string;
  dealLevel?: string;
  category?: string;
  chain?: string;
};

function encodeParams(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/** Primary product entity route (v3 connected UX). */
export function productRoute(productId: string) {
  return `/product/${encodeURIComponent(productId)}`;
}

export const productHref = productRoute;

export function productSlugHref(productSlug: string) {
  return `/products/${encodeURIComponent(productSlug)}`;
}

/** Store pages use stable OSM slugs when chain/store IDs are not split. */
export function storeRoute(chainSlug: string, storeSlug: string) {
  void chainSlug;
  return `/stores/${encodeURIComponent(storeSlug)}`;
}

export function storeSlugHref(storeSlug: string) {
  return `/stores/${encodeURIComponent(storeSlug)}`;
}

export function categoryMarketHref(categorySlug: string) {
  return `/market/${encodeURIComponent(categorySlug)}`;
}

export const marketCategoryRoute = categoryMarketHref;
export const browseCategoryRoute = categoryBrowseHref;

export function categoryBrowseHref(categorySlug: string) {
  return `/browse/${encodeURIComponent(categorySlug)}`;
}

export function categorySearchHref(categorySlug: string) {
  return `/search?category=${encodeURIComponent(categorySlug)}`;
}

export function chainCategorySearchHref(chain: string, categorySlug: string) {
  return `/search?chain=${encodeURIComponent(chain)}&category=${encodeURIComponent(categorySlug)}`;
}

export function searchRoute(params: SearchRouteParams = {}) {
  return `/search${encodeParams(params)}`;
}

export function mapRoute(params: MapRouteParams = {}) {
  return `/map${encodeParams(params)}`;
}

export function dealsRoute(params: DealsRouteParams = {}) {
  return `/deals${encodeParams(params as Record<string, string | undefined>)}`;
}

export function methodologyDealScoreHref() {
  return '/methodology#deal-score';
}

export function methodologyIndexHref() {
  return '/methodology#price-index';
}
