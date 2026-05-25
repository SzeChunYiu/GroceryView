import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  buildMyFlyerUserSignals,
  getCachedMyFlyerPayload,
  myFlyerAlgorithms,
  myFlyerCountries,
  type MyFlyerQuery
} from '@/lib/my-flyer';

const querySchema = z.object({
  user_id: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  algorithm: z.enum(myFlyerAlgorithms).default('watchlist_first'),
  country: z.enum(myFlyerCountries).default('se'),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

function badRequest(error: z.ZodError) {
  return NextResponse.json({
    error: 'Invalid my-flyer query',
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }))
  }, { status: 400 });
}

function listSignalValues(searchParams: URLSearchParams, headerValue: string | null, names: string[]) {
  const values = [
    ...(headerValue ?? '').split(','),
    ...names.flatMap((name) => searchParams.getAll(name).flatMap((value) => value.split(',')))
  ];

  return values.map((value) => value.trim()).filter(Boolean);
}

function hasAuthenticatedSession(request: Request, userId: string) {
  const bearer = request.headers.get('authorization');
  const headerUserId = request.headers.get('x-groceryview-user-id');
  return Boolean(bearer?.startsWith('Bearer ')) || headerUserId === userId;
}

function authenticatedSignalsFromRequest(request: Request, userId: string, searchParams: URLSearchParams) {
  return buildMyFlyerUserSignals({
    authenticated: hasAuthenticatedSession(request, userId),
    favoriteStoreIds: listSignalValues(searchParams, request.headers.get('x-groceryview-favorite-stores'), ['favorite_store', 'favoriteStore']),
    watchlistProductIds: listSignalValues(searchParams, request.headers.get('x-groceryview-watchlist-products'), ['watchlist_product', 'watchlistProduct']),
    watchlistCategories: listSignalValues(searchParams, request.headers.get('x-groceryview-watchlist-categories'), ['watchlist_category', 'watchlistCategory']),
    recentBasketProductIds: listSignalValues(searchParams, request.headers.get('x-groceryview-recent-basket-products'), ['recent_basket_product', 'recentBasketProduct']),
    recentBasketCategories: listSignalValues(searchParams, request.headers.get('x-groceryview-recent-basket-categories'), ['recent_basket_category', 'recentBasketCategory'])
  });
}

export function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return badRequest(parsed.error);

  const query: MyFlyerQuery = {
    userId: parsed.data.user_id,
    algorithm: parsed.data.algorithm,
    country: parsed.data.country,
    limit: parsed.data.limit,
    userSignals: authenticatedSignalsFromRequest(request, parsed.data.user_id, searchParams)
  };
  const { payload, cacheStatus } = getCachedMyFlyerPayload(query);

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'X-MyFlyer-Cache': cacheStatus
    }
  });
}
