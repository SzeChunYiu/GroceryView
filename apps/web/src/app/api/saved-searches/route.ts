import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type SavedSearchRecord = {
  accountId: string;
  createdAt: string;
  filters: Record<string, string[]>;
  href: string;
  id: string;
  label: string;
  resultCount: number | null;
  source: 'products-page';
  updatedAt: string;
  userAgent: string | null;
};

declare global {
  var groceryViewSavedSearches: Map<string, SavedSearchRecord> | undefined;
}

const savedSearches = globalThis.groceryViewSavedSearches ?? new Map<string, SavedSearchRecord>();
globalThis.groceryViewSavedSearches = savedSearches;

const allowedFilterKeys = new Set(['q', 'category', 'chain', 'minPrice', 'maxPrice', 'dietary', 'origin']);

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringList(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return [...new Set(values.flatMap((item) => cleanString(item).split(',')).map((item) => item.trim()).filter(Boolean))].slice(0, 12);
}

function normalizeFilters(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => allowedFilterKeys.has(key))
      .map(([key, rawValue]) => [key, normalizeStringList(rawValue)] as const)
      .filter(([, values]) => values.length > 0)
  );
}

function compactIdPart(value: string) {
  return value.toLocaleLowerCase('sv-SE').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function fallbackSearchId(filters: Record<string, string[]>) {
  const suffix = Object.entries(filters)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([key, values]) => values.map((value) => `${key}-${compactIdPart(value)}`))
    .join('-')
    .slice(0, 120);
  return suffix ? `products-${suffix}` : '';
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest) {
  const accountId = cleanString(request.nextUrl.searchParams.get('accountId'));
  if (!accountId) return NextResponse.json({ error: 'accountId is required for signed-in saved searches.' }, { status: 400 });

  const searches = [...savedSearches.values()]
    .filter((search) => search.accountId === accountId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return NextResponse.json({ accountId, searches });
}

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const accountId = cleanString(body.accountId);
  if (!accountId) return NextResponse.json({ error: 'accountId is required for signed-in saved searches.' }, { status: 400 });

  const filters = normalizeFilters(body.filters);
  if (Object.keys(filters).length === 0) {
    return NextResponse.json({ error: 'At least one product query, category, chain, price, dietary, or origin filter is required.' }, { status: 400 });
  }

  const id = cleanString(body.id) || fallbackSearchId(filters);
  const href = cleanString(body.href) || '/products';
  const label = cleanString(body.label) || 'Saved product filters';
  const existing = savedSearches.get(`${accountId}:${id}`);
  const now = new Date().toISOString();
  const resultCount = typeof body.resultCount === 'number' && Number.isFinite(body.resultCount) ? Math.max(0, Math.trunc(body.resultCount)) : null;
  const record: SavedSearchRecord = {
    accountId,
    createdAt: existing?.createdAt ?? now,
    filters,
    href,
    id,
    label,
    resultCount,
    source: 'products-page',
    updatedAt: now,
    userAgent: request.headers.get('user-agent')
  };

  savedSearches.set(`${accountId}:${id}`, record);

  return NextResponse.json({ savedSearch: record, status: existing ? 'updated' : 'saved' }, { status: existing ? 200 : 201 });
}
