import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

describe('notification metrics endpoint', () => {
  it('requires a metrics token before exporting notification metrics', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      notificationMetricsProvider: async () => ({
        status: 'healthy',
        metrics: {
          delivered: 2,
          notDue: 0,
          retryScheduled: 0,
          deadLettered: 0,
          suppressed: 0,
          providerFailures: 0,
          staleDueTasks: 0
        },
        blockers: [],
        warnings: [],
        staleTaskIds: []
      })
    });

    const unauthorized = await handle(new Request('http://localhost/api/metrics/notifications'));
    assert.equal(unauthorized.status, 401);

    const authorized = await handle(new Request('http://localhost/api/metrics/notifications', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));

    assert.equal(authorized.status, 200);
    assert.match(authorized.headers.get('content-type') ?? '', /text\/plain/);
    assert.match(await authorized.text(), /groceryview_notification_worker_events_total\{service="groceryview-server",status="delivered"\} 2/);
  });

  it('fails closed when metrics token or provider are not configured', async () => {
    const missingToken = createHttpHandler(undefined, {
      notificationMetricsProvider: async () => ({
        status: 'healthy',
        metrics: {
          delivered: 0,
          notDue: 0,
          retryScheduled: 0,
          deadLettered: 0,
          suppressed: 0,
          providerFailures: 0,
          staleDueTasks: 0
        },
        blockers: [],
        warnings: [],
        staleTaskIds: []
      })
    });
    assert.equal((await missingToken(new Request('http://localhost/api/metrics/notifications'))).status, 503);

    const missingProvider = createHttpHandler(undefined, { notificationMetricsToken: 'metrics-token' });
    assert.equal((await missingProvider(new Request('http://localhost/api/metrics/notifications', {
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }))).status, 503);
  });
});
