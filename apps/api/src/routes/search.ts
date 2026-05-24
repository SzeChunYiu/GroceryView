export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  autocompleteSuggestions: 'products/search/suggestions',
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  description: 'Product catalog search and shopping-list bulk import match routes',
  suggestionFields: ['id', 'slug', 'name', 'category'],
  plainTextLines: 'plainTextLines',
  responseFields: ['matchedProductSlug', 'matchedProductName', 'unmatchedLines'],
  matchedProductSlug: 'matchedProductSlug'
} as const;
