export type RetailerScraperMetadata = Readonly<{
  countryCode: 'SE';
  currency: 'SEK';
  id: string;
  name: string;
  priceSnapshotSource: 'official_api' | 'retailer_online_page';
  websiteUrl: string;
}>;

export const retailerMap = {
  hemkop: {
    countryCode: 'SE',
    currency: 'SEK',
    id: 'hemkop',
    name: 'Hemköp',
    priceSnapshotSource: 'official_api',
    websiteUrl: 'https://www.hemkop.se/'
  }
} as const satisfies Record<string, RetailerScraperMetadata>;

export type RetailerId = keyof typeof retailerMap;

export function retailerMetadataFor(id: RetailerId): RetailerScraperMetadata {
  return retailerMap[id];
}
