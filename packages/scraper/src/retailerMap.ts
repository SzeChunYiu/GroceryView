export type RetailerConfig = {
  id: string;
  name: string;
  catalogUrl: string;
  defaultStoreBranch: string;
};

export const retailerMap = {
  hemkop: {
    id: 'hemkop',
    name: 'Hemköp',
    catalogUrl: 'https://www.hemkop.se/api/products',
    defaultStoreBranch: 'online'
  }
} satisfies Record<string, RetailerConfig>;

export function retailerConfig(retailerId: keyof typeof retailerMap): RetailerConfig {
  return retailerMap[retailerId];
}
