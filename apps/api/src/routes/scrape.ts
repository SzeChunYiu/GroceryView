export const scrapeRoutes = {
  controllerPath: 'scrape',
  hemkop: {
    path: 'scrape/hemkop',
    retailerId: 'hemkop',
    requiredSnapshotFields: ['retailerId', 'storeBranch', 'productId', 'name', 'price', 'currency', 'scrapedAt'],
    description: 'Fetches Hemköp product catalog JSON and stores parsed price snapshots with retailer ID and store branch metadata.'
  }
} as const;
