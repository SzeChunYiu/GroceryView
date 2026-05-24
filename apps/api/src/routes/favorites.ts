export const favoritesRoutes = {
  demoUserFavorites: 'users/demo/favorites',
  accountUserFavorites: 'users/{userId}/favorites',
  accountUserFavoritesPath: 'users/:userId/favorites',
  description: 'Account-bookmarked products with current cheapest price and store evidence',
  queryParams: ['sort'],
  sort: ['name', 'price']
} as const;
