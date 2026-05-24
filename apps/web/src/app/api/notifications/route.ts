import { NextResponse } from 'next/server';
import { formatZodIssues, notificationPreferenceBodySchema, notificationQuerySchema } from './validation.mjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function validationError(issues: Array<{ code: string; path: string; message: string }>) {
  return NextResponse.json({ error: 'notifications_request_invalid', issues }, { status: 400 });
}

export async function GET(request: Request) {
  const queryResult = notificationQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!queryResult.success) return validationError(formatZodIssues(queryResult.error.issues));

  return NextResponse.json({
    userId: queryResult.data.userId,
    includeMuted: queryResult.data.includeMuted ?? false,
    topics: ['price_drop', 'weekly_digest', 'watchlist_alert', 'receipt_review'],
    preferences: []
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationError([{ code: 'invalid_json', path: 'body', message: 'Request body must be valid JSON.' }]);
  }

  const bodyResult = notificationPreferenceBodySchema.safeParse(body);
  if (!bodyResult.success) return validationError(formatZodIssues(bodyResult.error.issues));

  return NextResponse.json({
    accepted: true,
    preference: bodyResult.data
  }, { status: 202 });
}
