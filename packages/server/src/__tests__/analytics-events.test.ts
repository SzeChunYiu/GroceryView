import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  emitServerAnalyticsEvent,
  queryLengthBucket,
  resetServerAnalyticsEventsForTests,
  snapshotServerAnalyticsEvents
} from '../analytics/events.js';

describe('server analytics events', () => {
  it('buckets events without retaining blocked metadata keys', () => {
    resetServerAnalyticsEventsForTests();
    emitServerAnalyticsEvent({
      eventName: 'search_submitted',
      sessionId: 'test-session',
      pagePath: '/api/products/search',
      metadata: {
        query_length_bucket: queryLengthBucket(12),
        result_count: 3,
        search_term: 'should be stripped' as unknown as string
      }
    });

    const buckets = snapshotServerAnalyticsEvents();
    assert.equal(buckets.length, 1);
    assert.equal(buckets[0]?.count, 1);
    assert.equal(buckets[0]?.eventName, 'search_submitted');
  });

  it('classifies query length buckets for privacy-safe search telemetry', () => {
    assert.equal(queryLengthBucket(0), 'empty');
    assert.equal(queryLengthBucket(2), '1-3');
    assert.equal(queryLengthBucket(10), '9-16');
    assert.equal(queryLengthBucket(20), '17+');
  });
});
