export const categoriesRoute = {
  controllerPath: 'categories',
  listDescription: 'Full category tree with id, name, slug, parentId, and itemCount metadata',
  marketDescription: 'Category market report with verified price and deal evidence',
  trendDescription: 'Six-month category average price index with month, index, averagePrice, and itemCount points',
  trendWindowMonths: 6,
  queryParams: []
} as const;
