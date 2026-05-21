import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('notification worker HTTP route', () => {
  it('runs the configured notification worker cycle behind the metrics token', async () => {
    const handle = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      notificationWorkerRunner: async () => ({
        dueTasks: [
          {
            id: 'task-1',
            channel: 'email',
            type: 'price_alert',
            title: 'Coffee dropped',
            body: 'Zoegas is below target.',
            priority: 'high',
            sendAt: '2026-05-20T08:00:00.000Z',
            recipient: 'shopper@example.com',
            attemptCount: 0,
            maxAttempts: 3,
            status: 'queued'
          }
        ],
        suppressions: [],
        persistedTaskUpdates: [
          {
            id: 'task-1',
            channel: 'email',
            type: 'price_alert',
            title: 'Coffee dropped',
            body: 'Zoegas is below target.',
            priority: 'high',
            sendAt: '2026-05-20T08:00:00.000Z',
            recipient: 'shopper@example.com',
            attemptCount: 0,
            maxAttempts: 3,
            status: 'delivered'
          }
        ],
        alerts: [],
        worker: {
          deliveries: [
            { status: 'sent', channel: 'email', recipient: 'shopper@example.com', providerMessageId: 'email-1' }
          ],
          acknowledgements: [
            { taskId: 'task-1', status: 'delivered', providerMessageId: 'email-1' }
          ],
          summary: {
            delivered: 1,
            notDue: 0,
            retryScheduled: 0,
            deadLettered: 0,
            suppressed: 0
          }
        },
        report: {
          status: 'healthy',
          metrics: {
            delivered: 1,
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
        }
      })
    });

    const unauthorized = await handle(new Request('http://localhost/api/workers/notifications/run', { method: 'POST' }));
    assert.equal(unauthorized.status, 401);

    const response = await handle(new Request('http://localhost/api/workers/notifications/run', {
      method: 'POST',
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(response.status, 202);
    assert.deepEqual(await json(response), {
      accepted: true,
      dueTaskCount: 1,
      suppressionCount: 0,
      persistedTaskUpdateCount: 1,
      alertCount: 0,
      worker: {
        delivered: 1,
        notDue: 0,
        retryScheduled: 0,
        deadLettered: 0,
        suppressed: 0
      },
      report: {
        status: 'healthy',
        metrics: {
          delivered: 1,
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
      }
    });
  });

  it('fails closed without a token, configured runner, or successful worker execution', async () => {
    const missingToken = createHttpHandler(undefined, {
      notificationWorkerRunner: async () => {
        throw new Error('should not run without token');
      }
    });
    assert.equal((await missingToken(new Request('http://localhost/api/workers/notifications/run', { method: 'POST' }))).status, 503);

    const missingRunner = createHttpHandler(undefined, { notificationMetricsToken: 'metrics-token' });
    assert.equal((await missingRunner(new Request('http://localhost/api/workers/notifications/run', {
      method: 'POST',
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }))).status, 503);

    const throwingRunner = createHttpHandler(undefined, {
      notificationMetricsToken: 'metrics-token',
      notificationWorkerRunner: async () => {
        throw new Error('provider down');
      }
    });
    const response = await throwingRunner(new Request('http://localhost/api/workers/notifications/run', {
      method: 'POST',
      headers: { 'x-groceryview-metrics-token': 'metrics-token' }
    }));
    assert.equal(response.status, 503);
    assert.deepEqual((await json(response) as { report: { blockers: string[] } }).report.blockers, ['notification_worker_run_failed']);
  });
});
