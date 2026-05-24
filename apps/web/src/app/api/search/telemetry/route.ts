import { NextResponse } from 'next/server';

type SearchTelemetryPayload = {
  events?: unknown;
};

const eventTypes = new Set([
  'search_suggestions_requested',
  'search_stream_event',
  'search_suggestions_returned',
  'search_first_result_time',
  'search_suggestion_clicked',
  'search_suggestions_dismissed'
]);

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

function isValidSearchTelemetryEvent(value: unknown) {
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

  return NextResponse.json({ accepted: events.length });
}
