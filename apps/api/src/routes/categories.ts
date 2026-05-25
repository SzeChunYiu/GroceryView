export const categoriesRoute = {
  controllerPath: 'categories',
  listDescription: 'Full category tree with id, name, slug, parentId, and itemCount metadata',
  marketDescription: 'Category market report with verified price and deal evidence',
  detailDescription: 'Category detail payload supports filterable, sortable item grids with pagination metadata.',
  queryParams: ['q', 'sort', 'page', 'pageSize'],
  sortOptions: ['name', 'price-asc', 'price-desc', 'source'],
  pagination: { defaultPageSize: 12, maxPageSize: 48 }
} as const;
