export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  fuzzySearch: 'products/search/fuzzy',
  suggest: 'search/suggest',
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  description: 'Product catalog search, fuzzy trigram matching, and shopping-list bulk import match routes',
  fuzzyDescription: 'Uses pg_trgm similarity plus unaccented localized product names so queries like mjölk, mjolk, and milk can match.',
  suggestDescription: 'GET /api/search/suggest?q= returns the top 8 grocery product name suggestions using PostgreSQL pg_trgm prefix indexes.',
  pagination: {
    queryParam: 'cursor',
    defaultLimit: 24,
    maxLimit: 50,
    ttlSeconds: 300,
    description: 'Cursor-based search endpoints return one server window at a time and may cache expensive result windows for 5 minutes.'
  },
  fuzzyMinimumSimilarity: 0.2,
  suggestLimit: 8,
  plainTextLines: 'plainTextLines',
  responseFields: ['matchedProductSlug', 'matchedProductName', 'unmatchedLines'],
  dietaryFilterQueryParam: 'dietary',
  dietaryFilters: [
    { value: 'vegan', productField: 'isVegan' },
    { value: 'gluten-free', productField: 'isGlutenFree' },
    { value: 'lactose-free', productField: 'isLactoseFree' }
  ],
  matchedProductSlug: 'matchedProductSlug'
} as const;
