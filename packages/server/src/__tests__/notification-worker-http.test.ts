import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler, enqueueBestTimeToBuyAlertRulesFromPostgres } from '../index.js';

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

  it('queues best-time-to-buy alerts only when the target store category signal meets the threshold', async () => {
    const upserted: unknown[] = [];
    const queued = await enqueueBestTimeToBuyAlertRulesFromPostgres({
      now: '2026-05-20T08:00:00.000Z',
      executor: {
        query: async <T>(sql: string): Promise<T[]> => {
          if (sql.includes('from alert_rules')) {
            return [
              {
                id: 'rule-high',
                category_id: 'coffee',
                store_id: 'store-a',
                minimum_confidence: 0.8,
                channel: 'email',
                recipient: 'shopper@example.com'
              },
              {
                id: 'rule-low',
                category_id: 'tea',
                store_id: 'store-a',
                minimum_confidence: 0.8,
                channel: 'email',
                recipient: 'shopper@example.com'
              }
            ] as T[];
          }
          if (sql.includes('from category_signals')) {
            return [
              { category_id: 'coffee', store_id: 'store-a', confidence: 0.91 },
              { category_id: 'tea', store_id: 'store-a', confidence: 0.6 }
            ] as T[];
          }
          return [];
        }
      },
      repository: {
        upsertNotificationTask: async (task) => {
          upserted.push(task);
        }
      }
    });

    assert.equal(queued.length, 1);
    assert.equal(upserted.length, 1);
    assert.deepEqual(queued[0], {
      id: 'best-time-to-buy:rule-high:coffee:store-a',
      channel: 'email',
      type: 'price_alert',
      title: 'Best time to buy',
      body: 'A saved category signal at your target store reached 91% confidence.',
      priority: 'high',
      sendAt: '2026-05-20T08:00:00.000Z',
      recipient: 'shopper@example.com',
      attemptCount: 0,
      maxAttempts: 3,
      status: 'queued'
    });
  });
});
