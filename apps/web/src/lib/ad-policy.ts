import type { AdSlotId } from './ad-slots';

export const AD_FREE_ROUTE_PREFIXES = [
  '/admin',
  '/account',
  '/privacy',
  '/auth',
  '/notifications',
  '/pharmacy/prescription'
] as const;

const SENSITIVE_ROUTE_PREFIXES = ['/pharmacy/prescription', '/pharmacy/rx'] as const;

/** Routes where ads must not render (lock pack 13). */
export function isAdFreeRoute(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return AD_FREE_ROUTE_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function isSensitiveMedicalRoute(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return SENSITIVE_ROUTE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/** Search: no ad before the first 12 organic results. */
export function searchAdAllowedAfterIndex(resultIndex: number): boolean {
  return resultIndex >= 12;
}

/** Ads must not nest inside cards, tables, charts, or map canvases. */
export function adPlacementSurfaceAllowed(surface: 'page_rail' | 'page_footer' | 'in_feed' | 'nested'): boolean {
  return surface !== 'nested';
}

export function slotAllowedOnRoute(slotId: AdSlotId, pathname: string): boolean {
  if (isAdFreeRoute(pathname) || isSensitiveMedicalRoute(pathname)) return false;
  if (pathname.startsWith('/search') && slotId !== 'search_after_results_12') return false;
  return true;
}
