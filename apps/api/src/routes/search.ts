export const searchRoutes = {
  controllerPath: 'products',
  facetedSearch: 'products/search/faceted',
  bulkListImport: 'products/search/list-import',
  bulkListImportActionPath: 'search/list-import',
  suggest: 'api/search/suggest',
  suggestActionPath: 'search/suggest',
  suggestLimit: 8,
  description: 'Product catalog search and shopping-list bulk import match routes',
  plainTextLines: 'plainTextLines',
  responseFields: ['matchedProductSlug', 'matchedProductName', 'unmatchedLines'],
  matchedProductSlug: 'matchedProductSlug'
} as const;

export function buildSearchSuggestQuery(q: string) {
  const prefix = q.trim();

  return {
    sql: `select id, slug, name
      from products
      where name ilike $1
      order by similarity(name, $2) desc, name asc
      limit ${searchRoutes.suggestLimit}`,
    params: [`${prefix}%`, prefix]
  };
}
