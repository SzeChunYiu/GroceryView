import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const notificationQuerySchema = z.object({
  userId: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['all', 'read', 'unread']).default('all')
}).strict();

const notificationBodySchema = z.object({
  userId: z.string().trim().min(1),
  type: z.enum(['price_drop', 'best_time_to_buy', 'pantry_expiry', 'weekly_basket_digest']),
  channel: z.enum(['push', 'email', 'in_app']).default('in_app'),
  message: z.string().trim().min(1).max(240),
  productId: z.string().trim().min(1).optional(),
  metadata: z.record(z.unknown()).default({})
}).strict();

function issuesFor(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message
  }));
}

function invalidNotificationResponse(error: z.ZodError) {
  return NextResponse.json({ error: 'invalid_notification_params', issues: issuesFor(error) }, { status: 400 });
}

function queryParams(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

async function bodyParams(request: Request) {
  try {
    const input = await request.json();
    return input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  const parsed = notificationQuerySchema.safeParse(queryParams(request));
  if (!parsed.success) return invalidNotificationResponse(parsed.error);

  return NextResponse.json({
    notifications: [],
    params: parsed.data,
    source: 'notification-preferences-and-alert-events'
  });
}

export async function POST(request: Request) {
  const parsed = notificationBodySchema.safeParse({ ...queryParams(request), ...await bodyParams(request) });
  if (!parsed.success) return invalidNotificationResponse(parsed.error);

  return NextResponse.json({
    notification: {
      id: `notification-${parsed.data.userId}-${parsed.data.type}`,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      read: false
    }
  }, { status: 201 });
}
