import { createPgQueryExecutor, createPostgresSearchTelemetryWriter, type SearchTelemetryEvent } from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchTelemetryPayload = {
  events?: unknown;
};

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

const eventTypes = new Set([
  'search_suggestions_requested',
  'search_stream_event',
  'search_suggestions_returned',
  'search_first_result_time',
  'search_suggestion_clicked',
  'search_suggestions_dismissed'
]);

let cachedDatabaseUrl: string | null = null;
let cachedPool: PgPoolLike | null = null;

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function executorForDatabaseUrl(databaseUrl: string) {
  if (!cachedPool || cachedDatabaseUrl !== databaseUrl) {
    if (cachedPool) await cachedPool.end();
    const pg = await importPgModule();
    cachedPool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    cachedDatabaseUrl = databaseUrl;
  }
  return createPgQueryExecutor(cachedPool);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalNonNegativeInteger(value: unknown) {
  return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value >= 0);
}

function isOptionalNonNegativeNumber(value: unknown) {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === 'string';
}

function isValidSearchTelemetryEvent(value: unknown): value is SearchTelemetryEvent {
  if (!isRecord(value)) return false;
  const observedAt = typeof value.observedAt === 'string' ? Date.parse(value.observedAt) : Number.NaN;

  return typeof value.eventType === 'string'
    && eventTypes.has(value.eventType)
    && typeof value.query === 'string'
    && value.query.trim().length > 0
    && value.query.length <= 200
    && isOptionalNonNegativeInteger(value.resultCount)
    && isOptionalString(value.resultId)
    && isOptionalNonNegativeInteger(value.resultRank)
    && isOptionalNonNegativeNumber(value.elapsedMs)
    && isOptionalString(value.streamEvent)
    && isOptionalString(value.reason)
    && Number.isFinite(observedAt);
}

export async function POST(request: Request) {
  let payload: SearchTelemetryPayload;

  try {
    payload = await request.json() as SearchTelemetryPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const events = Array.isArray(payload.events) ? payload.events : [];
  if (events.length === 0 || events.length > 20 || !events.every(isValidSearchTelemetryEvent)) {
    return NextResponse.json({ error: 'Invalid search telemetry batch.' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'search_telemetry_database_unconfigured' }, { status: 503 });
  }

  try {
    const executor = await executorForDatabaseUrl(databaseUrl);
    const writer = createPostgresSearchTelemetryWriter(executor);
    const accepted = await writer.persistEvents(events);
    return NextResponse.json({ accepted });
  } catch (error) {
    console.error('Search telemetry persistence failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
    return NextResponse.json({ error: 'search_telemetry_persist_failed' }, { status: 500 });
  }
}
