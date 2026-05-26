import { NextResponse, type NextRequest } from 'next/server';

import {
  normalizeSavedViewState,
  savedViewId,
  savedViewSupportsAlerts,
  type SavedViewAlert,
  type SavedViewRecord,
  type SavedViewState,
  type SavedViewSurface
} from '@/lib/saved-views';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

declare global {
  var groceryViewSavedViews: Map<string, SavedViewRecord> | undefined;
  var groceryViewSavedViewAlerts: Map<string, SavedViewAlert> | undefined;
}

const savedViews = globalThis.groceryViewSavedViews ?? new Map<string, SavedViewRecord>();
const savedViewAlerts = globalThis.groceryViewSavedViewAlerts ?? new Map<string, SavedViewAlert>();
globalThis.groceryViewSavedViews = savedViews;
globalThis.groceryViewSavedViewAlerts = savedViewAlerts;

const allowedSurfaces = new Set<SavedViewSurface>(['map', 'deals', 'screener', 'categories', 'compare']);

type SavedViewBody = {
  accountId?: unknown;
  createAlert?: unknown;
  href?: unknown;
  id?: unknown;
  label?: unknown;
  state?: unknown;
  surface?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanSurface(value: unknown): SavedViewSurface | null {
  const surface = cleanString(value) as SavedViewSurface;
  return allowedSurfaces.has(surface) ? surface : null;
}

async function readJson(request: NextRequest): Promise<SavedViewBody> {
  return request.json().catch(() => ({})) as Promise<SavedViewBody>;
}

export async function GET(request: NextRequest) {
  const accountId = cleanString(request.nextUrl.searchParams.get('accountId'));
  if (!accountId) return NextResponse.json({ error: 'accountId is required.' }, { status: 400 });

  const views = [...savedViews.values()]
    .filter((view) => view.accountId === accountId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const alerts = [...savedViewAlerts.values()]
    .filter((alert) => alert.accountId === accountId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return NextResponse.json({ accountId, alerts, views });
}

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const accountId = cleanString(body.accountId);
  const surface = cleanSurface(body.surface);
  const href = cleanString(body.href);
  const label = cleanString(body.label);

  if (!accountId || !surface || !href || !label) {
    return NextResponse.json({ error: 'accountId, surface, href, and label are required.' }, { status: 400 });
  }

  const state = normalizeSavedViewState((body.state && typeof body.state === 'object' ? body.state : {}) as SavedViewState);
  const id = cleanString(body.id) || savedViewId(surface, label, state);
  const existing = savedViews.get(`${accountId}:${id}`);
  const now = new Date().toISOString();
  const record: SavedViewRecord = {
    accountId,
    createdAt: existing?.createdAt ?? now,
    href,
    id,
    label,
    source: 'account',
    state,
    surface,
    updatedAt: now
  };

  savedViews.set(`${accountId}:${id}`, record);

  const alert = body.createAlert === true && savedViewSupportsAlerts(surface)
    ? {
        accountId,
        createdAt: now,
        id: `saved-view-alert-${crypto.randomUUID()}`,
        rule: surface === 'screener' ? 'Notify when this saved screener has new matching observed deals.' : 'Notify when this saved deal view has new matching observed drops.',
        savedViewId: id,
        surface
      } satisfies SavedViewAlert
    : null;

  if (alert) savedViewAlerts.set(alert.id, alert);

  return NextResponse.json({ alert, savedView: record, status: existing ? 'updated' : 'saved' }, { status: existing ? 200 : 201 });
}
