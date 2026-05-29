export type RouteSearchParams = Readonly<Record<string, string | string[] | undefined>>;

export type RouteRobotsPolicy = {
  index: boolean;
  follow: boolean;
  reason: string;
};

const privatePrefixes = ['/admin', '/account', '/settings', '/api'];
const privateExact = new Set(['/login', '/watchlist']);
const selectedMapParamToRoute: Record<string, string> = {
  store: '/stores',
  station: '/fuel/stations',
  pharmacy: '/pharmacy'
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanSegment(value: string | undefined) {
  return value?.trim().replace(/^\/+|\/+$/g, '');
}

export function hasSearchParams(searchParams: RouteSearchParams | undefined) {
  return Object.values(searchParams ?? {}).some((value) => Array.isArray(value) ? value.some((entry) => entry.trim().length > 0) : typeof value === 'string' && value.trim().length > 0);
}

export function canonicalForRoute(pathname: string, searchParams?: RouteSearchParams) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path.startsWith('/products/') || path.startsWith('/stores/') || path.startsWith('/browse/') || path.startsWith('/market/') || path.startsWith('/fuel/stations/') || path.startsWith('/pharmacy/')) return path;
  if (path === '/search' || path === '/deals') return path;
  if (path === '/map') {
    const store = cleanSegment(first(searchParams?.store));
    if (store) return `${selectedMapParamToRoute.store}/${encodeURIComponent(store)}`;
    const station = cleanSegment(first(searchParams?.station));
    if (station || first(searchParams?.domain) === 'fuel') return station ? `${selectedMapParamToRoute.station}/${encodeURIComponent(station)}` : '/fuel/stations';
    const pharmacy = cleanSegment(first(searchParams?.pharmacy));
    if (pharmacy || first(searchParams?.domain) === 'pharmacy') return pharmacy ? `${selectedMapParamToRoute.pharmacy}/${encodeURIComponent(pharmacy)}` : '/pharmacy';
    return '/map';
  }
  return path;
}

export function robotsForRoute(pathname: string, searchParams?: RouteSearchParams): RouteRobotsPolicy {
  const path = pathname.replace(/\/$/, '') || '/';
  if (privatePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) || privateExact.has(path)) return { index: false, follow: false, reason: 'private or backstage route' };
  if (path === '/search') {
    const query = first(searchParams?.q)?.trim();
    const selectedFilters = ['sort', 'chain', 'region', 'category', 'domain', 'ean'].filter((key) => first(searchParams?.[key])?.trim()).length;
    if (first(searchParams?.empty) === '1') return { index: false, follow: true, reason: 'empty search result state' };
    if (query || selectedFilters > 0) return { index: false, follow: true, reason: 'query or faceted search state canonicalizes to /search' };
  }
  if (path === '/map' && hasSearchParams(searchParams)) return { index: false, follow: true, reason: 'selected map marker or layer state canonicalizes to a stable route' };
  if (path === '/deals' && hasSearchParams(searchParams)) return { index: false, follow: true, reason: 'deal filters canonicalize to /deals' };
  return { index: true, follow: true, reason: 'public canonical route' };
}
