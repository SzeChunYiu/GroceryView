export const recipesRoutes = {
  controllerPath: 'recipes',
  detailAlias: 'recipes/:id',
  addAllToListAction: 'recipes/:id/add-all-to-list',
  shoppingListParam: 'recipe',
  description: 'Recipe detail pages expose an Add all to list action that imports every ingredient into the shopping list with store comparison evidence.',
  responseFields: [
    'id',
    'title',
    'ingredients',
    'shoppingListHref',
    'storeComparison',
    'estimatedTotal'
  ],
  guardrail: 'Recipe ingredients are added only from visible deal-backed rows; store comparison notes are carried onto list items instead of inferred later.'
} as const;
