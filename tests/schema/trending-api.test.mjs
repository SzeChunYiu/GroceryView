import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildTrendingItemsQuery,
  mapTrendingItemRow
} from '../../packages/db/src/queries/analytics.ts';

const route = readFileSync(new URL('../../apps/api/src/routes/trending.ts', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../../apps/api/src/trending/trending.controller.ts', import.meta.url), 'utf8');
const service = readFileSync(new URL('../../apps/api/src/trending/trending.service.ts', import.meta.url), 'utf8');
const validate = readFileSync(new URL('../../apps/api/src/middleware/validate.ts', import.meta.url), 'utf8');
const appModule = readFileSync(new URL('../../apps/api/src/app.module.ts', import.meta.url), 'utf8');

describe('trending API route', () => {
  it('queries price-check and list-add events for the past 7 days', () => {
    const query = buildTrendingItemsQuery({
      since: '2026-05-18T00:00:00.000Z',
      until: '2026-05-25T00:00:00.000Z',
      limit: 10
    });
    assert.deepEqual(query.values, ['2026-05-18T00:00:00.000Z', '2026-05-25T00:00:00.000Z', 10]);
    assert.match(query.sql, /from analytics_events/i);
    assert.match(query.sql, /event_name in \('price_check', 'list_add'\)/i);
    assert.match(query.sql, /order by event_count desc, latest_event_at desc/i);

    assert.equal(mapTrendingItemRow({
      product_id: 'product-1',
      product_slug: 'coffee',
      product_name: 'Coffee',
      price_check_count: '7',
      list_add_count: '3',
      event_count: '10',
      latest_event_at: '2026-05-24T12:00:00.000Z'
    }, 0).eventCount, 10);
  });

  it('wires GET /api/trending through validation, service, and app module', () => {
    assert.match(route, /controllerPath: 'api\/trending'/);
    assert.match(route, /price-check or list-add event count over the past 7 days/);
    assert.match(controller, /@Controller\(trendingRoutes\.controllerPath\)/);
    assert.match(controller, /@Get\(\)/);
    assert.match(controller, /optionalBoundedIntegerQueryParameter/);
    assert.match(service, /queryTrendingItemsReport/);
    assert.match(validate, /optionalBoundedIntegerQueryParameter/);
    assert.match(appModule, /TrendingModule/);
  });
});
