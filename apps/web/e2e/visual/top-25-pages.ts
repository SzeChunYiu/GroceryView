export const top25Pages = [
  '/',
  '/products',
  '/search',
  '/deals',
  '/categories',
  '/stores',
  '/basket',
  '/list',
  '/compare',
  '/favorites',
  '/watchlist',
  '/alerts',
  '/weekly-basket',
  '/shopping-trips',
  '/savings-dashboard',
  '/coupon-stacks',
  '/meal-planner',
  '/pantry-planner',
  '/nutrition-value',
  '/scanner',
  '/pharmacy',
  '/chain-index',
  '/store-coverage',
  '/account',
  '/privacy'
] as const;

export const visualViewports = [
  { name: 'desktop', width: 1440, height: 1200 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

export function snapshotName(pathname: string, viewport: string) {
  const slug = pathname === '/' ? 'home' : pathname.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
  return `${slug}-${viewport}.png`;
}
