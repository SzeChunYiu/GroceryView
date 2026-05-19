import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyNotificationSuppressions,
  buildNotificationOperationsReport,
  deliverDueNotifications,
  planHumanReviewSlaNotifications,
  processNotificationSuppressionEvent,
  runNotificationWorkerTick
} from '../index.js';

describe('deliverDueNotifications', () => {
  it('sends due push and email notifications through provider adapters and records results', async () => {
    const sent: string[] = [];
    const results = await deliverDueNotifications({
      now: '2026-05-19T10:00:00.000Z',
      notifications: [
        { channel: 'push', type: 'target_price', title: 'Coffee deal', body: 'Zoegas below 50 SEK', priority: 'high', sendAt: '2026-05-19T09:59:00.000Z', recipient: 'device-1' },
        { channel: 'email', type: 'weekly_report', title: 'Weekly report', body: 'You saved 58 SEK', priority: 'normal', sendAt: '2026-05-19T10:00:00.000Z', recipient: 'user@example.com' },
        { channel: 'push', type: 'budget_alert', title: 'Later budget alert', body: 'Review basket', priority: 'normal', sendAt: '2026-05-19T11:00:00.000Z', recipient: 'device-2' }
      ],
      providers: {
        push: { send: async (message) => { sent.push(`push:${message.recipient}:${message.title}`); return 'push-provider-id'; } },
        email: { send: async (message) => { sent.push(`email:${message.recipient}:${message.title}`); return 'email-provider-id'; } }
      }
    });

    assert.deepEqual(sent, ['push:device-1:Coffee deal', 'email:user@example.com:Weekly report']);
    assert.deepEqual(results, [
      { status: 'sent', channel: 'push', recipient: 'device-1', providerMessageId: 'push-provider-id' },
      { status: 'sent', channel: 'email', recipient: 'user@example.com', providerMessageId: 'email-provider-id' },
      { status: 'skipped_not_due', channel: 'push', recipient: 'device-2' }
    ]);
  });

  it('fails closed when a due notification has no configured provider', async () => {
    const results = await deliverDueNotifications({
      now: '2026-05-19T10:00:00.000Z',
      notifications: [
        { channel: 'email', type: 'budget_alert', title: 'Budget', body: 'Over budget', priority: 'high', sendAt: '2026-05-19T09:00:00.000Z', recipient: 'user@example.com' }
      ],
      providers: {}
    });

    assert.deepEqual(results, [
      { status: 'failed_no_provider', channel: 'email', recipient: 'user@example.com', reason: 'No email provider configured.' }
    ]);
  });
});


