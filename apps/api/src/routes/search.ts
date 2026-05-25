export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  fuzzySearch: 'products/search/fuzzy',
  suggest: 'search/suggest',
  suggestQueryParam: 'q',
  suggestCountryParam: 'country',
  suggestDebounceMs: 250,
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  description: 'Product catalog search, fuzzy trigram matching, and shopping-list bulk import match routes',
  fuzzyDescription: 'Uses pg_trgm similarity plus unaccented localized product names so queries like mjölk, mjolk, and milk can match.',
  suggestDescription: 'GET /api/search/suggest?q=&country= returns debounced autocomplete suggestions for matching item names and category facets using PostgreSQL pg_trgm prefix indexes.',
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
