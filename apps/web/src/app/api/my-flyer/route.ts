import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getCachedMyFlyerPayload,
  myFlyerAlgorithms,
  myFlyerCountries,
  type MyFlyerQuery
} from '@/lib/my-flyer';
import { privateAccountCacheControl } from '@/lib/cache-policy';

const userIdSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);

const querySchema = z.object({
  user_id: userIdSchema,
  algorithm: z.enum(myFlyerAlgorithms).default('watchlist_first'),
  country: z.enum(myFlyerCountries).default('se'),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

const preferencesSchema = z.object({
  user_id: userIdSchema,
  algorithm: z.enum(myFlyerAlgorithms),
  country: z.enum(myFlyerCountries),
  favorite_stores: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  home_location: z.string().trim().min(1).max(120),
  household_size: z.coerce.number().int().min(1).max(12),
  diet_filters: z.array(z.string().trim().min(1).max(40)).max(12).default([])
});

const myFlyerPreferences = new Map<string, z.infer<typeof preferencesSchema>>();

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
      'Cache-Control': privateAccountCacheControl,
      'X-MyFlyer-Cache': cacheStatus
    }
  });
}


export async function PATCH(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Signed-in bearer token required for MyFlyer preferences' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error);

  myFlyerPreferences.set(parsed.data.user_id, parsed.data);

  return NextResponse.json({
    userId: parsed.data.user_id,
    preferences: parsed.data,
    persisted: true,
    source: 'my-flyer preference API'
  });
}
