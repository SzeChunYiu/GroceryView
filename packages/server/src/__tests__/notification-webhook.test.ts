import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHttpHandler } from '../index.js';

function signBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

async function json(response: Response) {
  return response.json() as Promise<unknown>;
}

describe('notification suppression webhook route', () => {
  it('verifies the webhook signature and persists normalized suppression events', async () => {
    const persisted: Array<Record<string, unknown>> = [];
    const handle = createHttpHandler(undefined, {
      notificationWebhookSecret: 'webhook-secret',
      notificationSuppressionSink: {
        upsertNotificationSuppression: async (suppression) => {
          persisted.push(suppression);
        }
      }
    });
    const body = JSON.stringify({
      provider: 'ses',
      providerEventId: 'evt-unsub',
      eventType: 'unsubscribe',
      recipient: 'user@example.com',
      channel: 'email',
      occurredAt: '2026-05-19T21:10:00.000Z'
    });

    const response = await handle(new Request('http://localhost/api/notifications/suppression-events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-groceryview-signature': signBody(body, 'webhook-secret')
      },
      body
    }));

    assert.equal(response.status, 202);
    assert.deepEqual(await json(response), {
      accepted: true,
      persisted: true,
      suppressionId: 'suppression-ses-evt-unsub',
      active: true
    });
    assert.deepEqual(persisted, [
      {
        id: 'suppression-ses-evt-unsub',
        recipient: 'user@example.com',
        channel: 'email',
        reason: 'unsubscribed',
        active: true,
        updatedAt: '2026-05-19T21:10:00.000Z',
        source: { provider: 'ses', providerEventId: 'evt-unsub', eventType: 'unsubscribe' }
      }
    ]);
  });

  it('rejects unsigned or mismatched webhook bodies before persistence', async () => {
    const persisted: Array<Record<string, unknown>> = [];
    const handle = createHttpHandler(undefined, {
      notificationWebhookSecret: 'webhook-secret',
      notificationSuppressionSink: {
        upsertNotificationSuppression: async (suppression) => {
          persisted.push(suppression);
        }
      }
    });
    const body = JSON.stringify({
      provider: 'ses',
      providerEventId: 'evt-bounce',
      eventType: 'bounce',
      recipient: 'bounced@example.com',
      channel: 'email',
      occurredAt: '2026-05-19T21:11:00.000Z'
    });

    const response = await handle(new Request('http://localhost/api/notifications/suppression-events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-groceryview-signature': signBody(`${body}tampered`, 'webhook-secret')
      },
      body
    }));

    assert.equal(response.status, 401);
    assert.match((await json(response) as { error: string }).error, /valid notification webhook signature/i);
    assert.deepEqual(persisted, []);
  });

  it('fails closed when the webhook secret is not configured', async () => {
    const handle = createHttpHandler();
    const response = await handle(new Request('http://localhost/api/notifications/suppression-events', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'ses',
        providerEventId: 'evt-unsub',
        eventType: 'unsubscribe',
        recipient: 'user@example.com',
        channel: 'email',
        occurredAt: '2026-05-19T21:12:00.000Z'
      })
    }));

    assert.equal(response.status, 503);
    assert.match((await json(response) as { error: string }).error, /webhook secret is not configured/i);
  });

  it('fails closed when the webhook sink is not configured', async () => {
    const handle = createHttpHandler(undefined, { notificationWebhookSecret: 'webhook-secret' });
    const body = JSON.stringify({
      provider: 'fcm',
      providerEventId: 'evt-complaint',
      eventType: 'complaint',
      recipient: 'device-1',
      channel: 'push',
      occurredAt: '2026-05-19T21:12:00.000Z'
    });

    const response = await handle(new Request('http://localhost/api/notifications/suppression-events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-groceryview-signature': signBody(body, 'webhook-secret')
      },
      body
    }));

    assert.equal(response.status, 503);
    assert.match((await json(response) as { error: string }).error, /suppression sink is not configured/i);
  });
});
