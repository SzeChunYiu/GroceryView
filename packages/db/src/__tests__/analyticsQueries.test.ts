import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildTrendingItemsQuery,
  insertSearchTelemetryEvents,
  mapTrendingItemRow,
  queryTrendingItemsReport
} from '../queries/analytics.js';

describe('analytics queries', () => {
  it('builds a 7-day trending item query from price-check and list-add events', () => {
    const query = buildTrendingItemsQuery({
      since: '2026-05-18T00:00:00.000Z',
      until: '2026-05-25T00:00:00.000Z',
      limit: 10
    });

    assert.deepEqual(query.values, ['2026-05-18T00:00:00.000Z', '2026-05-25T00:00:00.000Z', 10]);
    assert.match(query.sql, /from analytics_events/i);
    assert.match(query.sql, /event_name in \('price_check', 'list_add'\)/i);
    assert.match(query.sql, /join products on products\.id = analytics_events\.product_id/i);
    assert.match(query.sql, /order by event_count desc, latest_event_at desc/i);
  });

  it('maps trending event rows into API-ready ranked items', () => {
    assert.deepEqual(mapTrendingItemRow({
      product_id: 'product-1',
      product_slug: 'coffee',
      product_name: 'Coffee',
      price_check_count: '7',
      list_add_count: '3',
      event_count: '10',
      latest_event_at: '2026-05-24T12:00:00.000Z'
    }, 1), {
      eventCount: 10,
      latestEventAt: '2026-05-24T12:00:00.000Z',
      listAddCount: 3,
      priceCheckCount: 7,
      productId: 'product-1',
      productName: 'Coffee',
      productSlug: 'coffee',
      rank: 2
    });
  });

  it('queries a bounded 7-day trending report', async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const report = await queryTrendingItemsReport({
      async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
        calls.push({ sql, params });
        return [{
          product_id: 'product-1',
          product_slug: 'coffee',
          product_name: 'Coffee',
          price_check_count: 7,
          list_add_count: 3,
          event_count: 10,
          latest_event_at: '2026-05-24T12:00:00.000Z'
        }] as T[];
      }
    }, {
      limit: 60,
      now: '2026-05-25T00:00:00.000Z'
    });

    assert.equal(report.limit, 50);
    assert.equal(report.windowDays, 7);
    assert.equal(report.windowStart, '2026-05-18T00:00:00.000Z');
    assert.equal(report.windowEnd, '2026-05-25T00:00:00.000Z');
    assert.equal(report.items[0].eventCount, 10);
    assert.deepEqual(calls[0].params, ['2026-05-18T00:00:00.000Z', '2026-05-25T00:00:00.000Z', 50]);
  });

  it('persists accepted search telemetry events into analytics_events metadata', async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const persisted = await insertSearchTelemetryEvents({
      async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
        calls.push({ sql, params });
        return [] as T[];
      }
    }, [
      {
        eventName: 'search_suggestion_clicked',
        occurredAt: '2026-05-25T12:00:00.000Z',
        query: 'mjolk',
        anonymousId: 'anon-1',
        payload: { resultId: 'milk-1', resultRank: 1 }
      },
      {
        eventName: 'search_suggestions_dismissed',
        occurredAt: '2026-05-25T12:01:00.000Z',
        query: 'kaffe',
        payload: { reason: 'escape' }
      },
      {
        eventName: 'search_first_result_time',
        occurredAt: '2026-05-25T12:02:00.000Z',
        query: 'banan',
        payload: { elapsedMs: 84, resultCount: 8 }
      },
      {
        eventName: 'search_stream_event',
        occurredAt: '2026-05-25T12:03:00.000Z',
        query: 'pasta',
        payload: { streamEvent: 'first_chunk', elapsedMs: 34 }
      }
    ]);

    assert.equal(persisted, 4);
    assert.match(calls[0]?.sql ?? '', /insert into analytics_events/i);
    assert.match(calls[0]?.sql ?? '', /anonymous_id/i);
    assert.match(calls[0]?.sql ?? '', /metadata/i);
    assert.deepEqual(calls[0]?.params?.slice(0, 4), [
      'search_suggestion_clicked',
      'anon-1',
      { resultId: 'milk-1', resultRank: 1, query: 'mjolk' },
      '2026-05-25T12:00:00.000Z'
    ]);
  });
});
