import { NextResponse } from 'next/server';

type CompareMode = 'adaptive' | 'total' | 'unit';

const accountCompareModePreferences = new Map<string, CompareMode>();

function isCompareMode(value: unknown): value is CompareMode {
  return value === 'adaptive' || value === 'total' || value === 'unit';
}

function signedInUserId(request: Request, rawUserId: unknown) {
  const authHeader = request.headers.get('authorization') || '';
  const userId = typeof rawUserId === 'string' ? rawUserId.trim() : '';

  if (!authHeader.startsWith('Bearer ') || userId.length === 0) return null;
  return userId.slice(0, 128);
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const userId = signedInUserId(request, url.searchParams.get('userId'));
  if (!userId) return NextResponse.json({ error: 'Signed-in bearer token required for compare-mode preferences' }, { status: 401 });

  return NextResponse.json({
    compareMode: accountCompareModePreferences.get(userId) ?? 'adaptive',
    persisted: accountCompareModePreferences.has(userId),
    source: 'account compare-mode preference API',
    userId
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { compareMode?: unknown; userId?: unknown } | null;
  const userId = signedInUserId(request, body?.userId);
  if (!userId) return NextResponse.json({ error: 'Signed-in bearer token required for compare-mode preferences' }, { status: 401 });

  if (!isCompareMode(body?.compareMode)) {
    return NextResponse.json({ error: 'compareMode must be adaptive, total, or unit' }, { status: 400 });
  }

  accountCompareModePreferences.set(userId, body.compareMode);

  return NextResponse.json({
    compareMode: body.compareMode,
    persisted: true,
    source: 'account compare-mode preference API',
    userId
  });
}
