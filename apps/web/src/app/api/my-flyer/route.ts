import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
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

export function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return badRequest(parsed.error);

  const query: MyFlyerQuery = {
    userId: parsed.data.user_id,
    algorithm: parsed.data.algorithm,
    country: parsed.data.country,
    limit: parsed.data.limit
  };
  const { payload, cacheStatus } = getCachedMyFlyerPayload(query);

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
      'X-MyFlyer-Cache': cacheStatus
    }
  });
}
