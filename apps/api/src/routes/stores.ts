export const storesRoutes = {
  controllerPath: 'stores',
  detail: 'stores/:id',
  ratingSummary: 'stores/:id/rating-summary',
  ratingSummaryActionPath: ':id/rating-summary',
  ratings: 'stores/:id/ratings',
  ratingsActionPath: ':id/ratings',
  ratingDescription: 'User-submitted 1-5 star store ratings with average score and count',
  ratingBodyFields: ['userId', 'rating'],
  minRating: 1,
  maxRating: 5,
  responseFields: ['storeId', 'averageRating', 'ratingCount', 'userRating']
} as const;
