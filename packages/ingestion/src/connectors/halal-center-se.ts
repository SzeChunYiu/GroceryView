export type HalalCenterSeRetailerType = 'kosher_halal';

export type HalalCenterSeStore = {
  store_id: string;
  name: string;
  city: string;
  source_url: string;
};

export type HalalCenterSeRawRow = {
  product_id: string;
  product_name: string;
  category: string;
  price: number;
  source_url: string;
  store_id?: string;
};

export type HalalCenterSeRow = HalalCenterSeRawRow & {
  country: 'SE';
  currency: 'SEK';
  chain: 'halal-center';
  retailer_type: HalalCenterSeRetailerType;
};

export const HALAL_CENTER_SE_MINIMUM_STORE_COUNT = 3;
export const HALAL_CENTER_SE_CATEGORY_WHITELIST = [
  'halal_meat',
  'halal_poultry',
  'halal_frozen',
  'rice',
  'legumes',
  'spices',
  'sauces',
  'snacks'
] as const;

export type HalalCenterSeCategory = (typeof HALAL_CENTER_SE_CATEGORY_WHITELIST)[number];

export function isHalalCenterSeCategory(category: string): category is HalalCenterSeCategory {
  return HALAL_CENTER_SE_CATEGORY_WHITELIST.includes(category as HalalCenterSeCategory);
}

export function verifyHalalCenterSeCoverage(stores: HalalCenterSeStore[], hasNationalOnlinePresence = false): boolean {
  return hasNationalOnlinePresence || stores.length >= HALAL_CENTER_SE_MINIMUM_STORE_COUNT;
}

export function normalizeHalalCenterSeRows(input: {
  rows: HalalCenterSeRawRow[];
  stores: HalalCenterSeStore[];
  hasNationalOnlinePresence?: boolean;
}): HalalCenterSeRow[] {
  if (!verifyHalalCenterSeCoverage(input.stores, input.hasNationalOnlinePresence)) {
    throw new Error('Halal Center SE requires at least three verified stores or national online presence before emitting rows.');
  }

  return input.rows
    .filter((row) => isHalalCenterSeCategory(row.category))
    .map((row) => ({
      ...row,
      country: 'SE',
      currency: 'SEK',
      chain: 'halal-center',
      retailer_type: 'kosher_halal'
    }));
}
