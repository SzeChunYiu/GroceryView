import { NextResponse } from 'next/server';
import { SAVED_VIEWS_STORAGE_KEY, SAVED_VIEW_SURFACES } from '@/lib/saved-views';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPPORTED_SURFACES = new Set(SAVED_VIEW_SURFACES);

function unauthorized() {
  return NextResponse.json(
    {
      error: 'authentication_required',
      guestFallbackKey: SAVED_VIEWS_STORAGE_KEY,
      detail: 'Signed-in saved-view persistence requires a production account session. Guests should use the localStorage fallback.'
    },
    { status: 401, headers: { 'Cache-Control': 'no-store' } }
  );
}

function hasBearerToken(request: Request) {
  return /^Bearer\s+\S+/i.test(request.headers.get('authorization') ?? '');
}

function validateSavedViewPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return 'Expected a saved view object.';
  const view = payload as Record<string, unknown>;
  if (typeof view.url !== 'string' || !view.url.startsWith('/')) return 'Saved view url must be an app-relative path.';
  if (typeof view.surface !== 'string' || !SUPPORTED_SURFACES.has(view.surface)) return 'Saved view surface is not supported.';
  if (typeof view.label !== 'string' || view.label.trim().length < 1) return 'Saved view label is required.';
  return null;
}

export async function GET(request: Request) {
  if (!hasBearerToken(request)) return unauthorized();
  return NextResponse.json(
    {
      views: [],
      persistence: 'account-session-required',
      detail: 'The API contract is ready for authenticated account-backed saved views; no static or anonymous account rows are returned.'
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request) {
  if (!hasBearerToken(request)) return unauthorized();
  const payload = await request.json().catch(() => null);
  const validationError = validateSavedViewPayload(payload);
  if (validationError) {
    return NextResponse.json({ error: 'invalid_saved_view', detail: validationError }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(
    {
      accepted: true,
      persistence: 'account-session-required',
      detail: 'Validated saved-view payload; durable account writes are gated until production auth storage is connected.'
    },
    { status: 202, headers: { 'Cache-Control': 'no-store' } }
  );
}
