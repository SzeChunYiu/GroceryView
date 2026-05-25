export const listsRoutes = {
  lists: 'api/lists',
  description: 'Authenticated saved grocery list routes. Requests require a Bearer JWT whose subject or userId identifies the account owner before any list rows are returned or changed.',
  authScheme: 'bearer-jwt',
  protectedPaths: ['api/lists'],
  responseFields: ['lists', 'items', 'ownerUserId']
} as const;
