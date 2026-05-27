export const scrapeRoutes = {
  controllerPath: 'api/scrape',
  hemkopCatalog: 'api/scrape/hemkop/catalog',
  hemkopRetailerId: 'hemkop',
  hemkopParserVersion: 'hemkop-products-native-v1',
  description: 'Retailer scrape route contracts for connector-triggered price snapshots.',
  hemkopDescription: 'Fetch Hemköp product catalog JSON through the scraper adapter and persist branch-scoped price snapshots with retailerId=hemkop.',
  responseFields: ['retailerId', 'storeBranchId', 'storeBranchName', 'productId', 'price', 'observedAt']
} as const;
