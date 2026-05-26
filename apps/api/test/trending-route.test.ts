import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { optionalBoundedIntegerQueryParameter } from '../src/middleware/validate.js';
import { trendingRoutes } from '../src/routes/trending.js';

describe('trending API route contract', () => {
  it('describes GET /api/trending over 7-day price-check and list-add events', () => {
    assert.equal(trendingRoutes.controllerPath, 'api/trending');
    assert.equal(trendingRoutes.limitQueryParam, 'limit');
    assert.equal(trendingRoutes.defaultLimit, 10);
    assert.equal(trendingRoutes.maxLimit, 50);
    assert.match(trendingRoutes.description, /price-check or list-add event count over the past 7 days/);
    assert.deepEqual(trendingRoutes.responseFields, ['items', 'windowStart', 'windowEnd', 'windowDays', 'sortedBy']);
  });

  it('validates bounded integer query parameters for trending limits', () => {
    assert.equal(optionalBoundedIntegerQueryParameter({}, 'limit', { defaultValue: 10, min: 1, max: 50 }), 10);
    assert.equal(optionalBoundedIntegerQueryParameter({ limit: '25' }, 'limit', { defaultValue: 10, min: 1, max: 50 }), 25);
    assert.throws(
      () => optionalBoundedIntegerQueryParameter({ limit: '51' }, 'limit', { defaultValue: 10, min: 1, max: 50 }),
      /limit must be between 1 and 50/
    );
  });
});
