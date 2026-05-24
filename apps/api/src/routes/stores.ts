export const storesRoutes = {
  controllerPath: 'stores',
  detail: 'stores/:id',
  rating: 'stores/:id/rating',
  ratingDescription: 'Read and submit 1-5 star user ratings for individual stores',
  ratingFields: ['storeId', 'averageRating', 'ratingCount', 'myRating'],
  ratingRequestFields: ['userId', 'rating'],
  ratingRange: [1, 5]
} as const;
