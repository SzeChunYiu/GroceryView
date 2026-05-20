import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyNotificationSuppressions,
  buildNotificationOperationsReport,
  buildNotificationProviderReadinessReport,
  deliverDueNotifications,
  planNotificationOperationsAlerts,
  formatNotificationOperationsMetrics,
  planHumanReviewSlaNotifications,
  processNotificationSuppressionEvent,
  runRepositoryNotificationWorkerCycle,
  runNotificationWorkerTick
} from '../index.js';

describe('buildNotificationProviderReadinessReport', () => {
  it('fails closed when required provider credentials or health checks are missing', () => {
    const report = buildNotificationProviderReadinessReport({
      requiredChannels: ['push', 'email'],
      providers: [
        {
          channel: 'push',
          providerName: 'expo',
          configured: true,
          credentialsPresent: true,
          healthStatus: 'pass'
        },
        {
          channel: 'email',
          providerName: 'sendgrid',
          configured: false,
          credentialsPresent: false,
          healthStatus: 'not_run'
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'blocked',
      blockers: [
        'notification_provider_not_configured:email',
        'notification_provider_credentials_missing:email',
        'notification_provider_health_not_run:email'
      ],
      evidence: [
        'notification_provider_configured:push:expo',
        'notification_provider_credentials_present:push',
        'notification_provider_health_pass:push'
      ],
      warnings: [],
      summary: 'Notification provider readiness is blocked.'
    });
  });

  it('passes only when every required provider is configured with credentials and passing health', () => {
    const report = buildNotificationProviderReadinessReport({
      requiredChannels: ['push', 'email'],
      providers: [
        {
          channel: 'push',
          providerName: 'expo',
          configured: true,
          credentialsPresent: true,
          healthStatus: 'pass'
        },
        {
          channel: 'email',
          providerName: 'sendgrid',
          configured: true,
          credentialsPresent: true,
          healthStatus: 'pass'
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'ready',
      blockers: [],
      evidence: [
        'notification_provider_configured:push:expo',
        'notification_provider_credentials_present:push',
        'notification_provider_health_pass:push',
        'notification_provider_configured:email:sendgrid',
        'notification_provider_credentials_present:email',
        'notification_provider_health_pass:email'
      ],
      warnings: [],
      summary: 'Notification providers are ready.'
    });
  });
});

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

describe('formatNotificationOperationsMetrics', () => {
  it('exports notification operations reports as labeled metrics text', () => {
    const report = buildNotificationOperationsReport({
      now: '2026-05-19T12:00:00.000Z',
      staleAfterMinutes: 30,
      dueTasks: [{ id: 'task-stale', sendAt: '2026-05-19T11:00:00.000Z' }],
      workerSummary: { delivered: 4, notDue: 1, retryScheduled: 2, deadLettered: 1, suppressed: 3 },
      deliveries: [
        { status: 'failed_no_provider', channel: 'email', recipient: 'ops@example.com', reason: 'No email provider configured.' }
      ]
    });

    assert.equal(formatNotificationOperationsMetrics(report, { service: 'groceryview-server' }), [
      '# HELP groceryview_notification_worker_events_total Notification worker event counts by status.',
      '# TYPE groceryview_notification_worker_events_total gauge',
      'groceryview_notification_worker_events_total{service="groceryview-server",status="delivered"} 4',
      'groceryview_notification_worker_events_total{service="groceryview-server",status="not_due"} 1',
      'groceryview_notification_worker_events_total{service="groceryview-server",status="retry_scheduled"} 2',
      'groceryview_notification_worker_events_total{service="groceryview-server",status="dead_lettered"} 1',
      'groceryview_notification_worker_events_total{service="groceryview-server",status="suppressed"} 3',
      '# HELP groceryview_notification_provider_failures_total Notification provider failures in the worker cycle.',
      '# TYPE groceryview_notification_provider_failures_total gauge',
      'groceryview_notification_provider_failures_total{service="groceryview-server"} 1',
      '# HELP groceryview_notification_stale_due_tasks_total Notification tasks already due beyond the stale threshold.',
      '# TYPE groceryview_notification_stale_due_tasks_total gauge',
      'groceryview_notification_stale_due_tasks_total{service="groceryview-server"} 1',
      '# HELP groceryview_notification_operations_blocked Notification operations blocked status, 1 when blocked.',
      '# TYPE groceryview_notification_operations_blocked gauge',
      'groceryview_notification_operations_blocked{service="groceryview-server"} 1'
    ].join('\n'));
  });

  it('escapes metric labels for safe scraping', () => {
    const report = buildNotificationOperationsReport({
      now: '2026-05-19T12:00:00.000Z',
      staleAfterMinutes: 30,
      dueTasks: [],
      workerSummary: { delivered: 0, notDue: 0, retryScheduled: 0, deadLettered: 0, suppressed: 0 },
      deliveries: []
    });

    assert.match(
      formatNotificationOperationsMetrics(report, { service: 'groceryview"server\\prod' }),
      /service="groceryview\\"server\\\\prod"/
    );
  });
});

describe('planNotificationOperationsAlerts', () => {
  it('routes blocked notification operations reports to configured recipients', () => {
    const report = buildNotificationOperationsReport({
      now: '2026-05-19T12:00:00.000Z',
      staleAfterMinutes: 30,
      dueTasks: [{ id: 'task-stale', sendAt: '2026-05-19T11:00:00.000Z' }],
      workerSummary: { delivered: 4, notDue: 1, retryScheduled: 2, deadLettered: 1, suppressed: 3 },
      deliveries: [
        { status: 'failed_provider_error', channel: 'push', recipient: 'device-2', reason: 'provider down' }
      ]
    });

    const alerts = planNotificationOperationsAlerts({
      now: '2026-05-19T12:05:00.000Z',
      report,
      recipients: [
        { channel: 'email', recipient: 'ops@example.com' },
        { channel: 'push', recipient: 'ops-device' }
      ]
    });

    assert.deepEqual(alerts.map((alert) => ({
      channel: alert.channel,
      recipient: alert.recipient,
      type: alert.type,
      title: alert.title,
      priority: alert.priority,
      sendAt: alert.sendAt
    })), [
      {
        channel: 'email',
        recipient: 'ops@example.com',
        type: 'notification_operations_blocked',
        title: 'Notification operations blocked',
        priority: 'high',
        sendAt: '2026-05-19T12:05:00.000Z'
      },
      {
        channel: 'push',
        recipient: 'ops-device',
        type: 'notification_operations_blocked',
        title: 'Notification operations blocked',
        priority: 'high',
        sendAt: '2026-05-19T12:05:00.000Z'
      }
    ]);
    assert.match(alerts[0].body, /notification_dead_letters_present/);
    assert.match(alerts[0].body, /notification_provider_failures_present/);
    assert.match(alerts[0].body, /task-stale/);
    assert.match(alerts[0].body, /notification_retries_scheduled/);
  });

  it('does not alert when notification operations are healthy', () => {
    const alerts = planNotificationOperationsAlerts({
      now: '2026-05-19T12:05:00.000Z',
      report: buildNotificationOperationsReport({
        now: '2026-05-19T12:00:00.000Z',
        staleAfterMinutes: 30,
        dueTasks: [],
        workerSummary: { delivered: 1, notDue: 0, retryScheduled: 0, deadLettered: 0, suppressed: 0 },
        deliveries: []
      }),
      recipients: [{ channel: 'email', recipient: 'ops@example.com' }]
    });

    assert.deepEqual(alerts, []);
  });
});

describe('runRepositoryNotificationWorkerCycle', () => {
  it('loads due tasks and suppressions, persists acknowledgements, and returns report plus alerts', async () => {
    const sent: string[] = [];
    const updates: unknown[] = [];
    const result = await runRepositoryNotificationWorkerCycle({
      now: '2026-05-19T12:00:00.000Z',
      retryDelayMinutes: 30,
      staleAfterMinutes: 20,
      alertRecipients: [{ channel: 'email', recipient: 'ops@example.com' }],
      repository: {
        listDueNotificationTasks: async () => [
          {
            id: 'deliver-task',
            channel: 'push',
            type: 'target_price',
            title: 'Coffee deal',
            body: 'Below target',
            priority: 'high',
            sendAt: '2026-05-19T11:55:00.000Z',
            recipient: 'device-1',
            attemptCount: 0,
            maxAttempts: 3,
            status: 'queued'
          },
          {
            id: 'suppressed-task',
            channel: 'email',
            type: 'weekly_report',
            title: 'Weekly report',
            body: 'Summary',
            priority: 'normal',
            sendAt: '2026-05-19T11:00:00.000Z',
            recipient: 'unsubscribed@example.com',
            attemptCount: 0,
            maxAttempts: 3,
            status: 'queued'
          },
          {
            id: 'retry-task',
            channel: 'email',
            type: 'budget_alert',
            title: 'Budget',
            body: 'Check basket',
            priority: 'high',
            sendAt: '2026-05-19T11:20:00.000Z',
            recipient: 'user@example.com',
            attemptCount: 1,
            maxAttempts: 3,
            status: 'queued'
          }
        ],
        listActiveNotificationSuppressions: async () => [
          { recipient: 'unsubscribed@example.com', channel: 'email', reason: 'unsubscribed', active: true }
        ],
        upsertNotificationTask: async (task) => {
          updates.push(task);
        }
      },
      providers: {
        push: { send: async (message) => { sent.push(`push:${message.recipient}`); return 'push-1'; } }
      }
    });

    assert.deepEqual(sent, ['push:device-1']);
    assert.deepEqual(updates.map((task) => ({
      id: (task as { id: string }).id,
      status: (task as { status: string }).status,
      attemptCount: (task as { attemptCount: number }).attemptCount,
      sendAt: (task as { sendAt: string }).sendAt
    })), [
      { id: 'deliver-task', status: 'delivered', attemptCount: 0, sendAt: '2026-05-19T11:55:00.000Z' },
      { id: 'suppressed-task', status: 'suppressed', attemptCount: 0, sendAt: '2026-05-19T11:00:00.000Z' },
      { id: 'retry-task', status: 'queued', attemptCount: 2, sendAt: '2026-05-19T12:30:00.000Z' }
    ]);
    assert.deepEqual(result.report.status, 'blocked');
    assert.deepEqual(result.report.blockers, ['notification_provider_failures_present', 'notification_due_queue_stale']);
    assert.deepEqual(result.alerts.map((alert) => alert.recipient), ['ops@example.com']);
    assert.deepEqual(result.persistedTaskUpdates.map((task) => task.id), ['deliver-task', 'suppressed-task', 'retry-task']);
  });

  it('returns a healthy no-op cycle when no due tasks exist', async () => {
    const result = await runRepositoryNotificationWorkerCycle({
      now: '2026-05-19T12:00:00.000Z',
      retryDelayMinutes: 30,
      staleAfterMinutes: 20,
      repository: {
        listDueNotificationTasks: async () => [],
        listActiveNotificationSuppressions: async () => [],
        upsertNotificationTask: async () => {
          throw new Error('No updates expected.');
        }
      },
      providers: {}
    });

    assert.deepEqual(result.worker.summary, { delivered: 0, notDue: 0, retryScheduled: 0, deadLettered: 0, suppressed: 0 });
    assert.equal(result.report.status, 'healthy');
    assert.deepEqual(result.alerts, []);
    assert.deepEqual(result.persistedTaskUpdates, []);
  });
});