describe('runNotificationWorkerTick', () => {
  it('delivers due worker tasks and keeps future tasks queued', async () => {
    const sent: string[] = [];
    const result = await runNotificationWorkerTick({
      now: '2026-05-19T10:00:00.000Z',
      retryDelayMinutes: 15,
      tasks: [
        { id: 'task-1', attemptCount: 0, maxAttempts: 3, notification: { channel: 'push', type: 'target_price', title: 'Coffee deal', body: 'Zoegas below 50 SEK', priority: 'high', sendAt: '2026-05-19T09:59:00.000Z', recipient: 'device-1' } },
        { id: 'task-2', attemptCount: 0, maxAttempts: 3, notification: { channel: 'email', type: 'weekly_report', title: 'Weekly report', body: 'Summary later', priority: 'normal', sendAt: '2026-05-19T11:00:00.000Z', recipient: 'user@example.com' } }
      ],
      providers: {
        push: { send: async (message) => { sent.push(`${message.recipient}:${message.title}`); return 'push-1'; } }
      }
    });

    assert.deepEqual(sent, ['device-1:Coffee deal']);
    assert.deepEqual(result.acknowledgements, [
      { taskId: 'task-1', status: 'delivered', providerMessageId: 'push-1' },
      { taskId: 'task-2', status: 'not_due' }
    ]);
    assert.deepEqual(result.summary, { delivered: 1, notDue: 1, retryScheduled: 0, deadLettered: 0, suppressed: 0 });
  });

  it('suppresses due worker tasks before invoking providers', async () => {
    const sent: string[] = [];
    const result = await runNotificationWorkerTick({
      now: '2026-05-19T10:00:00.000Z',
      retryDelayMinutes: 15,
      suppressions: [
        { recipient: 'unsubscribed@example.com', channel: 'email', reason: 'unsubscribed', active: true },
        { recipient: 'device-2', channel: 'push', reason: 'complaint', active: false }
      ],
      tasks: [
        { id: 'suppressed-email', attemptCount: 0, maxAttempts: 3, notification: { channel: 'email', type: 'weekly_report', title: 'Weekly report', body: 'Summary', priority: 'normal', sendAt: '2026-05-19T09:00:00.000Z', recipient: 'unsubscribed@example.com' } },
        { id: 'sendable-push', attemptCount: 0, maxAttempts: 3, notification: { channel: 'push', type: 'target_price', title: 'Coffee deal', body: 'Below target', priority: 'high', sendAt: '2026-05-19T09:00:00.000Z', recipient: 'device-2' } }
      ],
      providers: {
        email: { send: async (message) => { sent.push(`email:${message.recipient}`); return 'email-1'; } },
        push: { send: async (message) => { sent.push(`push:${message.recipient}`); return 'push-1'; } }
      }
    });

    assert.deepEqual(sent, ['push:device-2']);
    assert.deepEqual(result.acknowledgements, [
      { taskId: 'suppressed-email', status: 'suppressed', reason: 'unsubscribed' },
      { taskId: 'sendable-push', status: 'delivered', providerMessageId: 'push-1' }
    ]);
    assert.deepEqual(result.summary, { delivered: 1, notDue: 0, retryScheduled: 0, deadLettered: 0, suppressed: 1 });
  });

  it('schedules retries before max attempts and dead-letters exhausted tasks', async () => {
    const result = await runNotificationWorkerTick({
      now: '2026-05-19T10:00:00.000Z',
      retryDelayMinutes: 30,
      tasks: [
        { id: 'retry-me', attemptCount: 1, maxAttempts: 3, notification: { channel: 'email', type: 'budget_alert', title: 'Budget', body: 'Check basket', priority: 'high', sendAt: '2026-05-19T09:00:00.000Z', recipient: 'user@example.com' } },
        { id: 'dead-letter-me', attemptCount: 2, maxAttempts: 3, notification: { channel: 'push', type: 'target_price', title: 'Coffee', body: 'Still due', priority: 'normal', sendAt: '2026-05-19T09:00:00.000Z', recipient: 'device-2' } }
      ],
      providers: {
        push: { send: async () => { throw new Error('provider down'); } }
      }
    });

    assert.deepEqual(result.acknowledgements, [
      {
        taskId: 'retry-me',
        status: 'retry_scheduled',
        attemptCount: 2,
        nextAttemptAt: '2026-05-19T10:30:00.000Z',
        reason: 'No email provider configured.'
      },
      {
        taskId: 'dead-letter-me',
        status: 'dead_lettered',
        attemptCount: 3,
        reason: 'provider down'
      }
    ]);
    assert.deepEqual(result.summary, { delivered: 0, notDue: 0, retryScheduled: 1, deadLettered: 1, suppressed: 0 });
  });
});

describe('planHumanReviewSlaNotifications', () => {
  it('plans high-priority SLA breach and due-soon alerts for review leads', () => {
    const notifications = planHumanReviewSlaNotifications({
      now: '2026-05-19T12:00:00.000Z',
      dueSoonHours: 2,
      recipients: [
        { channel: 'email', recipient: 'ops-lead@example.com' },
        { channel: 'push', recipient: 'ops-lead-device' }
      ],
      assignments: [
        {
          reviewId: 'review-overdue',
          subjectType: 'product_match',
          priority: 'high',
          assigneeId: 'moderator-1',
          dueAt: '2026-05-19T11:00:00.000Z',
          status: 'assigned'
        },
        {
          reviewId: 'review-due-soon',
          subjectType: 'community_report',
          priority: 'medium',
          assigneeId: 'moderator-2',
          dueAt: '2026-05-19T13:30:00.000Z',
          status: 'in_progress'
        },
        {
          reviewId: 'review-later',
          subjectType: 'product_match',
          priority: 'low',
          assigneeId: 'moderator-3',
          dueAt: '2026-05-20T12:00:00.000Z',
          status: 'assigned'
        },
        {
          reviewId: 'review-completed',
          subjectType: 'community_report',
          priority: 'high',
          assigneeId: 'moderator-4',
          dueAt: '2026-05-19T10:00:00.000Z',
          status: 'completed'
        }
      ]
    });

    assert.deepEqual(notifications.map((notification) => ({
      channel: notification.channel,
      type: notification.type,
      title: notification.title,
      priority: notification.priority,
      sendAt: notification.sendAt,
      recipient: notification.recipient
    })), [
      {
        channel: 'email',
        type: 'human_review_sla_breach',
        title: 'Human review SLA breached',
        priority: 'high',
        sendAt: '2026-05-19T12:00:00.000Z',
        recipient: 'ops-lead@example.com'
      },
      {
        channel: 'push',
        type: 'human_review_sla_breach',
        title: 'Human review SLA breached',
        priority: 'high',
        sendAt: '2026-05-19T12:00:00.000Z',
        recipient: 'ops-lead-device'
      },
      {
        channel: 'email',
        type: 'human_review_sla_due_soon',
        title: 'Human review SLA due soon',
        priority: 'high',
        sendAt: '2026-05-19T12:00:00.000Z',
        recipient: 'ops-lead@example.com'
      },
      {
        channel: 'push',
        type: 'human_review_sla_due_soon',
        title: 'Human review SLA due soon',
        priority: 'high',
        sendAt: '2026-05-19T12:00:00.000Z',
        recipient: 'ops-lead-device'
      }
    ]);
    assert.match(notifications[0].body, /review-overdue/);
    assert.match(notifications[2].body, /review-due-soon/);
  });

  it('returns no alerts when all open assignments are outside the due-soon window', () => {
    const notifications = planHumanReviewSlaNotifications({
      now: '2026-05-19T12:00:00.000Z',
      dueSoonHours: 2,
      recipients: [{ channel: 'email', recipient: 'ops-lead@example.com' }],
      assignments: [
        {
          reviewId: 'review-later',
          subjectType: 'product_match',
          priority: 'low',
          assigneeId: 'moderator-3',
          dueAt: '2026-05-20T12:00:00.000Z',
          status: 'assigned'
        }
      ]
    });

    assert.deepEqual(notifications, []);
  });
});

