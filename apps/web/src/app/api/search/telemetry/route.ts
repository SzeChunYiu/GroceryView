import { createPgQueryExecutor, insertSearchTelemetryEvents, type SearchTelemetryEventName } from '@groceryview/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PgPoolLike = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number }) => PgPoolLike;
};

type SearchTelemetryPayload = {
  events?: unknown;
};

const acceptedEventNames = new Set<SearchTelemetryEventName>([
  'search_suggestion_clicked',
  'search_suggestions_dismissed',
  'search_first_result_time',
  'search_stream_event',
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

function boundedString(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, maxLength) : '';
}

function optionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isoTimestamp(value: unknown) {
  const fallback = new Date().toISOString();
  if (typeof value !== 'string') return fallback;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

function normalizeEvent(value: unknown) {
  const event = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const eventName = boundedString(event.eventType ?? event.eventName, 80) as SearchTelemetryEventName;
  const query = boundedString(event.query, 160);
  if (!acceptedEventNames.has(eventName) || !query) return null;

  return {
    eventName,
    occurredAt: isoTimestamp(event.observedAt ?? event.occurredAt),
    query,
    anonymousId: boundedString(event.anonymousId, 120) || undefined,
    payload: {
      elapsedMs: optionalNumber(event.elapsedMs),
      reason: boundedString(event.reason, 80) || undefined,
      resultCount: optionalNumber(event.resultCount),
      resultId: boundedString(event.resultId, 160) || undefined,
      resultRank: optionalNumber(event.resultRank),
      streamEvent: boundedString(event.streamEvent, 120) || undefined,
    }
  };
}

export async function POST(request: Request) {
  let payload: SearchTelemetryPayload;

  try {
    payload = await request.json() as SearchTelemetryPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_search_telemetry_payload' }, { status: 400 });
  }

  const rawEvents = Array.isArray(payload.events) ? payload.events.slice(0, 20) : [];
  const events = rawEvents.map(normalizeEvent).filter((event): event is NonNullable<ReturnType<typeof normalizeEvent>> => event !== null);
  if (rawEvents.length === 0 || events.length === 0) {
    return NextResponse.json({ error: 'no_accepted_search_telemetry_events' }, { status: 400 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'search_telemetry_database_unconfigured', accepted: events.length, persisted: 0 }, { status: 503 });
  }

  const executor = await executorForDatabaseUrl(databaseUrl);
  const persisted = await insertSearchTelemetryEvents(executor, events);
  return NextResponse.json({ accepted: events.length, persisted }, { status: 202 });
}
