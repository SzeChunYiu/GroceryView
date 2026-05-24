export const retailerTypes = [
  'grocery',
  'pharmacy',
  'fuel',
  'convenience',
  'variety',
  'cosmetics',
  'household',
  'online_marketplace'
] as const;

export type RetailerType = typeof retailerTypes[number];

export type ChainCatalogEntry = {
  id: string;
  name: string;
  slug: string;
  retailer_type: RetailerType;
};
