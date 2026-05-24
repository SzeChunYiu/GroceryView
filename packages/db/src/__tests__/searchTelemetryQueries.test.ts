import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInsertSearchTelemetryEventsQuery,
  createPostgresSearchTelemetryWriter,
  type SearchTelemetryEvent
} from '../queries/searchTelemetry.js';

const payloads: SearchTelemetryEvent[] = [
  {
    eventType: 'search_suggestion_clicked',
    query: 'coffee',
    resultId: 'product-1',
    resultRank: 0,
    observedAt: '2026-05-24T10:00:00.000Z'
  },
  {
    eventType: 'search_suggestions_dismissed',
    query: 'milk',
    reason: 'escape_key',
    observedAt: '2026-05-24T10:00:01.000Z'
  },
  {
    eventType: 'search_first_result_time',
    query: 'bread',
    elapsedMs: 42,
    resultCount: 6,
    observedAt: '2026-05-24T10:00:02.000Z'
  },
  {
    eventType: 'search_stream_event',
    query: 'eggs',
    elapsedMs: 15,
    streamEvent: 'autocomplete_results_rendered',
    observedAt: '2026-05-24T10:00:03.000Z'
  }
];

describe('PostgreSQL search telemetry writer', () => {
  it('builds one durable insert for clicked, dismissed, timing, and stream payloads', () => {
    const insert = buildInsertSearchTelemetryEventsQuery(payloads);

    assert.ok(insert);
    assert.match(insert.sql, /insert into search_telemetry_events/);
    assert.match(insert.sql, /event_type/);
    assert.match(insert.sql, /payload/);
    assert.match(insert.sql, /returning id/);
    assert.equal(insert.values.length, 40);
    assert.deepEqual(insert.values.slice(0, 10), [
      'search_suggestion_clicked',
      'coffee',
      null,
      'product-1',
      0,
      null,
      null,
      null,
      '2026-05-24T10:00:00.000Z',
      JSON.stringify(payloads[0])
    ]);
    assert.equal(JSON.parse(insert.values[19] as string).reason, 'escape_key');
    assert.equal(JSON.parse(insert.values[29] as string).eventType, 'search_first_result_time');
    assert.equal(JSON.parse(insert.values[39] as string).streamEvent, 'autocomplete_results_rendered');
  });

  it('persists the telemetry batch through the supplied query executor', async () => {
    let capturedSql = '';
    let capturedValues: unknown[] = [];
    const writer = createPostgresSearchTelemetryWriter({
      async query(sql, values) {
        capturedSql = sql;
        capturedValues = values ?? [];
        return [{ id: 'evt-1' }, { id: 'evt-2' }, { id: 'evt-3' }, { id: 'evt-4' }];
      }
    });

    const accepted = await writer.persistEvents(payloads);

    assert.equal(accepted, 4);
    assert.match(capturedSql, /search_telemetry_events/);
    assert.equal(capturedValues[0], 'search_suggestion_clicked');
  });
});
