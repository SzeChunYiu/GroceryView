import { isKosherHalalOverlapCategory, type KosherHalalOverlapCategory } from '../overlapCategories.js';

export type HalalCenterSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'halal-center';
  retailer_type: 'kosher_halal';
  category: KosherHalalOverlapCategory;
  product_name: string;
  price: number;
  source_url: string;
};

export type HalalCenterSeVerification = {
  chain: 'halal-center';
  country: 'SE';
  verifiedStoreCount: number;
  hasNationalOnlinePresence: boolean;
  canEmitRows: boolean;
  sourceUrls: string[];
  reason: string;
};

export const HALAL_CENTER_SE_VERIFICATION: HalalCenterSeVerification = {
  chain: 'halal-center',
  country: 'SE',
  verifiedStoreCount: 0,
  hasNationalOnlinePresence: false,
  canEmitRows: false,
  sourceUrls: [],
  reason: 'No primary source verified at least three Halal Center SE stores or a national online shop; connector must not invent kosher_halal rows.'
};

export function normalizeHalalCenterSeRows(rows: Array<Omit<HalalCenterSeRow, 'country' | 'currency' | 'chain' | 'retailer_type'>>): HalalCenterSeRow[] {
  if (!HALAL_CENTER_SE_VERIFICATION.canEmitRows) return [];
  return rows
    .filter((row) => isKosherHalalOverlapCategory(row.category))
    .map((row) => ({ country: 'SE', currency: 'SEK', chain: 'halal-center', retailer_type: 'kosher_halal', ...row }));
}
