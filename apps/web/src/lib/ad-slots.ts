/** Named ad placements for public pages (lock pack 13). */
export const AD_SLOT_IDS = [
  'home_after_hero',
  'home_in_feed',
  'search_after_results_12',
  'market_right_rail',
  'market_bottom',
  'browse_after_categories',
  'category_browse_bottom',
  'product_bottom',
  'store_bottom',
  'deals_bottom',
  'map_bottom',
  'pharmacy_bottom',
  'fuel_bottom'
] as const;

export type AdSlotId = (typeof AD_SLOT_IDS)[number];

export const AD_SLOT_MIN_HEIGHT_PX = 120;

export function adSlotLabel(): string {
  return 'Advertisement';
}