describe('applyNotificationSuppressions', () => {
  it('removes actively unsubscribed and bounced recipients before delivery', () => {
    const result = applyNotificationSuppressions({
      notifications: [
        {
          channel: 'email',
          type: 'weekly_report',
          title: 'Weekly report',
          body: 'Summary',
          priority: 'normal',
          sendAt: '2026-05-19T12:00:00.000Z',
          recipient: 'unsubscribed@example.com'
        },
        {
          channel: 'email',
          type: 'human_review_sla_breach',
          title: 'SLA breached',
          body: 'Review overdue',
          priority: 'high',
          sendAt: '2026-05-19T12:00:00.000Z',
          recipient: 'bounced@example.com'
        },
        {
          channel: 'push',
          type: 'target_price',
          title: 'Coffee deal',
          body: 'Below target',
          priority: 'high',
          sendAt: '2026-05-19T12:00:00.000Z',
          recipient: 'device-1'
        }
      ],
      suppressions: [
        { recipient: 'unsubscribed@example.com', channel: 'email', reason: 'unsubscribed', active: true },
        { recipient: 'bounced@example.com', reason: 'bounce', active: true },
        { recipient: 'device-1', channel: 'push', reason: 'complaint', active: false }
      ]
    });

    assert.deepEqual(result.sendable.map((notification) => notification.recipient), ['device-1']);
    assert.deepEqual(result.suppressed.map((item) => ({
      recipient: item.notification.recipient,
      channel: item.notification.channel,
      reason: item.reason
    })), [
      { recipient: 'unsubscribed@example.com', channel: 'email', reason: 'unsubscribed' },
      { recipient: 'bounced@example.com', channel: 'email', reason: 'bounce' }
    ]);
  });

  it('keeps a recipient sendable when suppression is for another channel', () => {
    const result = applyNotificationSuppressions({
      notifications: [
        {
          channel: 'push',
          type: 'target_price',
          title: 'Coffee deal',
          body: 'Below target',
          priority: 'high',
          sendAt: '2026-05-19T12:00:00.000Z',
          recipient: 'same-user-device'
        }
      ],
      suppressions: [
        { recipient: 'same-user-device', channel: 'email', reason: 'unsubscribed', active: true }
      ]
    });

    assert.equal(result.sendable.length, 1);
    assert.deepEqual(result.suppressed, []);
  });
});

