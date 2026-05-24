export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  fuzzySearch: 'products/search/fuzzy',
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  description: 'Product catalog search, fuzzy trigram matching, and shopping-list bulk import match routes',
  fuzzyDescription: 'Uses pg_trgm similarity plus unaccented localized product names so queries like mjölk, mjolk, and milk can match.',
  fuzzyMinimumSimilarity: 0.2,
  plainTextLines: 'plainTextLines',
  responseFields: ['matchedProductSlug', 'matchedProductName', 'unmatchedLines'],
  matchedProductSlug: 'matchedProductSlug'
} as const;
