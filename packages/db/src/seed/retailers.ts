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

export type SwedishGroceryChainSeed = {
  slug: string;
  name: string;
  retailerType: RetailerType;
  countryCode: 'SE';
  websiteUrl: string;
  logo: string;
  comparisonOrder: number;
  status: 'active' | 'legacy_acquired_by_coop';
  notes?: string;
};

export const majorSwedishGroceryChainSeeds = [
  {
    slug: 'ica',
    name: 'ICA',
    retailerType: 'grocery',
    countryCode: 'SE',
    websiteUrl: 'https://www.ica.se/',
    logo: '/retailers/ica.svg',
    comparisonOrder: 1,
    status: 'active'
  },
  {
    slug: 'coop',
    name: 'Coop',
    retailerType: 'grocery',
    countryCode: 'SE',
    websiteUrl: 'https://www.coop.se/',
    logo: '/retailers/coop.svg',
    comparisonOrder: 2,
    status: 'active'
  },
  {
    slug: 'willys',
    name: 'Willys',
    retailerType: 'grocery',
    countryCode: 'SE',
    websiteUrl: 'https://www.willys.se/',
    logo: '/retailers/willys.svg',
    comparisonOrder: 3,
    status: 'active'
  },
  {
    slug: 'hemkop',
    name: 'Hemköp',
    retailerType: 'grocery',
    countryCode: 'SE',
    websiteUrl: 'https://www.hemkop.se/',
    logo: '/retailers/hemkop.svg',
    comparisonOrder: 4,
    status: 'active'
  },
  {
    slug: 'lidl',
    name: 'Lidl',
    retailerType: 'grocery',
    countryCode: 'SE',
    websiteUrl: 'https://www.lidl.se/',
    logo: '/retailers/lidl.svg',
    comparisonOrder: 5,
    status: 'active'
  },
  {
    slug: 'netto',
    name: 'Netto',
    retailerType: 'grocery',
    countryCode: 'SE',
    websiteUrl: 'https://www.coop.se/',
    logo: '/retailers/netto.svg',
    comparisonOrder: 6,
    status: 'legacy_acquired_by_coop',
    notes: 'Netto Sweden store metadata is retained for historical comparisons after the Swedish chain was acquired by Coop.'
  }
] as const satisfies readonly SwedishGroceryChainSeed[];

export type MajorSwedishGroceryChainSlug = typeof majorSwedishGroceryChainSeeds[number]['slug'];

export const majorSwedishGroceryChainSeedSlugs = majorSwedishGroceryChainSeeds.map((chain) => chain.slug);

export const majorSwedishGroceryRetailerTypeCoverage = retailerTypes.map((retailerType) => {
  const chains = majorSwedishGroceryChainSeeds.filter((chain) => chain.retailerType === retailerType);
  return {
    retailerType,
    chainCount: chains.length,
    chainSlugs: chains.map((chain) => chain.slug)
  };
});
