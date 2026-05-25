import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchToSavingsFunnelDashboard, type SearchToSavingsFunnelEvent } from '../funnel.js';

test('builds aggregate search-to-savings funnel drop-offs by segment', () => {
  const events: SearchToSavingsFunnelEvent[] = [
    { step: 'landing_search', count: 100, market: 'se', device: 'mobile', accountState: 'guest', observedAt: '2026-05-24T10:00:00.000Z', source: 'web-client-aggregate' },
    { step: 'product_view', count: 70, market: 'se', device: 'mobile', accountState: 'guest', observedAt: '2026-05-24T10:01:00.000Z', source: 'web-client-aggregate' },
    { step: 'compare_view', count: 40, market: 'se', device: 'mobile', accountState: 'guest', observedAt: '2026-05-24T10:02:00.000Z', source: 'web-client-aggregate' },
    { step: 'watchlist_alert', count: 22, market: 'se', device: 'mobile', accountState: 'guest', observedAt: '2026-05-24T10:03:00.000Z', source: 'web-client-aggregate' },
    { step: 'basket_view', count: 16, market: 'se', device: 'mobile', accountState: 'guest', observedAt: '2026-05-24T10:04:00.000Z', source: 'web-client-aggregate' },
    { step: 'savings_action', count: 10, market: 'se', device: 'mobile', accountState: 'guest', observedAt: '2026-05-24T10:05:00.000Z', source: 'web-client-aggregate' },
    { step: 'landing_search', count: 30, market: 'no', device: 'desktop', accountState: 'account', observedAt: '2026-05-24T10:06:00.000Z', source: 'web-client-aggregate' },
    { step: 'savings_action', count: 15, market: 'no', device: 'desktop', accountState: 'account', observedAt: '2026-05-24T10:07:00.000Z', source: 'web-client-aggregate' }
  ];

  const dashboard = buildSearchToSavingsFunnelDashboard(events, '2026-05-24T11:00:00.000Z');

  assert.equal(dashboard.available, true);
  assert.equal(dashboard.observationCount, 303);
  assert.equal(dashboard.steps.find((step) => step.id === 'product_view')?.conversionFromPrevious, 70 / 130);
  assert.equal(dashboard.largestDropOff?.from, 'landing_search');
  assert.equal(dashboard.largestDropOff?.to, 'product_view');
  assert.equal(dashboard.segments[0]?.market, 'se');
  assert.equal(dashboard.segments[0]?.completionRate, 0.1);
  assert.match(dashboard.guardrail, /product ids, user ids, prices, and free-text search terms are not part/);
});

test('fails closed when no aggregate events are present', () => {
  const dashboard = buildSearchToSavingsFunnelDashboard([], '2026-05-24T11:00:00.000Z');

  assert.equal(dashboard.available, false);
  assert.equal(dashboard.observationCount, 0);
  assert.ok(dashboard.steps.every((step) => step.count === 0));
  assert.deepEqual(dashboard.segments, []);
  assert.match(dashboard.privacy, /cannot identify a shopper/);
});
