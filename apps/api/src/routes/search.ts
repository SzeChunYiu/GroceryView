export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  description: 'Product catalog search and shopping-list bulk import match routes',
  plainTextLines: 'plainTextLines',
  responseFields: ['matchedProductSlug', 'matchedProductName', 'unmatchedLines'],
  matchedProductSlug: 'matchedProductSlug'
} as const;
