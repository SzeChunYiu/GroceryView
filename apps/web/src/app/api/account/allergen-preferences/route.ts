import { NextResponse } from 'next/server';

export type AccountAllergenPreferences = {
  avoidAllergensByDefault: boolean;
  avoidedAllergenTags: string[];
  updatedAt: string;
};

const defaultPreferences: AccountAllergenPreferences = {
  avoidAllergensByDefault: true,
  avoidedAllergenTags: ['milk', 'lactose', 'gluten', 'wheat'],
  updatedAt: '2026-05-25T00:00:00.000Z'
};

const accountAllergenPreferences = new Map<string, AccountAllergenPreferences>([
  ['signed-in-user', defaultPreferences]
]);

function cleanUserId(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 128) : '';
}

function signedInUserId(request: Request, rawUserId: unknown) {
  const authHeader = request.headers.get('authorization') || '';
  const userId = cleanUserId(rawUserId);
  if (!authHeader.startsWith('Bearer ') || userId.length === 0) return null;
  return userId;
}

function cleanTags(value: unknown): string[] {
  if (!Array.isArray(value)) return defaultPreferences.avoidedAllergenTags;
  return [...new Set(value
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim().toLocaleLowerCase('sv-SE'))
    .filter(Boolean))]
    .slice(0, 20);
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const userId = signedInUserId(request, url.searchParams.get('userId'));
  if (!userId) return NextResponse.json({ error: 'Signed-in bearer token required for allergen preferences' }, { status: 401 });

  return NextResponse.json({
    userId,
    preferences: accountAllergenPreferences.get(userId) ?? { ...defaultPreferences, updatedAt: new Date().toISOString() },
    source: 'account allergen preference API'
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { userId?: unknown; avoidAllergensByDefault?: unknown; avoidedAllergenTags?: unknown } | null;
  const userId = signedInUserId(request, body?.userId);
  if (!userId) return NextResponse.json({ error: 'Signed-in bearer token required for allergen preferences' }, { status: 401 });
  if (typeof body?.avoidAllergensByDefault !== 'boolean') {
    return NextResponse.json({ error: 'avoidAllergensByDefault must be boolean' }, { status: 400 });
  }

  const preferences: AccountAllergenPreferences = {
    avoidAllergensByDefault: body.avoidAllergensByDefault,
    avoidedAllergenTags: cleanTags(body.avoidedAllergenTags),
    updatedAt: new Date().toISOString()
  };
  accountAllergenPreferences.set(userId, preferences);

  return NextResponse.json({
    userId,
    preferences,
    persisted: true,
    source: 'account allergen preference API'
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const userId = cleanUserId(form.get('userId'));
  if (!userId) return NextResponse.json({ error: 'userId is required for allergen preferences' }, { status: 400 });

  const preferences: AccountAllergenPreferences = {
    avoidAllergensByDefault: form.get('avoidAllergensByDefault') === 'true',
    avoidedAllergenTags: cleanTags(String(form.get('avoidedAllergenTags') ?? '').split(',')),
    updatedAt: new Date().toISOString()
  };
  accountAllergenPreferences.set(userId, preferences);

  return NextResponse.json({
    userId,
    preferences,
    persisted: true,
    source: 'account allergen preference form'
  });
}