describe('processNotificationSuppressionEvent', () => {
  it('turns unsubscribe, bounce, and complaint provider events into active suppression records', () => {
    const records = [
      processNotificationSuppressionEvent({
        provider: 'ses',
        eventType: 'unsubscribe',
        recipient: 'unsubscribed@example.com',
        channel: 'email',
        occurredAt: '2026-05-19T20:30:00.000Z',
        providerEventId: 'evt-unsub'
      }),
      processNotificationSuppressionEvent({
        provider: 'ses',
        eventType: 'bounce',
        recipient: 'bounced@example.com',
        channel: 'email',
        occurredAt: '2026-05-19T20:31:00.000Z',
        providerEventId: 'evt-bounce'
      }),
      processNotificationSuppressionEvent({
        provider: 'fcm',
        eventType: 'complaint',
        recipient: 'device-1',
        channel: 'push',
        occurredAt: '2026-05-19T20:32:00.000Z',
        providerEventId: 'evt-complaint'
      })
    ];

    assert.deepEqual(records, [
      {
        id: 'suppression-ses-evt-unsub',
        recipient: 'unsubscribed@example.com',
        channel: 'email',
        reason: 'unsubscribed',
        active: true,
        updatedAt: '2026-05-19T20:30:00.000Z',
        source: { provider: 'ses', providerEventId: 'evt-unsub', eventType: 'unsubscribe' }
      },
      {
        id: 'suppression-ses-evt-bounce',
        recipient: 'bounced@example.com',
        channel: 'email',
        reason: 'bounce',
        active: true,
        updatedAt: '2026-05-19T20:31:00.000Z',
        source: { provider: 'ses', providerEventId: 'evt-bounce', eventType: 'bounce' }
      },
      {
        id: 'suppression-fcm-evt-complaint',
        recipient: 'device-1',
        channel: 'push',
        reason: 'complaint',
        active: true,
        updatedAt: '2026-05-19T20:32:00.000Z',
        source: { provider: 'fcm', providerEventId: 'evt-complaint', eventType: 'complaint' }
      }
    ]);
  });

  it('deactivates an unsubscribe suppression on resubscribe events', () => {
    const record = processNotificationSuppressionEvent({
      provider: 'ses',
      eventType: 'resubscribe',
      recipient: 'user@example.com',
      channel: 'email',
      occurredAt: '2026-05-19T20:40:00.000Z',
      providerEventId: 'evt-resub'
    });

    assert.deepEqual(record, {
      id: 'suppression-ses-evt-resub',
      recipient: 'user@example.com',
      channel: 'email',
      reason: 'unsubscribed',
      active: false,
      updatedAt: '2026-05-19T20:40:00.000Z',
      source: { provider: 'ses', providerEventId: 'evt-resub', eventType: 'resubscribe' }
    });
  });
});

describe('buildNotificationOperationsReport', () => {
  it('summarizes worker health and blocks operations on stale queues, provider failures, and dead letters', () => {
    const report = buildNotificationOperationsReport({
      now: '2026-05-19T12:00:00.000Z',
      staleAfterMinutes: 30,
      dueTasks: [
        { id: 'task-fresh', sendAt: '2026-05-19T11:45:00.000Z' },
        { id: 'task-stale', sendAt: '2026-05-19T11:20:00.000Z' }
      ],
      workerSummary: { delivered: 4, notDue: 1, retryScheduled: 2, deadLettered: 1, suppressed: 3 },
      deliveries: [
        { status: 'sent', channel: 'push', recipient: 'device-1', providerMessageId: 'push-1' },
        { status: 'failed_no_provider', channel: 'email', recipient: 'ops@example.com', reason: 'No email provider configured.' },
        { status: 'failed_provider_error', channel: 'push', recipient: 'device-2', reason: 'provider down' }
      ]
    });

    assert.deepEqual(report, {
      status: 'blocked',
      metrics: {
        delivered: 4,
        notDue: 1,
        retryScheduled: 2,
        deadLettered: 1,
        suppressed: 3,
        providerFailures: 2,
        staleDueTasks: 1
      },
      blockers: [
        'notification_dead_letters_present',
        'notification_provider_failures_present',
        'notification_due_queue_stale'
      ],
      warnings: [
        'notification_retries_scheduled',
        'notification_suppressions_applied'
      ],
      staleTaskIds: ['task-stale']
    });
  });

  it('passes when worker delivery is healthy and due tasks are fresh', () => {
    const report = buildNotificationOperationsReport({
      now: '2026-05-19T12:00:00.000Z',
      staleAfterMinutes: 30,
      dueTasks: [{ id: 'task-fresh', sendAt: '2026-05-19T11:45:00.000Z' }],
      workerSummary: { delivered: 2, notDue: 0, retryScheduled: 0, deadLettered: 0, suppressed: 0 },
      deliveries: [
        { status: 'sent', channel: 'email', recipient: 'user@example.com', providerMessageId: 'email-1' }
      ]
    });

    assert.deepEqual(report, {
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
    });
  });
});
