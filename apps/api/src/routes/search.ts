export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  categoryFilterSidebar: 'search?category=',
  fuzzySearch: 'products/search/fuzzy',
  suggest: 'search/suggest',
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  description: 'Product catalog search, collapsible multi-select category filters, fuzzy trigram matching, and shopping-list bulk import match routes',
  fuzzyDescription: 'Uses pg_trgm similarity plus unaccented localized product names so queries like mjölk, mjolk, and milk can match.',
  suggestDescription: 'GET /api/search/suggest?q= returns the top 8 grocery product name suggestions using PostgreSQL pg_trgm prefix indexes.',
  fuzzyMinimumSimilarity: 0.2,
  suggestLimit: 8,
  plainTextLines: 'plainTextLines',
  responseFields: ['matchedProductSlug', 'matchedProductName', 'unmatchedLines'],
  dietaryFilterQueryParam: 'dietary',
  categoryFilterQueryParam: 'category',
  categoryFilterMode: 'multi-select',
  categoryFilterCountField: 'facets.categories[].count',
  dietaryFilters: [
    { value: 'vegan', productField: 'isVegan' },
    { value: 'gluten-free', productField: 'isGlutenFree' },
    { value: 'lactose-free', productField: 'isLactoseFree' }
  ],
  matchedProductSlug: 'matchedProductSlug'
} as const;
