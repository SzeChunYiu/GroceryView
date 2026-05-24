export const categoriesRoute = {
  controllerPath: 'categories',
  listDescription: 'Full category tree with id, name, slug, parentId, and itemCount metadata',
  detailPath: 'categories/:slug',
  itemGridPath: 'categories/:slug/items',
  webCategoryPath: '/categories/[slug]',
  marketDescription: 'Category market report with verified price and deal evidence',
  itemGridDescription: 'Paginated category item grid backed by OpenPrices observations and chain catalogue price-spread rows',
  queryParams: ['q', 'source', 'sort', 'page', 'pageSize'],
  sourceValues: ['all', 'openprices', 'chain'],
  sortValues: ['relevance', 'price-asc', 'price-desc', 'observed-desc', 'name-asc'],
  defaultPageSize: 24,
  maxPageSize: 60,
  responseFields: [
    'items',
    'pagination',
    'filters',
    'categorySlug',
    'categoryLabel',
    'sourceBreakdown'
  ]
} as const;
