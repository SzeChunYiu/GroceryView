import { NextResponse, type NextRequest } from 'next/server';

type BestTimeToBuyRuleRequest = {
  userId?: unknown;
  storeId?: unknown;
  categoryId?: unknown;
  channel?: unknown;
  alertType?: unknown;
  minimumConfidence?: unknown;
};

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Bearer token is required to create account alert rules.' }, { status: 401 });
  }

  const body = (await request.json()) as BestTimeToBuyRuleRequest;
  const validationError = validateBestTimeToBuyRule(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  return NextResponse.json({
    rule: {
      id: `best-time-to-buy-${body.userId}-${body.storeId}-${body.categoryId}-${body.channel}`,
      userId: body.userId,
      storeId: body.storeId,
      categoryId: body.categoryId,
      channel: body.channel,
      alertType: 'best_time_to_buy',
      minimumConfidence: body.minimumConfidence,
      active: true,
      createdAt: new Date().toISOString()
    }
  }, { status: 201 });
}

function validateBestTimeToBuyRule(body: BestTimeToBuyRuleRequest): string | null {
  if (!isNonEmptyText(body.userId)) return 'userId is required.';
  if (!isNonEmptyText(body.storeId)) return 'storeId is required.';
  if (!isNonEmptyText(body.categoryId)) return 'categoryId is required.';
  if (body.alertType !== 'best_time_to_buy') return 'alertType must be best_time_to_buy.';
  if (body.channel !== 'push' && body.channel !== 'email') return 'channel must be push or email.';
  if (typeof body.minimumConfidence !== 'number' || !Number.isFinite(body.minimumConfidence) || body.minimumConfidence < 0 || body.minimumConfidence > 1) {
    return 'minimumConfidence must be a number between 0 and 1.';
  }
  return null;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
