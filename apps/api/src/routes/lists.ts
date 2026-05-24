export const listsRoutes = {
  controllerPath: 'lists',
  collection: 'users/{userId}/lists',
  item: 'users/{userId}/lists/{listId}',
  webShoppingListPage: '/list',
  description: 'Multiple named shopping lists with active-list switching, per-list item state, and delete support.',
  responseFields: ['id', 'name', 'active', 'items', 'checkedById', 'updatedAt'],
  actions: ['create', 'switch', 'delete']
} as const;
