export type SearchTelemetryEventType =
  | 'search_suggestions_requested'
  | 'search_stream_event'
  | 'search_suggestions_returned'
  | 'search_first_result_time'
  | 'search_suggestion_clicked'
  | 'search_suggestions_dismissed';

export type SearchTelemetryEvent = {
  eventType: SearchTelemetryEventType;
  query: string;
  resultCount?: number;
  resultId?: string;
  resultRank?: number;
  elapsedMs?: number;
  streamEvent?: string;
  reason?: string;
  observedAt: string;
};

export type SearchTelemetryQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type SearchTelemetryInsertQuery = {
  sql: string;
  values: unknown[];
};

type InsertedSearchTelemetryRow = {
  id: string;
};

function payloadFor(event: SearchTelemetryEvent) {
  return JSON.stringify({
    eventType: event.eventType,
    query: event.query,
    ...(event.resultCount === undefined ? {} : { resultCount: event.resultCount }),
    ...(event.resultId === undefined ? {} : { resultId: event.resultId }),
    ...(event.resultRank === undefined ? {} : { resultRank: event.resultRank }),
    ...(event.elapsedMs === undefined ? {} : { elapsedMs: event.elapsedMs }),
    ...(event.streamEvent === undefined ? {} : { streamEvent: event.streamEvent }),
    ...(event.reason === undefined ? {} : { reason: event.reason }),
    observedAt: event.observedAt
  });
}

export function buildInsertSearchTelemetryEventsQuery(events: SearchTelemetryEvent[]): SearchTelemetryInsertQuery | null {
  if (events.length === 0) return null;

  const values: unknown[] = [];
  const rows = events.map((event, index) => {
    const offset = index * 10;
    values.push(
      event.eventType,
      event.query,
      event.resultCount ?? null,
      event.resultId ?? null,
      event.resultRank ?? null,
      event.elapsedMs ?? null,
      event.streamEvent ?? null,
      event.reason ?? null,
      event.observedAt,
      payloadFor(event)
    );
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}::jsonb)`;
  });

  return {
    sql: `insert into search_telemetry_events (
            event_type,
            query,
            result_count,
            result_id,
            result_rank,
            elapsed_ms,
            stream_event,
            reason,
            observed_at,
            payload
          ) values ${rows.join(', ')}
          returning id`,
    values
  };
}

export function createPostgresSearchTelemetryWriter(executor: SearchTelemetryQueryExecutor) {
  return {
    async persistEvents(events: SearchTelemetryEvent[]): Promise<number> {
      const insert = buildInsertSearchTelemetryEventsQuery(events);
      if (!insert) return 0;

      const rows = await executor.query<InsertedSearchTelemetryRow>(insert.sql, insert.values);
      return rows.length;
    }
  };
}
